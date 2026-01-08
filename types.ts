export enum ViewState {
  HOME = 'HOME',
  COACH = 'COACH',
  SEARCH = 'SEARCH',
  FAVORITES = 'FAVORITES',
  PROFILE = 'PROFILE',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
  HISTORY = 'HISTORY'
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

export interface ChatRecommendation {
  name: string;
  imageUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  recommendations?: ChatRecommendation[];
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
  imagePrompt: string;
  searchQuery: string;
}

export interface SearchResponse {
  advice: string;
  items: SearchItem[];
}

export interface UserProfile {
  name: string;
  height: string;
  weight: string;
  age: string;
  skinType: string;
  hairStyle: string;
  concerns: string;
}