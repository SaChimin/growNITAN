import React, { useState, useEffect, useRef } from 'react';
import { Clock, ShoppingCart, ChevronLeft, Trash2 } from 'lucide-react';
import { FashionItem, ViewState } from '../types';

interface HistoryViewProps {
  onNavigate: (view: ViewState) => void;
  onItemSelect: (item: FashionItem) => void;
  onScrollDirectionChange?: (direction: 'up' | 'down') => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onNavigate, onItemSelect, onScrollDirectionChange }) => {
  const [historyItems, setHistoryItems] = useState<FashionItem[]>([]);

  // Scroll Detection
  const lastScrollY = useRef(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    const diff = currentScrollY - lastScrollY.current;
    
    if (Math.abs(diff) > 10) {
        if (diff > 0) {
            onScrollDirectionChange?.('down');
        } else {
            onScrollDirectionChange?.('up');
        }
        lastScrollY.current = currentScrollY;
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('akanuke_browsing_history');
      if (saved) {
        setHistoryItems(JSON.parse(saved));
      } else {
        setHistoryItems([]);
      }
    } catch (e) {
      console.error("Failed to load history", e);
      setHistoryItems([]);
    }
  };

  const clearHistory = () => {
    if (window.confirm('閲覧履歴をすべて削除しますか？')) {
        localStorage.removeItem('akanuke_browsing_history');
        setHistoryItems([]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button 
          onClick={() => onNavigate(ViewState.PROFILE)}
          className="p-1 -ml-2 text-gray-500 hover:text-primary"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-bold">閲覧履歴</h1>
        <button 
            onClick={clearHistory}
            disabled={historyItems.length === 0}
            className={`p-1 -mr-2 transition-colors ${historyItems.length === 0 ? 'text-gray-200' : 'text-gray-400 hover:text-red-500'}`}
        >
            <Trash2 size={20} />
        </button>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto no-scrollbar p-2 pb-24"
        onScroll={handleScroll}
      >
        {historyItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {historyItems.map((item, index) => (
              <div 
                key={`${item.id}-${index}`} 
                onClick={() => onItemSelect(item)}
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-12">
            <Clock size={48} className="mb-4 text-gray-200" />
            <p className="text-xs font-bold">閲覧履歴はありません</p>
            <p className="text-[10px] mt-2">色々なアイテムを見てみよう</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;