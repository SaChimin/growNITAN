import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Heart, Search, Share2, ShoppingCart, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { FashionItem, ViewState } from '../types';
import { getRelatedItems } from '../services/geminiService';
import Spinner from './Spinner';
import Navigation from './Navigation';

interface ProductDetailViewProps {
  item: FashionItem;
  onBack: () => void;
  onItemSelect: (item: FashionItem) => void;
  onNavigate: (view: ViewState) => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ item, onBack, onItemSelect, onNavigate }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedItems, setRelatedItems] = useState<FashionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 閲覧履歴への保存
    try {
        const historyKey = 'akanuke_browsing_history';
        const savedHistory = localStorage.getItem(historyKey);
        let history: FashionItem[] = savedHistory ? JSON.parse(savedHistory) : [];
        
        // 重複排除（同じIDのアイテムがあれば削除して先頭に追加）
        history = history.filter(h => h.id !== item.id);
        history.unshift(item);
        
        // 最大30件まで保存
        if (history.length > 30) {
            history = history.slice(0, 30);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save browsing history", e);
    }

    // Check initial favorite state
    try {
      const saved = localStorage.getItem('akanuke_favorites_data');
      if (saved) {
        const items: FashionItem[] = JSON.parse(saved);
        setIsFavorite(items.some(i => i.id === item.id));
      }
    } catch (e) {
      console.error(e);
    }

    // Load related items
    const fetchRelated = async () => {
        setLoading(true);
        try {
            const data = await getRelatedItems(item.name);
            setRelatedItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchRelated();
  }, [item]);

  // スクロールイベントで最下部到達を判定
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 最下部から50px以内に入ったらナビゲーションを表示
    const isBottom = scrollHeight - scrollTop <= clientHeight + 50;
    
    // 状態が変わる場合のみ更新
    if (isBottom !== showNav) {
        setShowNav(isBottom);
    }
  };

  const toggleFavorite = () => {
    try {
      const saved = localStorage.getItem('akanuke_favorites_data');
      let currentFavorites: FashionItem[] = saved ? JSON.parse(saved) : [];

      if (isFavorite) {
        currentFavorites = currentFavorites.filter(f => f.id !== item.id);
      } else {
        currentFavorites.push(item);
      }
      
      localStorage.setItem('akanuke_favorites_data', JSON.stringify(currentFavorites));
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.error(e);
    }
  };

  const openSearch = () => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(item.searchQuery + " メンズファッション")}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: item.name,
                text: `${item.brand}の${item.name}、これめっちゃ良いぜ！ #垢抜けアニキ`,
                url: window.location.href
            });
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        alert('共有用リンクをコピーしました（デモ）');
    }
  };

  return (
    <div 
        ref={scrollContainerRef}
        className="flex flex-col h-full bg-background overflow-y-auto no-scrollbar pb-safe relative"
        onScroll={handleScroll}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="p-1 -ml-2 text-gray-500 hover:text-primary transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="text-xs font-bold text-gray-500 truncate max-w-[200px]">
            {item.brand}
        </span>
        <button 
            onClick={handleShare}
            className="p-1 -mr-2 text-gray-400 hover:text-primary transition-colors"
        >
            <Share2 size={20} />
        </button>
      </div>

      <div className="pb-24">
        {/* Main Image */}
        <div className="w-full aspect-[3/4] bg-gray-100 relative group">
             <img 
                src={item.imageUrl} 
                alt={item.name}
                className="w-full h-full object-cover"
             />
             {/* Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Product Info */}
        <div className="bg-white p-5 border-b border-gray-100">
            <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-bold text-gray-400">{item.brand}</div>
                <button
                    onClick={toggleFavorite}
                    className="p-2 -mt-2 -mr-2 rounded-full transition-all active:scale-95"
                >
                    <Heart 
                        size={24} 
                        className={`transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-gray-500"}`} 
                    />
                </button>
            </div>
            <h1 className="text-xl font-bold text-primary mb-3 leading-tight">{item.name}</h1>
            
            {item.description && (
                <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-sm border border-gray-100">
                    {item.description}
                </div>
            )}
            
            {/* Search Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-1 bg-blue-50 text-secondary px-2 py-1 rounded-full text-[10px] font-bold">
                    <Search size={10} />
                    {item.searchQuery}
                </div>
                <div className="flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-[10px] font-bold">
                    <Tag size={10} />
                    メンズコーデ
                </div>
            </div>
        </div>

        {/* Action Area */}
        <div className="p-4 bg-white border-b border-gray-100 flex flex-col gap-3">
            <button 
                onClick={() => {
                    // Navigate to Coach chat
                    onNavigate(ViewState.COACH);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-800 to-black text-white py-3 rounded-sm font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
            >
                <Sparkles size={16} className="text-yellow-400" />
                アニキにコーデを聞く
            </button>

            <button 
                onClick={openSearch}
                className="w-full bg-secondary text-white font-bold py-3 rounded-sm shadow-md active:scale-[0.98] transition-transform flex items-center justify-center gap-2 text-sm"
            >
                <ShoppingCart size={18} />
                ネットで探す・購入する
            </button>
        </div>

        {/* Related Items */}
        <div className="mt-2 bg-white p-4">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                このアイテムに合うおすすめ
                <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">AI PICK</span>
            </h3>

            {loading ? (
                <div className="py-8">
                    <Spinner message="コーデアイテムを探してるぜ..." />
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {relatedItems.map((related, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => onItemSelect(related)}
                            className="group cursor-pointer"
                        >
                            <div className="aspect-[3/4] bg-gray-100 rounded-sm mb-2 overflow-hidden relative">
                                <img 
                                    src={related.imageUrl} 
                                    alt={related.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                    <ArrowRight size={14} className="text-primary" />
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold line-clamp-1">{related.brand}</div>
                            <div className="text-xs font-bold leading-tight line-clamp-2">{related.name}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {/* End of content marker */}
        <div className="h-8 flex items-center justify-center text-[10px] text-gray-300">
            End of Page
        </div>
      </div>

      {/* Navigation Overlay */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${showNav ? 'translate-y-0' : 'translate-y-full'}`}>
          <Navigation currentView={ViewState.PRODUCT_DETAIL} onNavigate={onNavigate} />
      </div>
    </div>
  );
};

export default ProductDetailView;