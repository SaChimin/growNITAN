import { GoogleGenAI, Type } from "@google/genai";
import { FashionAnalysis, SearchResponse, SearchItem, UserProfile, FashionItem } from "../types";

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
              2. 150文字以内で、短くパンチの効いた辛口かつ愛のある批評（長文禁止）
              3. 具体的な改善点を3つ（ユーザーの体型や悩みを踏まえて、箇条書きで短く）
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
            critique: { type: Type.STRING, description: "全体の印象と批評（日本語、150文字以内）" },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "具体的な改善アドバイスのリスト（日本語、短文）",
            },
            recommendedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "アイテム名（日本語）" },
                  reason: { type: Type.STRING, description: "なぜこのアイテムが必要か（日本語、一言で）" },
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
        
        【最重要：話は短くしろ】
        返答は「極めて短く」「簡潔に」が絶対条件だ。
        長ったらしい講釈は垂れるな。1回の返答は基本的に「2〜3文以内」で収めろ。
        ユーザーはスマホで見ている。スクロールが必要な長文は嫌われるぞ。
        「要点だけ」をバシッと言い切れ。

        ${userContext ? `現在話している相手（ユーザー）の情報は以下の通りです。この情報を踏まえてアドバイスしてください：\n${userContext}` : ""}
        
        【ペルソナの指針】
        - 口調: 男らしく、短く、言い切る。「〜だろ」「〜じゃねぇか？」「任せろ」などの表現を使う。敬語は禁止。
        - 態度: 基本は応援しているが、甘やかすな。ダメなところはズバッと言う。
        - 日本語で会話する。

        【回答生成の絶対ルール】
        1. 推論と正確性: 正確に推論することは重要だが、出力結果は短くすること。
        2. 文脈の処理:
           - 過去の文脈を引きずりすぎるな。
           - 話題が変わったらゼロベースで回答しろ。
        3. その他:
           - 「他に聞きたいことはあるか？」のような締めくくりは不要。
           - 挨拶も最小限にしろ。
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

/**
 * Gets related items for the product detail view.
 * Mocks the logic by returning random items from DB excluding the current one.
 */
export const getRelatedItems = async (currentItemName: string): Promise<FashionItem[]> => {
    // Simulate slight network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Random shuffle
    const shuffled = [...MOCK_DB].sort(() => 0.5 - Math.random());
    
    // Return top 4 items that are NOT the current item
    return shuffled
        .filter(item => item.name !== currentItemName)
        .slice(0, 4)
        .map((item, idx) => ({
            id: `rel-${Date.now()}-${idx}`,
            name: item.name,
            brand: item.brand,
            description: item.description,
            searchQuery: item.searchQuery,
            imageUrl: `https://pollinations.ai/p/${encodeURIComponent(item.imagePrompt)}?width=400&height=500&model=flux&seed=${Math.floor(Math.random() * 1000)}`
        }));
};