import React, { useState, useEffect, useRef } from 'react';
import { ViewState, FashionItem } from '../types';
import { Search, Heart, Bell, Scissors, Shirt, Footprints, Watch, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerScrollRef = useRef<HTMLDivElement>(null);

  // データの定義
  const pickupItems: FashionItem[] = [
    {
        id: 'pickup-1',
        brand: 'GU',
        name: 'ヘビーウェイトビッグT(5分袖)',
        price: '¥1,990',
        imageUrl: 'https://pollinations.ai/p/white%20heavyweight%20t-shirt%20men%20fashion%20studio%20minimal?width=400&height=500&model=flux&seed=101',
        searchQuery: 'GU ヘビーウェイトビッグT'
    },
    {
        id: 'pickup-2',
        brand: 'UNIQLO',
        name: 'タックワイドパンツ',
        price: '¥3,990',
        imageUrl: 'https://pollinations.ai/p/grey%20wide%20trousers%20men%20fashion%20studio?width=400&height=500&model=flux&seed=102',
        searchQuery: 'UNIQLO タックワイドパンツ'
    },
    {
        id: 'pickup-3',
        brand: 'ZARA',
        name: 'チャンキーソールスニーカー',
        price: '¥5,990',
        imageUrl: 'https://pollinations.ai/p/chunky%20white%20sneakers%20men%20studio?width=400&height=500&model=flux&seed=103',
        searchQuery: 'ZARA メンズ スニーカー'
    }
  ];

  const rankingItems: FashionItem[] = [
    {
        id: 'rank-1',
        brand: 'THE NORTH FACE',
        name: 'バーサタイルショーツ',
        price: '¥6,800',
        imageUrl: 'https://pollinations.ai/p/north%20face%20shorts%20men%20black%20outdoor?width=400&height=500&model=flux&seed=201',
        searchQuery: 'ノースフェイス バーサタイルショーツ'
    },
    {
        id: 'rank-2',
        brand: 'NIKE',
        name: 'エアフォース1 \'07',
        price: '¥12,100',
        imageUrl: 'https://pollinations.ai/p/nike%20air%20force%201%20white%20sneakers?width=400&height=500&model=flux&seed=202',
        searchQuery: 'NIKE エアフォース1'
    },
    {
        id: 'rank-3',
        brand: 'Champion',
        name: 'リバースウィーブ Tシャツ',
        price: '¥4,500',
        imageUrl: 'https://pollinations.ai/p/champion%20grey%20t-shirt%20men%20logo?width=400&height=500&model=flux&seed=203',
        searchQuery: 'Champion Tシャツ メンズ'
    }
  ];

  const navTabs = [
    { id: ViewState.HOME, label: 'ホーム' },
    { id: ViewState.DIAGNOSIS, label: '診断' },
    { id: ViewState.CHAT, label: '相談' },
    { id: ViewState.FAVORITES, label: 'お気に入り' },
    { id: ViewState.PROFILE, label: 'マイページ' },
  ];

  const banners = [
    {
        id: 'sale',
        title: <>AKANUKE<br/>SALE</>,
        subtitle: 'MAX 90% OFF (嘘)',
        buttonText: '会場はこちら',
        bgClass: 'bg-gradient-to-tr from-black to-gray-800',
        onClick: () => onNavigate(ViewState.SEARCH)
    },
    {
        id: 'new',
        title: <>NEW<br/>ARRIVAL</>,
        subtitle: '春の新作アイテム続々入荷',
        buttonText: 'チェックする',
        bgClass: 'bg-gradient-to-tr from-blue-900 to-slate-800',
        onClick: () => onNavigate(ViewState.SEARCH)
    },
    {
        id: 'diagnosis',
        title: <>AI<br/>COACH</>,
        subtitle: 'あなたのコーデを辛口採点',
        buttonText: '診断を始める',
        bgClass: 'bg-gradient-to-tr from-red-900 to-orange-900',
        onClick: () => onNavigate(ViewState.DIAGNOSIS)
    }
  ];

  // マウント時にお気に入り状態を読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem('akanuke_favorites_data');
      if (saved) {
        const items: FashionItem[] = JSON.parse(saved);
        setFavoriteIds(new Set(items.map(i => i.id)));
      }
    } catch (e) {
      console.error("Failed to load favorites", e);
    }
  }, []);

  const toggleFavorite = (item: FashionItem, e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素のクリックイベント（遷移など）を阻止
    
    try {
      const saved = localStorage.getItem('akanuke_favorites_data');
      let currentFavorites: FashionItem[] = saved ? JSON.parse(saved) : [];

      const exists = currentFavorites.some(f => f.id === item.id);
      
      if (exists) {
        // 削除
        currentFavorites = currentFavorites.filter(f => f.id !== item.id);
        setFavoriteIds(prev => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
        });
      } else {
        // 追加
        currentFavorites.push(item);
        setFavoriteIds(prev => {
            const next = new Set(prev);
            next.add(item.id);
            return next;
        });
      }
      
      localStorage.setItem('akanuke_favorites_data', JSON.stringify(currentFavorites));
    } catch (e) {
      console.error("Failed to save favorite", e);
    }
  };

  const isFavorite = (id: string) => favoriteIds.has(id);

  const handleBannerScroll = () => {
    if (bannerScrollRef.current) {
        const { scrollLeft, clientWidth } = bannerScrollRef.current;
        const index = Math.round(scrollLeft / clientWidth);
        if (index !== currentBannerIndex) {
            setCurrentBannerIndex(index);
        }
    }
  };

  const scrollToIndex = (index: number) => {
    if (bannerScrollRef.current) {
        const width = bannerScrollRef.current.clientWidth;
        bannerScrollRef.current.scrollTo({
            left: width * index,
            behavior: 'smooth'
        });
    }
  };

  // オートプレイ (5秒ごとに切り替え)
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentBannerIndex + 1) % banners.length;
      scrollToIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentBannerIndex]); // インデックスが変わるたびにタイマーをリセット

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar bg-background">
      {/* Header / Search Bar */}
      <div className="sticky top-0 z-30 bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
         <div 
            onClick={() => onNavigate(ViewState.SEARCH)}
            className="flex-1 bg-gray-100 rounded-md h-9 flex items-center px-3 gap-2 text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors"
         >
            <Search size={16} />
            <span className="text-xs">ブランド、古着、アイテム...</span>
         </div>
         <Bell size={20} className="text-primary" />
      </div>

      <div className="pb-8">
        {/* Hero Banner Carousel */}
        <div className="relative w-full h-64 group">
            <div 
                ref={bannerScrollRef}
                onScroll={handleBannerScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
            >
                {banners.map((banner) => (
                    <div key={banner.id} className="min-w-full h-full relative flex items-center justify-center overflow-hidden snap-center">
                        <div className={`absolute inset-0 ${banner.bgClass} opacity-90`}></div>
                        {/* Overlay Gradient for depth */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
                        
                        <div className="relative z-10 text-center text-white px-6">
                            <h2 className="text-3xl font-black italic tracking-tighter mb-2 leading-none">{banner.title}</h2>
                            <p className="text-xs font-bold tracking-widest mb-4">{banner.subtitle}</p>
                            <div 
                                onClick={banner.onClick}
                                className="inline-block bg-white text-black px-6 py-2 text-xs font-bold rounded-sm cursor-pointer hover:bg-gray-200 transition-colors"
                            >
                                {banner.buttonText}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Left Arrow */}
            {currentBannerIndex > 0 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); scrollToIndex(currentBannerIndex - 1); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-20"
                >
                    <ChevronLeft size={20} />
                </button>
            )}

            {/* Right Arrow */}
            {currentBannerIndex < banners.length - 1 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); scrollToIndex(currentBannerIndex + 1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-20"
                >
                    <ChevronRight size={20} />
                </button>
            )}

            {/* Carousel Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
                {banners.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                            currentBannerIndex === idx ? 'bg-white w-4' : 'bg-white/50'
                        }`} 
                    />
                ))}
            </div>
        </div>

        {/* Tab Indicator (Sticky) */}
        <div className="sticky top-[61px] z-20 bg-white border-b border-gray-100 w-full overflow-x-auto no-scrollbar shadow-sm">
            <div className="flex px-2 min-w-full justify-between sm:justify-start sm:gap-6">
                {navTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onNavigate(tab.id)}
                        className={`flex-1 sm:flex-none py-3 px-2 text-xs font-bold text-center relative whitespace-nowrap transition-colors ${
                            tab.id === ViewState.HOME 
                            ? 'text-primary' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab.label}
                        {tab.id === ViewState.HOME && (
                            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Category Menu */}
        <div className="bg-white mt-2 py-4 px-4">
            <div className="flex justify-between items-start">
                {[
                    { label: 'ヘアー', icon: Scissors },
                    { label: 'ファッション', icon: Shirt },
                    { label: 'シューズ', icon: Footprints },
                    { label: 'アクセサリー', icon: Watch },
                    { label: '小物', icon: Wallet },
                ].map((cat, idx) => (
                    <button key={idx} className="flex flex-col items-center gap-2 group w-14">
                        <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                            <cat.icon size={20} strokeWidth={1.5} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-primary transition-colors whitespace-nowrap">{cat.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* News / Feed Section */}
        <div className="bg-white mt-2 py-4">
            <div className="flex justify-between items-center px-4 mb-4">
                <h3 className="font-bold text-sm">PICK UP</h3>
                <span className="text-xs text-secondary">すべて見る</span>
            </div>
            
            <div className="flex overflow-x-auto px-4 gap-3 no-scrollbar">
                 {pickupItems.map((item) => (
                     <div key={item.id} className="flex-shrink-0 w-36 group relative">
                         <div className="aspect-[3/4] bg-gray-50 rounded-sm mb-2 relative overflow-hidden">
                            <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                            />
                            {/* Favorite Button Overlay */}
                            <button
                                onClick={(e) => toggleFavorite(item, e)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform active:scale-95 z-10"
                            >
                                <Heart
                                    size={16}
                                    className={`transition-colors ${isFavorite(item.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                                />
                            </button>
                         </div>
                         <div className="text-[10px] text-gray-400 font-bold line-clamp-1">{item.brand}</div>
                         <div className="text-xs font-bold truncate">{item.name}</div>
                         <div className="text-xs text-gray-500">{item.price}</div>
                     </div>
                 ))}
            </div>
        </div>

        {/* Ranking Styled List */}
        <div className="bg-white mt-2 p-4">
            <h3 className="font-bold text-sm mb-4">ランキング</h3>
            <div className="space-y-4">
                {rankingItems.map((item, index) => (
                    <div key={item.id} className="flex gap-4 items-start border-b border-gray-100 pb-4 last:border-0 relative">
                        <div className="w-8 text-center font-black text-xl italic text-gray-300">{index + 1}</div>
                        <div className="w-20 h-24 bg-gray-50 rounded-sm flex-shrink-0 overflow-hidden">
                             <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 pr-8">
                            <div className="text-xs font-bold text-gray-400 mb-1">{item.brand}</div>
                            <div className="text-sm font-bold leading-tight mb-2">{item.name}</div>
                            <div className="text-sm font-bold text-primary">{item.price}</div>
                        </div>
                        {/* Favorite Button */}
                        <button
                            onClick={(e) => toggleFavorite(item, e)}
                            className="absolute right-0 top-1 p-2 text-gray-400 transition-transform active:scale-95"
                        >
                            <Heart
                                size={20}
                                className={`transition-colors ${isFavorite(item.id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Footer Area */}
        <div className="p-8 text-center text-gray-400 text-[10px]">
            &copy; AKANUKE BRO Inc.
        </div>
      </div>
    </div>
  );
};

export default HomeView;