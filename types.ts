export enum ViewState {
  HOME = 'HOME',
  DIAGNOSIS = 'DIAGNOSIS',
  CHAT = 'CHAT',
  SEARCH = 'SEARCH',
  FAVORITES = 'FAVORITES',
  PROFILE = 'PROFILE'
}

export interface FashionItem {
  id: string;
  name: string;
  brand: string;
  price: string;
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
  price: string;
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
  age: string;
  skinType: string;
  hairStyle: string;
  concerns: string;
}