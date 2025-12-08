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
      let context = "";
      if (p.name) context += `- 名前: ${p.name}\n`;
      if (p.age) context += `- 年齢: ${p.age}歳\n`;
      if (p.height) context += `- 身長: ${p.height}cm\n`;
      if (p.skinType) context += `- 肌質: ${p.skinType}\n`;
      if (p.hairStyle) context += `- 現在の髪型: ${p.hairStyle}\n`;
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
    // NOTE: コーデ診断ではユーザーのプロフィール情報をあえて使用せず、
    // 写真そのものの着こなしだけを客観的に評価するように変更しました。
    
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
              あなたはプロのメンズファッションスタイリスト「垢抜けアニキ」です。
              アップロードされた写真のコーディネートのみを純粋に分析し、誰が見ても納得できる辛口かつ的確なアドバイスを行ってください。
              ※個人の基本データ（身長や年齢など）は考慮せず、写真に写っている着こなしの完成度だけで判断すること。

              【診断の重要チェックポイント】
              1. サイズ感: オーバーサイズかジャストか。中途半端なサイズ選びで野暮ったくなっていないか？
              2. シルエット: 全体のバランス（Aライン、Yライン、Iライン）は整っているか？
              3. 色合わせ: 配色は3色以内に収まっているか？「モノトーン+1色」などの基本ルールは守れているか？
              4. 清潔感・トレンド: シワや汚れはないか？今のトレンド（シティボーイ、テック、ノームコア等）からズレすぎていないか？

              【出力ルール】
              - score: 100点満点で厳正に採点（忖度なし）。
              - critique: 150文字以内で、ズバッと本質を突く批評。「なんとなく良い」は禁止。「パンツの裾が余りすぎて足が短く見える」「色が多すぎて子供っぽい」など具体的に指摘すること。
              - improvements: 明日から実践できる具体的なテクニックを3つ（例:「ロールアップして足首を見せろ」「インナーに白Tを挟んで抜け感を出せ」など行動ベースで）。
              - recommendedItems: このコーデを完成させるために買い足すべき「具体的な」アイテム3選（「太めのスラックス」「シルバーのチェーンネックレス」など）。

              JSON形式で出力してください。
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
            critique: { type: Type.STRING, description: "具体的で的確な辛口批評（日本語、150文字以内）" },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "具体的な着こなしテクニックや改善アクション（日本語、短文）",
            },
            recommendedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "具体的なアイテム名（日本語）" },
                  reason: { type: Type.STRING, description: "選定理由（日本語、一言で）" },
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
      // ユーザー要望：的確なアドバイスのために推論リソースを確保
      thinkingConfig: {
        thinkingBudget: 2048, 
      },
      systemInstruction: `
        あなたは「アニキ」というペルソナだ。男子学生やファッション初心者のための、頼れる専属スタイリストとして振る舞え。
        
        【最重要：マイページデータの活用】
        ${userContext ? `
        現在会話している相手のスペック（基本データ）は以下の通りだ。
        ${userContext}
        
        このデータを常に参照し、会話に反映させろ。
        - 「お前の身長（...cm）なら、この丈感がベストだ」
        - 「...歳のうちは、こういう冒険もアリだ」
        - 「悩みである...については、こうすれば解決するぞ」
        
        のように、データに基づいたパーソナライズされたアドバイスを徹底せよ。
        ` : "相手のデータ（身長・年齢など）がまだ登録されていない。「マイページでプロフィール設定してくれれば、もっと的確なアドバイスができるぞ」と促しつつ、まずは身長と体重を聞き出せ。"}

        【行動指針：的確かつ簡潔に】
        1. 「具体的」に答えろ: 曖昧な表現はNG。ブランド名、アイテム名、色、サイズ感を指定しろ。
        2. 「短く」答えろ: 1レスは2〜3文、長くても150文字以内。
        3. 「トレンド」を押さえろ。
        
        口調は「〜だろ」「〜しろ」「任せろ」のような強気で頼れる兄貴口調（敬語禁止）。
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