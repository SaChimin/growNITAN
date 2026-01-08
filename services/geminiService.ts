
import { GoogleGenAI, Type } from "@google/genai";
import { FashionAnalysis, SearchResponse, SearchItem, UserProfile, FashionItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 最新の推奨モデルを使用
const MAIN_MODEL = "gemini-3-flash-preview";

/**
 * AIが返した文字列からJSON部分を抽出してパースする
 */
const safeParseJson = (text: string | undefined) => {
  if (!text) return null;
  try {
    // コードブロックが含まれている場合のクリーニング
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const targetText = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(targetText);
  } catch (e) {
    console.error("Failed to parse JSON from model response:", text);
    return null;
  }
};

const getUserProfileContext = (): string => {
  try {
    const savedProfile = localStorage.getItem('akanuke_user_profile');
    if (savedProfile) {
      const p: UserProfile = JSON.parse(savedProfile);
      return `
        【ユーザーデータ】
        - 名前: ${p.name || '未設定'}
        - 身長: ${p.height || '未設定'}cm
        - 体重: ${p.weight || '未設定'}kg
        - 年齢: ${p.age || '未設定'}歳
        - 肌質: ${p.skinType}
        - 髪型: ${p.hairStyle}
        - 悩み/目標: ${p.concerns || '特になし'}
      `;
    }
  } catch (e) {
    console.error("Failed to load profile context", e);
  }
  return "ユーザーデータ未登録";
};

export const analyzeFashionImage = async (base64Image: string): Promise<FashionAnalysis> => {
  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
        {
          text: `
            あなたは辛口ファッションアドバイザー「アニキ」です。
            提供された写真の着こなしを厳しく、かつ愛情を持って分析してください。
            サイズ感、シルエット、色使い、清潔感の4点を中心に評価すること。
            JSON形式で、score(0-100), critique(短評), improvements(3つの改善点), recommendedItems(おすすめ3点)を返してください。
          `,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER },
          critique: { type: Type.STRING },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                reason: { type: Type.STRING },
                searchQuery: { type: Type.STRING },
              },
              required: ["name", "reason", "searchQuery"],
            },
          },
        },
        required: ["score", "critique", "improvements", "recommendedItems"],
      },
    },
  });

  const parsed = safeParseJson(response.text);
  if (!parsed) throw new Error("Invalid response from AI");
  return parsed as FashionAnalysis;
};

export const createCoachChat = () => {
  const userContext = getUserProfileContext();

  return ai.chats.create({
    model: MAIN_MODEL,
    config: {
      responseMimeType: "application/json",
      systemInstruction: `
        あなたは「アニキ」です。頼れる兄貴分として、ユーザーのファッションや自分磨きをサポートしてください。
        ${userContext}
        上記データを踏まえ、パーソナライズされたアドバイスを行え。
        返答は常にJSON形式で、text(150文字以内のアニキ語返答)とrecommendedItems(画像生成用プロンプト付きのアイテム2点)を返せ。
      `,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          recommendedItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
              },
              required: ["name", "imagePrompt"]
            }
          }
        },
        required: ["text", "recommendedItems"]
      },
    },
  });
};

export { safeParseJson };

// モックデータはそのまま維持（検索機能用）
const MOCK_DB: SearchItem[] = [
  { name: "ヘビーウェイトオーバーサイズTシャツ", brand: "GU", description: "厚手の生地でサマになる。", imagePrompt: "white heavyweight oversized t-shirt men plain studio", searchQuery: "GU ヘビーウェイトTシャツ" },
  { name: "タックワイドパンツ", brand: "UNIQLO", description: "脚長効果抜群の神パンツ。", imagePrompt: "grey wide leg trousers men studio", searchQuery: "UNIQLO タックワイドパンツ メンズ" },
  { name: "スーパースター", brand: "adidas", description: "ストリートの定番。", imagePrompt: "adidas superstar sneakers white black stripes", searchQuery: "adidas superstar" }
];

export const searchFashionItems = async (query: string): Promise<SearchResponse> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const normalizedQuery = query.toLowerCase();
  const items = MOCK_DB.filter(item => 
    item.name.toLowerCase().includes(normalizedQuery) || 
    item.brand.toLowerCase().includes(normalizedQuery)
  );
  return { advice: "", items: items.length > 0 ? items : MOCK_DB.slice(0, 4) };
};

export const getRelatedItems = async (currentItemName: string): Promise<FashionItem[]> => {
  const shuffled = [...MOCK_DB].sort(() => 0.5 - Math.random());
  // Fix: Added missing searchQuery property to satisfy FashionItem interface requirement
  return shuffled.filter(i => i.name !== currentItemName).slice(0, 4).map((item, idx) => ({
    id: `rel-${idx}`,
    name: item.name,
    brand: item.brand,
    imageUrl: `https://pollinations.ai/p/${encodeURIComponent(item.imagePrompt)}?width=400&height=500&model=flux&seed=${idx}`,
    searchQuery: item.searchQuery
  }));
};
