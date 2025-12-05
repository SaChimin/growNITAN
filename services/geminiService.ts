import { GoogleGenAI, Type } from "@google/genai";
import { FashionAnalysis, SearchResponse, SearchItem, UserProfile } from "../types";

// Initialize the client
// NOTE: Ensure process.env.API_KEY is available in your environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DIAGNOSIS_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-flash";

/**
 * Retrieves user profile as a context string.
 */
const getUserProfileContext = (): string => {
  try {
    const savedProfile = localStorage.getItem('akanuke_user_profile');
    if (savedProfile) {
      const p: UserProfile = JSON.parse(savedProfile);
      let context = "【ユーザー情報】\n";
      if (p.age) context += `- 年齢: ${p.age}歳\n`;
      if (p.height) context += `- 身長: ${p.height}cm\n`;
      if (p.skinType) context += `- 肌質: ${p.skinType}\n`;
      if (p.hairStyle) context += `- 髪型: ${p.hairStyle}\n`;
      if (p.concerns) context += `- 悩み・目標: ${p.concerns}\n`;
      return context;
    }
  } catch (e) {
    console.error("Failed to load profile context", e);
  }
  return "";
};

/**
 * Sends an image to Gemini for fashion diagnosis.
 * Returns a structured JSON response.
 */
export const analyzeFashionImage = async (base64Image: string): Promise<FashionAnalysis> => {
  try {
    const userContext = getUserProfileContext();
    
    const response = await ai.models.generateContent({
      model: DIAGNOSIS_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `
              あなたは厳しくも頼れるプロのメンズファッションスタイリスト（頼れる兄貴分）です。
              「垢抜け」を目指す男子学生のために、この写真の服装を診断してください。
              
              ${userContext ? `以下のユーザー情報を考慮して、体型や年齢に合った具体的なアドバイスをしてください：\n${userContext}` : ""}

              以下の形式で日本語で出力してください：
              1. 100点満点でのスコア採点
              2. 短くパンチの効いた辛口かつ愛のある批評
              3. 具体的な改善点を3つ（ユーザーの体型や悩みを踏まえて）
              4. 買い足すべきおすすめアイテムを3つ（アイテム名、選定理由、Amazon検索用キーワード）
              
              JSON形式で返してください。
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "100点満点のファッションスコア" },
            critique: { type: Type.STRING, description: "全体の印象と批評（日本語）" },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "具体的な改善アドバイスのリスト（日本語）",
            },
            recommendedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "アイテム名（日本語）" },
                  reason: { type: Type.STRING, description: "なぜこのアイテムが必要か（日本語）" },
                  searchQuery: { type: Type.STRING, description: "Amazon検索用の短いキーワード（日本語）" },
                },
                required: ["name", "reason", "searchQuery"],
              },
            },
          },
          required: ["score", "critique", "improvements", "recommendedItems"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(response.text) as FashionAnalysis;
  } catch (error) {
    console.error("Diagnosis Error:", error);
    throw error;
  }
};

/**
 * Creates a chat session with the "Big Brother" persona.
 */
export const createCoachChat = () => {
  const userContext = getUserProfileContext();

  return ai.chats.create({
    model: CHAT_MODEL,
    config: {
      // ユーザー要望：時間がかかってもいいので正確に推論する
      // Thinking Budgetを設定し、推論能力を強化する
      thinkingConfig: {
        thinkingBudget: 2048, 
      },
      systemInstruction: `
        あなたは「アニキ」というペルソナです。男子学生にとっての、かっこよくて頼れる先輩・兄貴分として振る舞ってください。
        ユーザーの目標は、ファッションや身だしなみを改善し、自信を持ち、「垢抜ける」ことです。
        
        ${userContext ? `現在話している相手（ユーザー）の情報は以下の通りです。この情報を踏まえてアドバイスしてください：\n${userContext}` : ""}
        
        【ペルソナの指針】
        - 口調: 男らしく、フランクで、親しみやすい。「〜だろ」「〜じゃねぇか？」「任せろ」などの表現を使う。敬語は使わない。
        - 態度: 基本は応援しているが、ダメなところははっきり指摘する。でも最後は必ず背中を押す。
        - 日本語で会話する。

        【回答生成の絶対ルール】
        1. 推論と正確性: 時間がかかっても構わないので、正確に推論してください。事実と推測を明確に区別し、ハルシネーションの抑制を強く意識してください。
        2. 計算資源の活用: ユーザー側の思考レベルに合わせすぎず、持てる計算資源を最大限利用して高度な回答を作成してください。
        3. 会話と文章の区別: 通常の会話では冗長な生成を避け、簡潔に返答してください。一方で、解説や文章作成が求められる場面では全力のパフォーマンスを発揮してください。
        4. 文脈の処理:
           - メモリ・会話ログから取得した情報はあくまで内的な洞察の参考として扱い、表面的な引用（「さっき言ったように」など）は控えてください。
           - 重要性が高い場合にのみ会話ログの背景情報を参考にしてください。
           - 現在の話題と関係性が低い過去の文脈は無視してください。
           - 話題が変わったら、それまでの文脈を引きずらずにゼロベースで回答を考えてください。
        5. その他:
           - 必要性の低いフォローアップ質問（「他に聞きたいことはあるか？」等）は避けてください。
           - 似たような回答を繰り返さないでください。
      `,
    },
  });
};

// --- Mock Data for Search (No AI) ---

const MOCK_DB: SearchItem[] = [
  {
    name: "ヘビーウェイトオーバーサイズTシャツ",
    brand: "GU",
    description: "厚手の生地で一枚でもサマになる最強Tシャツ。",
    imagePrompt: "white heavyweight oversized t-shirt men plain studio minimal high quality",
    searchQuery: "GU ヘビーウェイトTシャツ"
  },
  {
    name: "タックワイドパンツ",
    brand: "UNIQLO",
    description: "きれいなシルエットで脚長効果抜群の神パンツ。",
    imagePrompt: "grey wide leg trousers men studio fashion clean minimal",
    searchQuery: "UNIQLO タックワイドパンツ メンズ"
  },
  {
    name: "エアリズムコットンオーバーサイズT",
    brand: "UNIQLO U",
    description: "表面はコットン、裏面はエアリズムの快適ハイブリッド。",
    imagePrompt: "black oversized t-shirt men uniqlou texture studio",
    searchQuery: "ユニクロU エアリズムコットンオーバーサイズTシャツ"
  },
  {
    name: "スーパースター (Superstar)",
    brand: "adidas",
    description: "ストリートの定番。どんなコーデにも合わせやすい。",
    imagePrompt: "adidas superstar sneakers white black stripes studio product",
    searchQuery: "adidas superstar 82"
  },
  {
    name: "リラックスフィットオープンカラーシャツ",
    brand: "Global Work",
    description: "程よい抜け感が出る開襟シャツ。夏のマストバイ。",
    imagePrompt: "beige open collar shirt men relaxing fit summer studio",
    searchQuery: "メンズ オープンカラーシャツ"
  },
  {
    name: "574 Legacy",
    brand: "New Balance",
    description: "履き心地抜群で、適度なボリューム感が今の気分。",
    imagePrompt: "new balance 574 grey sneakers men studio side view",
    searchQuery: "new balance 574 メンズ"
  },
  {
    name: "チェーンネックレス 50cm",
    brand: "LION HEART",
    description: "首元のアクセントに。シンプルさが垢抜けの鍵。",
    imagePrompt: "silver chain necklace men minimalist jewelry studio close up",
    searchQuery: "メンズ シルバーネックレス シンプル"
  },
  {
    name: "バギーデニムパンツ",
    brand: "WEGO",
    description: "トレンドの極太シルエット。古着ライクな着こなしに。",
    imagePrompt: "blue baggy denim jeans men vintage wash street style",
    searchQuery: "メンズ バギーデニム WEGO"
  },
  {
    name: "オックスフォードシャツ",
    brand: "MUJI (無印良品)",
    description: "清潔感No.1。デートや少しきちんとした場に最適。",
    imagePrompt: "white oxford shirt men button down clean studio",
    searchQuery: "無印良品 オックスフォードシャツ メンズ"
  },
  {
    name: "ロゴキャップ",
    brand: "THE NORTH FACE",
    description: "髪セットが面倒な時もこれさえ被ればおしゃれに。",
    imagePrompt: "black north face cap logo studio fashion hat",
    searchQuery: "ノースフェイス キャップ メンズ"
  },
    {
    name: "スウェットプルパーカ",
    brand: "GU",
    description: "フードの立ち上がりが良く、小顔効果も期待できる。",
    imagePrompt: "grey hoodie men streetwear studio blank basic",
    searchQuery: "GU スウェットプルパーカ"
  },
  {
    name: "カーゴパンツ",
    brand: "Dickies",
    description: "武骨な男らしさを演出できる定番ワークパンツ。",
    imagePrompt: "olive green cargo pants men tactical street studio",
    searchQuery: "Dickies カーゴパンツ メンズ"
  }
];

/**
 * Searches for fashion items using local mock data.
 * No AI is involved in this process.
 */
export const searchFashionItems = async (query: string): Promise<SearchResponse> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 600));

  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');

  if (!normalizedQuery) {
     return { advice: "", items: [] };
  }

  // Simple fuzzy matching
  const filteredItems = MOCK_DB.filter(item => {
     const textToCheck = (item.name + item.brand + item.description + item.searchQuery).toLowerCase().replace(/\s+/g, '');
     return textToCheck.includes(normalizedQuery) || normalizedQuery.includes(item.brand.toLowerCase());
  });

  // If no direct matches, return a random selection of popular items (to show something)
  const itemsToReturn = filteredItems.length > 0 
    ? filteredItems 
    : MOCK_DB.sort(() => 0.5 - Math.random()).slice(0, 4);

  return {
    advice: "", // No advice returned
    items: itemsToReturn
  };
};