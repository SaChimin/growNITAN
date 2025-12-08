import React, { useState, useEffect, useRef } from 'react';
import { ViewState, FashionItem } from '../types';
import { Search, Heart, Scissors, Shirt, Footprints, Watch, Wallet, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
  onSearch: (query: string) => void;
  onItemSelect: (item: FashionItem) => void;
  onScrollDirectionChange?: (direction: 'up' | 'down') => void;
}

// カテゴリーIDの型定義
type CategoryId = 'all' | 'hair' | 'fashion' | 'shoes' | 'accessory' | 'goods';

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onSearch, onItemSelect, onScrollDirectionChange }) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [activeCategoryId, setActiveCategoryId] = useState<CategoryId>('all');
  const bannerScrollRef = useRef<HTMLDivElement>(null);
  const isResettingRef = useRef(false);
  
  // Scroll Detection
  const lastScrollY = useRef(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    
    // iOSバウンス対策（上部でのマイナススクロールは無視）
    if (currentScrollY < 0) return;

    const diff = currentScrollY - lastScrollY.current;
    
    // 感度調整: 5px以上の移動で判定（より敏感に反応するように変更）
    if (Math.abs(diff) > 5) {
        if (diff > 0) {
            onScrollDirectionChange?.('down');
        } else {
            onScrollDirectionChange?.('up');
        }
        lastScrollY.current = currentScrollY;
    }
  };

  // カテゴリーごとのデータ定義
  const categoryData: Record<CategoryId, { pickup: FashionItem[]; ranking: FashionItem[] }> = {
    all: {
        pickup: [
            { id: 'pickup-1', brand: 'GU', name: 'ヘビーウェイトビッグT(5分袖)', imageUrl: 'https://pollinations.ai/p/white%20heavyweight%20t-shirt%20men%20fashion%20studio%20minimal?width=400&height=500&model=flux&seed=101', searchQuery: 'GU ヘビーウェイトビッグT', description: 'しっかりとした厚手のコットン素材を使用。繰り返し洗ってもヨレにくいのが特徴。オーバーサイズシルエットで、リラックスした着こなしに最適。' },
            { id: 'pickup-2', brand: 'UNIQLO', name: 'タックワイドパンツ', imageUrl: 'https://pollinations.ai/p/grey%20wide%20trousers%20men%20fashion%20studio?width=400&height=500&model=flux&seed=102', searchQuery: 'UNIQLO タックワイドパンツ', description: '繊細なドレープ感と上品な光沢感が特徴。ウエストに入ったタックが腰回りをすっきり見せつつ、ワイドなシルエットでトレンド感を演出。' },
            { id: 'pickup-3', brand: 'ZARA', name: 'チャンキーソールスニーカー', imageUrl: 'https://pollinations.ai/p/chunky%20white%20sneakers%20men%20studio?width=400&height=500&model=flux&seed=103', searchQuery: 'ZARA メンズ スニーカー', description: 'ボリュームのあるソールが特徴的なダッドスニーカー。身長盛れ効果もあり、シンプルなコーデのアクセントとして活躍する一足。' }
        ],
        ranking: [
            { id: 'rank-1', brand: 'THE NORTH FACE', name: 'バーサタイルショーツ', imageUrl: 'https://pollinations.ai/p/north%20face%20shorts%20men%20black%20outdoor?width=400&height=500&model=flux&seed=201', searchQuery: 'ノースフェイス バーサタイルショーツ', description: '軽量で乾きやすいナイロン素材を使用をショートパンツ。撥水加工が施されており、アウトドアからタウンユースまで幅広く使える。' },
            { id: 'rank-2', brand: 'NIKE', name: 'エアフォース1 \'07', imageUrl: 'https://pollinations.ai/p/nike%20air%20force%201%20white%20sneakers?width=400&height=500&model=flux&seed=202', searchQuery: 'NIKE エアフォース1', description: '1982年に登場したバスケットボールシューズの名作。クリーンなホワイトカラーはどんなスタイルにもマッチする鉄板アイテム。' },
            { id: 'rank-3', brand: 'Champion', name: 'リバースウィーブ Tシャツ', imageUrl: 'https://pollinations.ai/p/champion%20grey%20t-shirt%20men%20logo?width=400&height=500&model=flux&seed=203', searchQuery: 'Champion Tシャツ メンズ', description: '生地を横向きに使用することで縦縮みを軽減した「リバースウィーブ」製法。着込むほどに味が出る、アメカジの定番。' }
        ]
    },
    hair: {
        pickup: [
            { id: 'hair-p-1', brand: 'LIPPS', name: 'ハードブラストワックス', imageUrl: 'https://pollinations.ai/p/hair%20wax%20jar%20product%20photography%20studio?width=400&height=500&model=flux&seed=301', searchQuery: 'LIPPS ワックス' },
            { id: 'hair-p-2', brand: 'RETØUCH', name: 'ヘアバーム', imageUrl: 'https://pollinations.ai/p/hair%20balm%20cosmetic%20men?width=400&height=500&model=flux&seed=303', searchQuery: 'レタッチ ヘアバーム' },
            { id: 'hair-p-3', brand: 'OCEAN TRICO', name: 'ヘアアイロン', imageUrl: 'https://pollinations.ai/p/hair%20straightener%20men%20styling?width=400&height=500&model=flux&seed=302', searchQuery: 'メンズ ヘアアイロン' }
        ],
        ranking: [
            { id: 'hair-r-1', brand: 'Panasonic', name: 'ナノケア ドライヤー', imageUrl: 'https://pollinations.ai/p/hair%20dryer%20modern%20black?width=400&height=500&model=flux&seed=304', searchQuery: 'パナソニック ドライヤー' },
            { id: 'hair-r-2', brand: 'GATSBY', name: 'メタラバー ワックス', imageUrl: 'https://pollinations.ai/p/hair%20wax%20colorful%20container?width=400&height=500&model=flux&seed=305', searchQuery: 'ギャツビー メタラバー' },
            { id: 'hair-r-3', brand: 'Product', name: 'オーガニックヘアワックス', imageUrl: 'https://pollinations.ai/p/organic%20hair%20wax%20blue%20label?width=400&height=500&model=flux&seed=306', searchQuery: 'ザ・プロダクト ワックス' }
        ]
    },
    fashion: {
        pickup: [
            { id: 'f-p-1', brand: 'HARE', name: 'トロミシャツ', imageUrl: 'https://pollinations.ai/p/men%20wearing%20silky%20shirt%20fashion%20studio?width=400&height=500&model=flux&seed=401', searchQuery: 'HARE シャツ' },
            { id: 'f-p-2', brand: 'WYM LIDNM', name: 'リラックスセットアップ', imageUrl: 'https://pollinations.ai/p/men%20wearing%20casual%20suit%20setup%20beige?width=400&height=500&model=flux&seed=402', searchQuery: 'WYM セットアップ' },
            { id: 'f-p-3', brand: 'G.U.', name: 'パラシュートパンツ', imageUrl: 'https://pollinations.ai/p/parachute%20pants%20men%20street%20fashion?width=400&height=500&model=flux&seed=403', searchQuery: 'GU パラシュートパンツ' }
        ],
        ranking: [
            { id: 'f-r-1', brand: 'UNIQLO U', name: 'エアリズムコットンT', imageUrl: 'https://pollinations.ai/p/black%20oversized%20t-shirt%20men%20uniqlou?width=400&height=500&model=flux&seed=404', searchQuery: 'ユニクロU エアリズムT' },
            { id: 'f-r-2', brand: 'ZOZO', name: 'ストレッチスキニー', imageUrl: 'https://pollinations.ai/p/black%20skinny%20jeans%20men%20fashion?width=400&height=500&model=flux&seed=405', searchQuery: 'メンズ スキニーパンツ' },
            { id: 'f-r-3', brand: 'Dickies', name: '874 ワークパンツ', imageUrl: 'https://pollinations.ai/p/dickies%20874%20work%20pants%20navy?width=400&height=500&model=flux&seed=406', searchQuery: 'Dickies 874' }
        ]
    },
    shoes: {
        pickup: [
            { id: 's-p-1', brand: 'New Balance', name: 'MR530', imageUrl: 'https://pollinations.ai/p/new%20balance%20530%20sneakers%20silver?width=400&height=500&model=flux&seed=501', searchQuery: 'New Balance 530' },
            { id: 's-p-2', brand: 'Dr.Martens', name: '1461 3ホール', imageUrl: 'https://pollinations.ai/p/dr%20martens%201461%20shoes%20black?width=400&height=500&model=flux&seed=502', searchQuery: 'ドクターマーチン 3ホール' },
            { id: 's-p-3', brand: 'BIRKENSTOCK', name: 'ボストン', imageUrl: 'https://pollinations.ai/p/birkenstock%20boston%20sandals%20taupe?width=400&height=500&model=flux&seed=503', searchQuery: 'ビルケンシュトック ボストン' }
        ],
        ranking: [
            { id: 's-r-1', brand: 'adidas', name: 'SAMBA OG', imageUrl: 'https://pollinations.ai/p/adidas%20samba%20white%20sneakers?width=400&height=500&model=flux&seed=504', searchQuery: 'adidas SAMBA' },
            { id: 's-r-2', brand: 'NIKE', name: 'エアマックス 90', imageUrl: 'https://pollinations.ai/p/nike%20air%20max%2090%20white?width=400&height=500&model=flux&seed=505', searchQuery: 'NIKE エアマックス90' },
            { id: 's-r-3', brand: 'Converse', name: 'CT70', imageUrl: 'https://pollinations.ai/p/converse%20chuck%2070%20black%20high?width=400&height=500&model=flux&seed=506', searchQuery: 'コンバース CT70' }
        ]
    },
    accessory: {
        pickup: [
            { id: 'a-p-1', brand: 'Daniel Wellington', name: 'クラシックウォッチ', imageUrl: 'https://pollinations.ai/p/daniel%20wellington%20watch%20men?width=400&height=500&model=flux&seed=601', searchQuery: 'ダニエルウェリントン メンズ' },
            { id: 'a-p-2', brand: 'LION HEART', name: 'シルバーネックレス', imageUrl: 'https://pollinations.ai/p/silver%20necklace%20chain%20men?width=400&height=500&model=flux&seed=602', searchQuery: 'ライオンハート ネックレス' },
            { id: 'a-p-3', brand: 'Paul Smith', name: 'マルチストライプ リング', imageUrl: 'https://pollinations.ai/p/silver%20ring%20men%20colorful%20detail?width=400&height=500&model=flux&seed=603', searchQuery: 'ポールスミス リング メンズ' }
        ],
        ranking: [
            { id: 'a-r-1', brand: 'Apple', name: 'Apple Watch SE', imageUrl: 'https://pollinations.ai/p/apple%20watch%20on%20wrist%20men?width=400&height=500&model=flux&seed=604', searchQuery: 'Apple Watch SE' },
            { id: 'a-r-2', brand: 'TOM WOOD', name: 'クッションリング', imageUrl: 'https://pollinations.ai/p/tom%20wood%20ring%20silver%20onyx?width=400&height=500&model=flux&seed=605', searchQuery: 'トムウッド リング' },
            { id: 'a-r-3', brand: 'G-SHOCK', name: 'DW-5600', imageUrl: 'https://pollinations.ai/p/g-shock%20black%20digital%20watch?width=400&height=500&model=flux&seed=606', searchQuery: 'G-SHOCK 5600' }
        ]
    },
    goods: {
        pickup: [
            { id: 'g-p-1', brand: 'PORTER', name: 'タンカー ショルダーバッグ', imageUrl: 'https://pollinations.ai/p/porter%20black%20shoulder%20bag?width=400&height=500&model=flux&seed=701', searchQuery: 'ポーター タンカー ショルダー' },
            { id: 'g-p-2', brand: 'Ray-Ban', name: 'ウェイファーラー', imageUrl: 'https://pollinations.ai/p/rayban%20sunglasses%20wayfarer?width=400&height=500&model=flux&seed=702', searchQuery: 'レイバン ウェイファーラー' },
            { id: 'g-p-3', brand: 'NEW ERA', name: '9TWENTY キャップ', imageUrl: 'https://pollinations.ai/p/new%20era%20cap%20navy%20yankees?width=400&height=500&model=flux&seed=703', searchQuery: 'ニューエラ キャップ' }
        ],
        ranking: [
            { id: 'g-r-1', brand: 'ARC\'TERYX', name: 'マンティス2', imageUrl: 'https://pollinations.ai/p/arcteryx%20waist%20pack%20black?width=400&height=500&model=flux&seed=704', searchQuery: 'アークテリクス マンティス2' },
            { id: 'g-r-2', brand: 'IL BISONTE', name: 'レザーキーケース', imageUrl: 'https://pollinations.ai/p/leather%20key%20case%20brown?width=400&height=500&model=flux&seed=705', searchQuery: 'イルビゾンテ キーケース' },
            { id: 'g-r-3', brand: 'Calvin Klein', name: 'ボクサーパンツ 3枚組', imageUrl: 'https://pollinations.ai/p/calvin%20klein%20underwear%20men?width=400&height=500&model=flux&seed=706', searchQuery: 'カルバンクライン ボクサーパンツ' }
        ]
    }
  };

  const categories: { id: CategoryId; label: string; icon: any }[] = [
      { id: 'all', label: 'すべて', icon: LayoutGrid },
      { id: 'hair', label: 'ヘアー', icon: Scissors },
      { id: 'fashion', label: '服', icon: Shirt },
      { id: 'shoes', label: '靴', icon: Footprints },
      { id: 'accessory', label: 'アクセ', icon: Watch },
      { id: 'goods', label: '小物', icon: Wallet },
  ];

  const currentItems = categoryData[activeCategoryId];

  const originalBanners = [
    {
        id: 'sale',
        title: <>AKANUKE<br/>SALE</>,
        subtitle: 'MAX 90% OFF (嘘)',
        buttonText: '会場はこちら',
        bgClass: 'bg-gradient-to-tr from-black to-gray-800',
        onClick: () => onSearch('メンズファッション セール')
    },
    {
        id: 'new',
        title: <>NEW<br/>ARRIVAL</>,
        subtitle: '春の新作アイテム続々入荷',
        buttonText: 'チェックする',
        bgClass: 'bg-gradient-to-tr from-blue-900 to-slate-800',
        onClick: () => onSearch('メンズ 春服 新作')
    },
    {
        id: 'diagnosis',
        title: <>AI<br/>COACH</>,
        subtitle: 'あなたのコーデを辛口採点',
        buttonText: '診断を始める',
        bgClass: 'bg-gradient-to-tr from-red-900 to-orange-900',
        onClick: () => onNavigate(ViewState.COACH)
    }
  ];

  // 無限ループ用に1枚目のクローンを末尾に追加
  const banners = [...originalBanners, { ...originalBanners[0], id: 'clone' }];

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
    if (bannerScrollRef.current && !isResettingRef.current) {
        const { scrollLeft, clientWidth } = bannerScrollRef.current;
        const index = Math.round(scrollLeft / clientWidth);
        if (index !== currentBannerIndex) {
            setCurrentBannerIndex(index);
        }
    }
  };

  const scrollToIndex = (index: number, instant: boolean = false) => {
    if (bannerScrollRef.current) {
        const width = bannerScrollRef.current.clientWidth;
        bannerScrollRef.current.scrollTo({
            left: width * index,
            behavior: instant ? 'auto' : 'smooth'
        });
    }
  };

  // 無限ループのリセット処理監視
  useEffect(() => {
    // クローン（最後の要素）に到達したら、アニメーション終了後に先頭へジャンプ
    if (currentBannerIndex === banners.length - 1) {
        const timer = setTimeout(() => {
            if (bannerScrollRef.current) {
                isResettingRef.current = true;
                bannerScrollRef.current.style.scrollBehavior = 'auto'; // アニメーション無効化
                bannerScrollRef.current.scrollLeft = 0; // 先頭へジャンプ
                setCurrentBannerIndex(0);
                
                // 次のフレームでアニメーションを有効化に戻す
                requestAnimationFrame(() => {
                    if (bannerScrollRef.current) {
                         bannerScrollRef.current.style.scrollBehavior = 'smooth';
                         isResettingRef.current = false;
                    }
                });
            }
        }, 500); // スクロールアニメーションの時間に合わせて待機（CSSではないがsmooth scrollの完了待ち）
        
        return () => clearTimeout(timer);
    }
  }, [currentBannerIndex]);

  // オートプレイ (5秒ごとに切り替え)
  useEffect(() => {
    const interval = setInterval(() => {
      // 既にクローンにいる場合はリセット待ちなので何もしない
      if (currentBannerIndex === banners.length - 1) return;

      const nextIndex = currentBannerIndex + 1;
      scrollToIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentBannerIndex]);

  // インジケーター用のインデックス（クローンは0番目として扱う）
  const displayIndex = currentBannerIndex >= originalBanners.length ? 0 : currentBannerIndex;

  return (
    <div 
        className="flex flex-col h-full overflow-y-auto no-scrollbar bg-background"
        onScroll={handleScroll}
    >
      {/* Header / Search Bar */}
      <div className="sticky top-0 z-30 bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3">
         <div 
            onClick={() => onNavigate(ViewState.SEARCH)}
            className="flex-1 bg-gray-100 rounded-md h-9 flex items-center px-3 gap-2 text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors"
         >
            <Search size={16} />
            <span className="text-xs">ブランド、古着、アイテム...</span>
         </div>
      </div>

      <div className="pb-8">
        {/* Hero Banner Carousel */}
        <div className="relative w-full h-64 group">
            <div 
                ref={bannerScrollRef}
                onScroll={handleBannerScroll}
                className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
            >
                {banners.map((banner, idx) => (
                    <div key={`${banner.id}-${idx}`} className="min-w-full h-full relative flex items-center justify-center overflow-hidden snap-center">
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
            <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    const target = currentBannerIndex === 0 ? originalBanners.length - 1 : currentBannerIndex - 1;
                    scrollToIndex(target); 
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-20"
            >
                <ChevronLeft size={20} />
            </button>

            {/* Right Arrow */}
            <button 
                onClick={(e) => { 
                    e.stopPropagation();
                    const target = currentBannerIndex + 1;
                    // クローンがあるため単純に+1でOK（useEffectでリセットされる）
                    scrollToIndex(target);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-20"
            >
                <ChevronRight size={20} />
            </button>

            {/* Carousel Dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
                {originalBanners.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                            displayIndex === idx ? 'bg-white w-4' : 'bg-white/50'
                        }`} 
                    />
                ))}
            </div>
        </div>

        {/* Category Menu */}
        <div className="bg-white mt-2 py-4 px-4 sticky top-[60px] z-20 shadow-sm">
            <div className="flex justify-between items-start overflow-x-auto no-scrollbar gap-2">
                {categories.map((cat, idx) => {
                    const isActive = activeCategoryId === cat.id;
                    return (
                        <button 
                            key={cat.id} 
                            onClick={() => setActiveCategoryId(cat.id)}
                            className="flex flex-col items-center gap-2 group min-w-[3.5rem]"
                        >
                            <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all shadow-sm ${
                                isActive 
                                ? 'bg-primary text-white border-primary scale-110' 
                                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                            }`}>
                                <cat.icon size={20} strokeWidth={1.5} />
                            </div>
                            <span className={`text-[10px] font-bold transition-colors whitespace-nowrap ${
                                isActive ? 'text-primary' : 'text-gray-500'
                            }`}>{cat.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* News / Feed Section */}
        <div className="bg-white mt-2 py-4">
            <div className="flex justify-between items-center px-4 mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    PICK UP 
                    <span className="text-[10px] text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">
                        {categories.find(c => c.id === activeCategoryId)?.label}
                    </span>
                </h3>
                <button 
                    onClick={() => onSearch('メンズファッション おすすめ')}
                    className="text-xs text-secondary hover:text-blue-700"
                >
                    すべて見る
                </button>
            </div>
            
            <div className="flex overflow-x-auto px-4 gap-3 no-scrollbar pb-2">
                 {currentItems.pickup.map((item) => (
                     <div 
                        key={item.id} 
                        onClick={() => onItemSelect(item)}
                        className="flex-shrink-0 w-36 group relative cursor-pointer"
                     >
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
                     </div>
                 ))}
            </div>
        </div>

        {/* Ranking Styled List */}
        <div className="bg-white mt-2 p-4 min-h-[400px]">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                ランキング
                <span className="text-[10px] text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">
                    {categories.find(c => c.id === activeCategoryId)?.label}
                </span>
            </h3>
            <div className="space-y-4">
                {currentItems.ranking.map((item, index) => (
                    <div 
                        key={item.id} 
                        onClick={() => onItemSelect(item)}
                        className="flex gap-4 items-start border-b border-gray-100 pb-4 last:border-0 relative cursor-pointer hover:bg-gray-50 transition-colors rounded-sm p-1 animate-fadeIn"
                    >
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
                        </div>
                        {/* Favorite Button */}
                        <button
                            onClick={(e) => toggleFavorite(item, e)}
                            className="absolute right-0 top-1 p-2 text-gray-400 transition-transform active:scale-95 hover:text-red-400"
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