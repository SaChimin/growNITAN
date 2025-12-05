import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ExternalLink, ShoppingBag, Filter, ArrowUpDown, Image as ImageIcon } from 'lucide-react';
import { ViewState, SearchResponse, LoadingState } from '../types';
import { searchFashionItems } from '../services/geminiService';
import Spinner from './Spinner';

interface SearchViewProps {
  onNavigate: (view: ViewState) => void;
  initialQuery?: string;
}

const SearchView: React.FC<SearchViewProps> = ({ onNavigate, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    } else {
      inputRef.current?.focus();
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

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

  // Generate Image URL using Pollinations AI (No API Key required)
  const getImageUrl = (prompt: string) => {
    const encodedPrompt = encodeURIComponent(prompt);
    // Adding seed ensures consistent image for same prompt, add random for variety if needed
    // Using Flux model for better photorealism
    return `https://pollinations.ai/p/${encodedPrompt}?width=400&height=500&model=flux&seed=${Math.floor(Math.random() * 100)}`;
  };

  const openSearch = (searchQuery: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + " メンズファッション 通販")}`;
    window.open(url, '_blank');
  };

  const handleMockFilter = () => {
      alert('絞り込み機能は現在開発中です。');
  };

  const handleMockSort = () => {
      alert('並び替え機能は現在開発中です。');
  };

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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading.isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
             <Spinner message={loading.message} />
          </div>
        ) : results ? (
          <div className="pb-20">
            {/* Advice Section Removed per request */}

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
              {results.items.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => openSearch(item.searchQuery)}
                  className="bg-white block rounded-sm overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                >
                  {/* Generated Image */}
                  <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                    <img 
                        src={getImageUrl(item.imagePrompt)} 
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
              ))}
            </div>
            
            {results.items.length === 0 && (
                 <div className="p-8 text-center text-gray-400 text-sm">
                    アイテムが見つからなかったぜ...<br/>別の言葉で検索してみてくれ。
                 </div>
            )}
          </div>
        ) : (
           /* Empty State / Search History Placeholder */
           <div className="p-4">
             <h3 className="text-xs font-bold text-gray-500 mb-3">人気の検索ワード</h3>
             <div className="flex flex-wrap gap-2">
                {['ワイドパンツ', '韓国ファッション', '白Tシャツ', 'ネックレス メンズ', 'セットアップ'].map(tag => (
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
                 <div className="grid grid-cols-2 gap-2">
                    <div 
                        onClick={() => { setQuery('メンズ トップス 新作'); handleSearch('メンズ トップス 新作'); }}
                        className="bg-gray-50 p-4 rounded-sm text-center cursor-pointer hover:bg-gray-100"
                    >
                        <span className="text-2xl block mb-1">👕</span>
                        <span className="text-xs font-bold">トップス</span>
                    </div>
                    <div 
                        onClick={() => { setQuery('メンズ パンツ トレンド'); handleSearch('メンズ パンツ トレンド'); }}
                        className="bg-gray-50 p-4 rounded-sm text-center cursor-pointer hover:bg-gray-100"
                    >
                        <span className="text-2xl block mb-1">👖</span>
                        <span className="text-xs font-bold">パンツ</span>
                    </div>
                 </div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;