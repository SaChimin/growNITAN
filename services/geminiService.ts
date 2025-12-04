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
      systemInstruction: `
        あなたは「アニキ」というペルソナです。男子学生にとっての、かっこよくて頼れる先輩・兄貴分として振る舞ってください。
        ユーザーの目標は、ファッションや身だしなみを改善し、自信を持ち、「垢抜ける」ことです。
        
        ${userContext ? `現在話している相手（ユーザー）の情報は以下の通りです。この情報を踏まえてアドバイスしてください：\n${userContext}` : ""}
        
        ペルソナの指針:
        - 口調: 男らしく、フランクで、親しみやすい。「〜だろ」「〜じゃねぇか？」「任せろ」などの表現を使う。敬語は使わない。
        - 態度: 基本は応援しているが、ダメなところははっきり指摘する。でも最後は必ず背中を押す。
        - 内容: 長文になりすぎないようにする。具体的で実行可能なアドバイスをする（服、髪型、スキンケア、筋トレ、マインドセットなど）。
        - 日本語で会話する。
      `,
    },
  });
};

// --- Mock Data for Search (No AI) ---

const MOCK_DB: SearchItem[] = [
  {
    name: "ヘビーウェイトオーバーサイズTシャツ",
    brand: "GU",
    price: "¥1,990",
    description: "厚手の生地で一枚でもサマになる最強Tシャツ。",
    imagePrompt: "white heavyweight oversized t-shirt men plain studio minimal high quality",
    searchQuery: "GU ヘビーウェイトTシャツ"
  },
  {
    name: "タックワイドパンツ",
    brand: "UNIQLO",
    price: "¥3,990",
    description: "きれいなシルエットで脚長効果抜群の神パンツ。",
    imagePrompt: "grey wide leg trousers men studio fashion clean minimal",
    searchQuery: "UNIQLO タックワイドパンツ メンズ"
  },
  {
    name: "エアリズムコットンオーバーサイズT",
    brand: "UNIQLO U",
    price: "¥1,990",
    description: "表面はコットン、裏面はエアリズムの快適ハイブリッド。",
    imagePrompt: "black oversized t-shirt men uniqlou texture studio",
    searchQuery: "ユニクロU エアリズムコットンオーバーサイズTシャツ"
  },
  {
    name: "スーパースター (Superstar)",
    brand: "adidas",
    price: "¥12,000",
    description: "ストリートの定番。どんなコーデにも合わせやすい。",
    imagePrompt: "adidas superstar sneakers white black stripes studio product",
    searchQuery: "adidas superstar 82"
  },
  {
    name: "リラックスフィットオープンカラーシャツ",
    brand: "Global Work",
    price: "¥4,500",
    description: "程よい抜け感が出る開襟シャツ。夏のマストバイ。",
    imagePrompt: "beige open collar shirt men relaxing fit summer studio",
    searchQuery: "メンズ オープンカラーシャツ"
  },
  {
    name: "574 Legacy",
    brand: "New Balance",
    price: "¥14,800",
    description: "履き心地抜群で、適度なボリューム感が今の気分。",
    imagePrompt: "new balance 574 grey sneakers men studio side view",
    searchQuery: "new balance 574 メンズ"
  },
  {
    name: "チェーンネックレス 50cm",
    brand: "LION HEART",
    price: "¥3,800",
    description: "首元のアクセントに。シンプルさが垢抜けの鍵。",
    imagePrompt: "silver chain necklace men minimalist jewelry studio close up",
    searchQuery: "メンズ シルバーネックレス シンプル"
  },
  {
    name: "バギーデニムパンツ",
    brand: "WEGO",
    price: "¥3,990",
    description: "トレンドの極太シルエット。古着ライクな着こなしに。",
    imagePrompt: "blue baggy denim jeans men vintage wash street style",
    searchQuery: "メンズ バギーデニム WEGO"
  },
  {
    name: "オックスフォードシャツ",
    brand: "MUJI (無印良品)",
    price: "¥2,990",
    description: "清潔感No.1。デートや少しきちんとした場に最適。",
    imagePrompt: "white oxford shirt men button down clean studio",
    searchQuery: "無印良品 オックスフォードシャツ メンズ"
  },
  {
    name: "ロゴキャップ",
    brand: "THE NORTH FACE",
    price: "¥4,800",
    description: "髪セットが面倒な時もこれさえ被ればおしゃれに。",
    imagePrompt: "black north face cap logo studio fashion hat",
    searchQuery: "ノースフェイス キャップ メンズ"
  },
    {
    name: "スウェットプルパーカ",
    brand: "GU",
    price: "¥2,990",
    description: "フードの立ち上がりが良く、小顔効果も期待できる。",
    imagePrompt: "grey hoodie men streetwear studio blank basic",
    searchQuery: "GU スウェットプルパーカ"
  },
  {
    name: "カーゴパンツ",
    brand: "Dickies",
    price: "¥6,500",
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