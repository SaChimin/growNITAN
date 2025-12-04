import React, { useState, useRef } from 'react';
import { Camera, Upload, ChevronRight, AlertCircle, ShoppingCart, RefreshCw, Star, Tag, Share2, Shirt } from 'lucide-react';
import { analyzeFashionImage } from '../services/geminiService';
import { FashionAnalysis, LoadingState } from '../types';
import Spinner from './Spinner';

const DiagnosisView: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FashionAnalysis | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setLoading({ isLoading: true, message: '診断中... 待ってろよ！' });
    setError(null);

    try {
      const cleanBase64 = image.split(',')[1];
      const result = await analyzeFashionImage(cleanBase64);
      setAnalysis(result);
    } catch (err) {
      setError('診断に失敗したみたいだ。通信環境を確認してもう一度頼む！');
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const openAmazonSearch = (query: string) => {
    const url = `https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setError(null);
  };

  const handleShare = async () => {
      if (analysis && navigator.share) {
          try {
              await navigator.share({
                  title: '垢抜けアニキ ファッション診断',
                  text: `俺のファッションスコアは${analysis.score}点だったぜ！ #垢抜けアニキ`,
                  url: window.location.href
              });
          } catch (err) {
              console.log('Share canceled');
          }
      } else {
          alert('お使いのブラウザはシェア機能に対応していません。スクリーンショットを撮って共有してくれ！');
      }
  };

  if (loading.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 bg-white">
        <Spinner message={loading.message} />
        {image && (
          <img 
            src={image} 
            alt="Analyzing" 
            className="w-24 h-24 object-cover rounded-sm opacity-50 grayscale"
          />
        )}
      </div>
    );
  }

  // Result View (Coordinate Page Style)
  if (analysis) {
    return (
      <div className="flex flex-col h-full overflow-y-auto no-scrollbar bg-white">
        {/* Header - User Info style */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    YOU
                </div>
                <div>
                    <div className="text-xs font-bold">あなたのコーデ</div>
                    <div className="text-[10px] text-gray-400">170cm / MEN</div>
                </div>
            </div>
            <button 
                onClick={handleShare}
                className="text-gray-400 hover:text-primary transition-colors"
            >
                <Share2 size={20} />
            </button>
        </div>

        {/* Main Image */}
        <div className="w-full aspect-[3/4] bg-gray-100 relative">
            <img src={image!} alt="Code" className="w-full h-full object-cover" />
            
            {/* Score Tag */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-sm shadow-lg border border-gray-200">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Style Score</div>
                <div className="text-3xl font-black text-primary font-serif italic">
                    {analysis.score}<span className="text-sm not-italic ml-1 text-gray-400">/100</span>
                </div>
            </div>
        </div>

        {/* Description / Critique */}
        <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                    アニキの評価
                </span>
                <span className="text-xs text-gray-400">updated just now</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
                {analysis.critique}
            </p>
        </div>

        {/* Improvements (Tags style) */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
             <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center">
                <Star size={12} className="mr-1" />
                垢抜けポイント
            </h3>
            <div className="flex flex-wrap gap-2">
                {analysis.improvements.map((point, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 px-3 py-2 rounded-sm shadow-sm flex items-start gap-2">
                        <span className="text-secondary font-bold text-xs">#{idx + 1}</span>
                        <span className="text-xs text-gray-700">{point}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Recommended Items (Product List style) */}
        <div className="p-4 bg-white pb-24">
            <h3 className="text-xs font-bold text-gray-500 mb-3 flex items-center">
                <Tag size={12} className="mr-1" />
                着用アイテム（おすすめ）
            </h3>
            <div className="space-y-3">
                {analysis.recommendedItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-0">
                        <div className="w-16 h-20 bg-gray-100 rounded-sm flex items-center justify-center text-gray-300">
                            <Shirt size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold text-gray-400 mb-1">RECOMMEND</div>
                            <div className="text-sm font-bold text-primary mb-1">{item.name}</div>
                            <div className="text-[10px] text-gray-500 leading-tight mb-2 bg-gray-50 p-1 rounded inline-block">
                                {item.reason}
                            </div>
                            <button 
                                onClick={() => openAmazonSearch(item.searchQuery)}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-sm text-xs font-bold hover:bg-gray-800 transition-colors"
                            >
                                <ShoppingCart size={12} />
                                Amazonで探す
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-20 right-4 z-10">
            <button 
                onClick={reset}
                className="bg-white text-primary border border-gray-200 shadow-lg p-3 rounded-full hover:bg-gray-50"
            >
                <RefreshCw size={20} />
            </button>
        </div>
      </div>
    );
  }

  // Upload View
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 text-center relative">
          <h1 className="text-sm font-bold">WEAR CHECK</h1>
          <span className="text-[10px] text-gray-400 block">AIファッション診断</span>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        
        <div 
          className="w-full aspect-[3/4] bg-gray-50 border-2 border-dashed border-gray-300 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-400 transition-all group"
          onClick={() => fileInputRef.current?.click()}
        >
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                <Camera size={28} className="text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-600">コーディネートを投稿</p>
              <p className="text-xs text-gray-400 mt-2">全身写真を選択してください</p>
            </>
          )}
        </div>

        {error && (
            <div className="mt-4 flex items-center text-red-500 bg-red-50 p-3 rounded-sm w-full text-xs">
                <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                {error}
            </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />

        <div className="w-full mt-6">
            <button
            onClick={handleAnalyze}
            disabled={!image}
            className={`w-full py-3 rounded-sm font-bold text-sm flex items-center justify-center transition-all ${
                image 
                ? 'bg-secondary text-white hover:opacity-90 shadow-md' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            >
            診断する
            <ChevronRight size={16} className="ml-1" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisView;