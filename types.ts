export enum ViewState {
  HOME = 'HOME',
  COACH = 'COACH', // 診断とチャットを統合
  SEARCH = 'SEARCH',
  FAVORITES = 'FAVORITES',
  PROFILE = 'PROFILE',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL', // 追加: 商品詳細
  HISTORY = 'HISTORY' // 追加: 閲覧履歴
}

export interface FashionItem {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  searchQuery: string;
  description?: string;
}

export interface RecommendedItem {
  name: string;
  reason: string;
  searchQuery: string;
}

export interface FashionAnalysis {
  score: number;
  critique: string;
  improvements: string[];
  recommendedItems: RecommendedItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export interface SearchItem {
  name: string;
  brand: string;
  description: string;
  imagePrompt: string; // 英語の画像生成用プロンプト
  searchQuery: string; // 実際の購入検索用クエリ
}

export interface SearchResponse {
  advice: string;
  items: SearchItem[];
}

export interface UserProfile {
  name: string;
  height: string;
  weight: string; // 追加
  age: string;
  skinType: string;
  hairStyle: string;
  concerns: string;
}