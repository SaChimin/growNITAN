import { GoogleGenAI, Type } from "@google/genai";
import { FashionAnalysis, SearchResponse, SearchItem } from "../types";

// Initialize the client
// NOTE: Ensure process.env.API_KEY is available in your environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DIAGNOSIS_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-flash";
const SEARCH_MODEL = "gemini-2.5-flash";

/**
 * Sends an image to Gemini for fashion diagnosis.
 * Returns a structured JSON response.
 */
export const analyzeFashionImage = async (base64Image: string): Promise<FashionAnalysis> => {
  try {
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
              
              以下の形式で日本語で出力してください：
              1. 100点満点でのスコア採点
              2. 短くパンチの効いた辛口かつ愛のある批評
              3. 具体的な改善点を3つ
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
  return ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction: `
        あなたは「アニキ」というペルソナです。男子学生にとっての、かっこよくて頼れる先輩・兄貴分として振る舞ってください。
        ユーザーの目標は、ファッションや身だしなみを改善し、自信を持ち、「垢抜ける」ことです。
        
        ペルソナの指針:
        - 口調: 男らしく、フランクで、親しみやすい。「〜だろ」「〜じゃねぇか？」「任せろ」などの表現を使う。敬語は使わない。
        - 態度: 基本は応援しているが、ダメなところははっきり指摘する。でも最後は必ず背中を押す。
        - 内容: 長文になりすぎないようにする。具体的で実行可能なアドバイスをする（服、髪型、スキンケア、筋トレ、マインドセットなど）。
        - 日本語で会話する。
      `,
    },
  });
};

/**
 * Searches for fashion items using Google Search Grounding and returns a structured list.
 * Note: Google Search tool cannot be used with responseSchema directly in the SDK effectively sometimes,
 * so we ask for JSON in the prompt and parse it.
 */
export const searchFashionItems = async (query: string): Promise<SearchResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: `
        日本の男子学生向けファッション検索です。
        ユーザーの検索クエリ: "${query}"
        
        Google検索を使用してトレンドや具体的なアイテムを調査し、
        以下のJSONフォーマットのみを出力してください。Markdownのコードブロックは不要です。生JSONで返してください。
        
        {
          "advice": "検索結果に基づく、トレンドや選び方に関する短いアドバイス（日本語、アニキ口調）",
          "items": [
            {
              "name": "アイテム名（具体的、日本語）",
              "brand": "おすすめブランド名（なければ'ノーブランド'やカテゴリー名）",
              "price": "推定価格帯（例: ¥3,000〜）",
              "description": "アイテムの魅力や特徴（30文字程度、日本語）",
              "imagePrompt": "A high quality fashion photography of [Item Name], [Color], [Style], photorealistic, 8k, street snap style --v 5", 
              "searchQuery": "AmazonやZOZOで検索するためのキーワード"
            }
          ]
        }
        
        imagePromptは、そのアイテムの画像を生成AIで作成するための英語のプロンプトです。具体的かつ高品質な写真になるように記述してください。
        itemsは5件以上リストアップしてください。
      `,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let jsonString = response.text || "{}";
    
    // Clean up potential markdown code blocks
    jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const data = JSON.parse(jsonString) as SearchResponse;
      return data;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, jsonString);
      // Fallback response
      return {
        advice: "すまん、うまく情報を整理できなかった。もう一回検索してみてくれ。",
        items: []
      };
    }
  } catch (error) {
    console.error("Search Error:", error);
    throw error;
  }
};