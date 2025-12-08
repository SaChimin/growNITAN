import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ExternalLink, Filter, ArrowUpDown, Image as ImageIcon, Clock, X, Shirt, Footprints, Watch, Briefcase, Layers, Scissors, Wallet } from 'lucide-react';
import { ViewState, SearchResponse, LoadingState, FashionItem, SearchItem } from '../types';
import { searchFashionItems } from '../services/geminiService';
import Spinner from './Spinner';

interface SearchViewProps {
  onNavigate: (view: ViewState) => void;
  initialQuery?: string;
  onItemSelect: (item: FashionItem) => void;
  onScrollDirectionChange?: (direction: 'up' | 'down') => void;
}

const SearchView: React.FC<SearchViewProps> = ({ onNavigate, initialQuery = '', onItemSelect, onScrollDirectionChange }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll Detection
  const lastScrollY = useRef(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY < 0) return;

    const diff = currentScrollY - lastScrollY.current;
    
    // 感度調整: 5px以上の移動で判定
    if (Math.abs(diff) > 5) {
        if (diff > 0) {
            onScrollDirectionChange?.('down');
        } else {
            onScrollDirectionChange?.('up');
        }
        lastScrollY.current = currentScrollY;
    }
  };

  useEffect(() => {
    // Load history from local storage
    const savedHistory = localStorage.getItem('akanuke_search_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    } else {
      inputRef.current?.focus();
    }
  }, [initialQuery]);

  const saveHistory = (newQuery: string) => {
    const cleanQuery = newQuery.trim();
    if (!cleanQuery) return;

    // Remove duplicates and add to top, limit to 10
    const updatedHistory = [cleanQuery, ...history.filter(h => h !== cleanQuery)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('akanuke_search_history', JSON.stringify(updatedHistory));
  };

  const removeHistoryItem = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item !== itemToRemove);
    setHistory(updatedHistory);
    localStorage.setItem('akanuke_search_history', JSON.stringify(updatedHistory));
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    saveHistory(searchQuery);

    setLoading({ isLoading: true, message: '商品を検索中...' });
    setResults(null);

    try {
      const data = await searchFashionItems(searchQuery);
      setResults(data);
    } catch (error) {
      console.error(error);
      // Fallback or error handling
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Generate Image URL using Pollinations AI
  const getImageUrl = (prompt: string, seed: number) => {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://pollinations.ai/p/${encodedPrompt}?width=400&height=500&model=flux&seed=${seed}`;
  };

  const handleItemClick = (item: SearchItem, seed: number) => {
    const imageUrl = getImageUrl(item.imagePrompt, seed);
    const fashionItem: FashionItem = {
        id: `search-${item.name}-${seed}`, // Temporary unique ID
        name: item.name,
        brand: item.brand,
        imageUrl: imageUrl,
        searchQuery: item.searchQuery,
        description: item.description
    };
    onItemSelect(fashionItem);
  };

  const handleMockFilter = () => {
      alert('絞り込み機能は現在開発中です。');
  };

  const handleMockSort = () => {
      alert('並び替え機能は現在開発中です。');
  };

  const trendCategories = [
    { label: 'トップス', icon: Shirt, query: 'メンズ トップス 人気' },
    { label: 'アウター', icon: Layers, query: 'メンズ アウター 新作' },
    { label: 'シューズ', icon: Footprints, query: 'メンズ スニーカー おすすめ' },
    { label: 'バッグ', icon: Briefcase, query: 'メンズ バッグ トレンド' },
    { label: 'アクセ', icon: Watch, query: 'メンズ アクセサリー シンプル' },
    { label: '小物', icon: Wallet, query: 'メンズ 財布 小物' },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-2 sticky top-0 z-10">
        <button 
          onClick={() => onNavigate(ViewState.HOME)}
          className="p-1 -ml-2 text-gray-500 hover:text-primary"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 bg-gray-100 rounded-md h-9 flex items-center px-3 gap-2">
          <Search size={16} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="アイテム、ブランド検索"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="bg-gray-300 rounded-full p-0.5 text-white">
                <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto no-scrollbar"
        onScroll={handleScroll}
      >
        {loading.isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
             <Spinner message={loading.message} />
          </div>
        ) : results ? (
          <div className="pb-20">
            {/* Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 mb-2">
                <span className="text-xs font-bold text-gray-500">{results.items.length}件</span>
                <div className="flex gap-4">
                    <button 
                        onClick={handleMockSort}
                        className="flex items-center text-xs font-bold text-gray-500 hover:text-primary"
                    >
                        <ArrowUpDown size={12} className="mr-1" />
                        おすすめ順
                    </button>
                    <button 
                        onClick={handleMockFilter}
                        className="flex items-center text-xs font-bold text-gray-500 hover:text-primary"
                    >
                        <Filter size={12} className="mr-1" />
                        絞り込み
                    </button>
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-2 px-2">
              {results.items.map((item, idx) => {
                  // Generate stable seed based on item name for consistent image
                  const seed = item.name.length + idx; 
                  return (
                    <div 
                    key={idx} 
                    onClick={() => handleItemClick(item, seed)}
                    className="bg-white block rounded-sm overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                    >
                    {/* Generated Image */}
                    <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                        <img 
                            src={getImageUrl(item.imagePrompt, seed)} 
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                        {/* Fallback if image fails or loading */}
                        <div className="hidden absolute inset-0 flex-col items-center justify-center text-gray-300">
                            <ImageIcon size={24} className="mb-1" />
                            <span className="text-[10px]">No Image</span>
                        </div>
                        
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/80 p-1.5 rounded-full backdrop-blur-sm">
                                <ExternalLink size={12} className="text-gray-600" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-3">
                        <div className="text-[10px] font-bold text-gray-400 mb-1 line-clamp-1">
                            {item.brand}
                        </div>
                        <div className="text-xs font-medium text-primary line-clamp-2 leading-tight h-8 mb-1">
                        {item.name}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-400 ml-auto">詳細 &gt;</span>
                        </div>
                    </div>
                    </div>
                  );
              })}
            </div>
            
            {results.items.length === 0 && (
                 <div className="p-8 text-center text-gray-400 text-sm">
                    アイテムが見つからなかったぜ...<br/>別の言葉で検索してみてくれ。
                 </div>
            )}
          </div>
        ) : (
           /* Empty State / Search History & Recommendations */
           <div className="p-4 pb-20">
             
             {/* Search History */}
             {history.length > 0 && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-gray-500">最近の検索</h3>
                        <button 
                            onClick={() => {
                                setHistory([]);
                                localStorage.removeItem('akanuke_search_history');
                            }}
                            className="text-[10px] text-gray-400 hover:text-red-500"
                        >
                            履歴をすべて削除
                        </button>
                    </div>
                    <div className="bg-white rounded-sm border border-gray-100 divide-y divide-gray-50">
                        {history.map((h, idx) => (
                            <div 
                                key={idx}
                                onClick={() => {
                                    setQuery(h);
                                    handleSearch(h);
                                }}
                                className="flex items-center justify-between px-4 py-3 active:bg-gray-50 cursor-pointer"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Clock size={16} className="text-gray-300 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">{h}</span>
                                </div>
                                <button
                                    onClick={(e) => removeHistoryItem(e, h)}
                                    className="p-1 -mr-2 text-gray-300 hover:text-gray-500"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
             )}

             <h3 className="text-xs font-bold text-gray-500 mb-3">人気の検索ワード</h3>
             <div className="flex flex-wrap gap-2">
                {['ワイドパンツ', '韓国ファッション', '白Tシャツ', 'ネックレス メンズ', 'セットアップ', 'スニーカー', '古着'].map(tag => (
                    <button 
                        key={tag}
                        onClick={() => { setQuery(tag); handleSearch(tag); }}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-secondary hover:text-secondary transition-colors"
                    >
                        {tag}
                    </button>
                ))}
             </div>
             
             <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-xs font-bold text-gray-500 mb-3">トレンドカテゴリー</h3>
                 <div className="grid grid-cols-3 gap-3">
                    {trendCategories.map((cat, index) => (
                        <div 
                            key={index}
                            onClick={() => { setQuery(cat.query); handleSearch(cat.query); }}
                            className="bg-white border border-gray-100 p-3 rounded-sm flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-gray-200 transition-colors shadow-sm aspect-square"
                        >
                            <cat.icon size={24} className="text-gray-500" strokeWidth={1.5} />
                            <span className="text-xs font-bold text-gray-600">{cat.label}</span>
                        </div>
                    ))}
                 </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;