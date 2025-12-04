import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { FashionItem } from '../types';

const FavoritesView: React.FC = () => {
  const [favorites, setFavorites] = useState<FashionItem[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('akanuke_favorites_data');
      if (saved) {
        setFavorites(JSON.parse(saved));
      } else {
        setFavorites([]);
      }
    } catch (e) {
      console.error("Failed to load favorites", e);
      setFavorites([]);
    }
  };

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(item => item.id !== id);
    setFavorites(updated);
    localStorage.setItem('akanuke_favorites_data', JSON.stringify(updated));
  };

  const openSearch = (searchQuery: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + " 通販")}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 text-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-sm font-bold">お気に入り</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 pb-24">
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {favorites.map((item) => (
              <div 
                key={item.id} 
                onClick={() => openSearch(item.searchQuery || item.name)}
                className="bg-white rounded-sm overflow-hidden border border-gray-100 relative group cursor-pointer"
              >
                <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  
                  {/* Cart Button Overlay */}
                  <div className="absolute bottom-2 right-2 bg-black/70 p-2 rounded-full text-white transition-colors">
                    <ShoppingCart size={14} />
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="text-[10px] text-gray-400 font-bold mb-1">{item.brand}</div>
                  <div className="text-xs font-bold text-primary mb-1 line-clamp-2 h-8 leading-tight">{item.name}</div>
                  <div className="text-sm font-bold">{item.price}</div>
                </div>

                {/* Remove Button */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                >
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-12">
            <Heart size={48} className="mb-4 text-gray-200" />
            <p className="text-xs font-bold">お気に入りはまだありません</p>
            <p className="text-[10px] mt-2">ホーム画面や検索からアイテムを追加しよう</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesView;