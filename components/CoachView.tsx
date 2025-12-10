import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft, MoreHorizontal, Camera, AlertCircle, ShoppingCart, RefreshCw, Star, Tag, Share2, Shirt, MessageCircle, ScanFace } from 'lucide-react';
import { ChatMessage, ViewState, FashionAnalysis, LoadingState } from '../types';
import { createCoachChat, analyzeFashionImage } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import Spinner from './Spinner';

interface CoachViewProps {
  onNavigate: (view: ViewState) => void;
  onBack?: () => void; // 戻り先を指定するためのプロパティを追加
  onScrollDirectionChange?: (direction: 'up' | 'down') => void;
}

type CoachMode = 'CHAT' | 'DIAGNOSIS';

const CoachView: React.FC<CoachViewProps> = ({ onNavigate, onBack, onScrollDirectionChange }) => {
  const [mode, setMode] = useState<CoachMode>('CHAT');
  
  // --- CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  // --- DIAGNOSIS STATE ---
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FashionAnalysis | null>(null);
  const [diagLoading, setDiagLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  const [diagError, setDiagError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll Detection for Diagnosis Mode
  const lastScrollY = useRef(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // チャットモードではナビゲーションバーを制御しない（入力欄が動くと不便なため）
    if (mode === 'CHAT') return;
    
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


  // --- CHAT LOGIC ---
  useEffect(() => {
    // 初期メッセージの設定（プロフィールデータがある場合は反映）
    try {
        const savedProfile = localStorage.getItem('akanuke_user_profile');
        let initialText = "よう！アニキだ。ファッションの悩み、コーデの診断、なんでも任せろ。";
        
        if (savedProfile) {
            const p = JSON.parse(savedProfile);
            if (p.name) {
                initialText = `よう、${p.name}！アニキだ。${p.height ? `お前の身長（${p.height}cm）に合わせた` : 'お前にぴったりの'}コーデや悩み、なんでも相談してくれ。`;
            } else if (p.height) {
                initialText = `よう！身長${p.height}cmのアニキ流着こなし術、教えるぜ。何でも聞いてくれ。`;
            }
        }

        // メッセージがまだない場合のみセット
        setMessages(prev => {
            if (prev.length === 0) {
                return [{
                    id: '1',
                    role: 'model',
                    text: initialText,
                    timestamp: new Date()
                }];
            }
            return prev;
        });
    } catch (e) {
        console.error("Failed to load profile for chat init", e);
    }

    if (!chatSessionRef.current) {
        chatSessionRef.current = createCoachChat();
    }
  }, []);

  useEffect(() => {
    if (mode === 'CHAT') {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, mode]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({
        message: userMsg.text
      });
      
      let aiResponseText = "悪い、ちょっと考え事してた。もう一回言ってくれ。";
      let recommendations: { name: string, imageUrl: string }[] = [];

      // JSON解析を試みる
      if (result.text) {
          try {
              const parsed = JSON.parse(result.text);
              aiResponseText = parsed.text || aiResponseText;
              
              if (parsed.recommendedItems && Array.isArray(parsed.recommendedItems)) {
                  recommendations = parsed.recommendedItems.map((item: any, idx: number) => ({
                      name: item.name,
                      // Pollinations AIで画像生成
                      imageUrl: `https://pollinations.ai/p/${encodeURIComponent(item.imagePrompt)}?width=400&height=500&model=flux&seed=${Math.floor(Math.random() * 1000) + idx}`
                  })).slice(0, 2); // 念のため2つまで
              }
          } catch (e) {
              console.warn("Response was not valid JSON, using raw text", e);
              aiResponseText = result.text;
          }
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponseText,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "ちょっと電波が悪いみたいだ。もう一回頼む。",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChatReset = () => {
    if (window.confirm('会話の履歴を消去してリセットしますか？')) {
        // プロフィールを再取得して挨拶をリセット
        const savedProfile = localStorage.getItem('akanuke_user_profile');
        let resetText = "よう！また会ったな。何か悩みか？";
         if (savedProfile) {
            const p = JSON.parse(savedProfile);
            if (p.name) {
                resetText = `よう、${p.name}！仕切り直しといこうか。何でも聞いてくれ。`;
            }
        }
        
        setMessages([{
            id: Date.now().toString(),
            role: 'model',
            text: resetText,
            timestamp: new Date()
        }]);
        chatSessionRef.current = createCoachChat();
    }
  };

  // --- DIAGNOSIS LOGIC ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        setAnalysis(null);
        setDiagError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setDiagLoading({ isLoading: true, message: '診断中... 待ってろよ！' });
    setDiagError(null);

    try {
      const cleanBase64 = image.split(',')[1];
      const result = await analyzeFashionImage(cleanBase64);
      setAnalysis(result);
    } catch (err) {
      setDiagError('診断に失敗したみたいだ。通信環境を確認してもう一度頼む！');
    } finally {
      setDiagLoading({ isLoading: false, message: '' });
    }
  };

  const openAmazonSearch = (query: string) => {
    const url = `https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const resetDiagnosis = () => {
    setImage(null);
    setAnalysis(null);
    setDiagError(null);
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
          alert('お使いのブラウザはシェア機能に対応していません。');
      }
  };


  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      {/* Header with Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <button 
                onClick={() => onBack ? onBack() : onNavigate(ViewState.HOME)}
                className="text-gray-600 hover:text-primary transition-colors"
            >
                <ChevronLeft size={24} />
            </button>
            <div className="font-bold text-sm">AI COACH</div>
            <button 
                onClick={handleChatReset}
                className="text-gray-600 hover:text-primary transition-colors opacity-0" // Hidden placeholder for balance
            >
                <MoreHorizontal size={24} />
            </button>
          </div>
          
          {/* Segmented Control */}
          <div className="px-4 pb-3">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setMode('CHAT')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
                        mode === 'CHAT' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                      <MessageCircle size={14} />
                      相談する
                  </button>
                  <button
                    onClick={() => setMode('DIAGNOSIS')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
                        mode === 'DIAGNOSIS' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                      <ScanFace size={14} />
                      コーデ診断
                  </button>
              </div>
          </div>
      </div>

      {/* --- CHAT VIEW CONTENT --- */}
      {mode === 'CHAT' && (
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-[#F0F2F5]">
                <div className="text-center text-[10px] text-gray-400 my-2">今日</div>
                
                {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}
                >
                    {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-1 shadow-sm border border-gray-200">
                            兄
                        </div>
                    )}
                    
                    <div className="max-w-[85%]">
                        <div 
                        className={`p-3 text-sm leading-relaxed shadow-sm relative ${
                            msg.role === 'user' 
                            ? 'bg-secondary text-white rounded-l-2xl rounded-tr-2xl rounded-br-sm' 
                            : 'bg-white text-primary rounded-r-2xl rounded-tl-2xl rounded-bl-sm border border-gray-100'
                        }`}
                        >
                        {msg.text}
                        </div>
                        
                        {/* Recommendation Images */}
                        {msg.recommendations && msg.recommendations.length > 0 && (
                            <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {msg.recommendations.map((item, idx) => (
                                    <div key={idx} className="flex-shrink-0 w-32 bg-white p-2 rounded-sm border border-gray-100 shadow-sm">
                                        <div className="aspect-[3/4] bg-gray-100 mb-2 rounded-sm overflow-hidden">
                                            <img 
                                                src={item.imageUrl} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-600 line-clamp-2 leading-tight">
                                            {item.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={`text-[9px] text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
                ))}
                
                {isTyping && (
                <div className="flex justify-start items-start">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold mr-2 mt-1">
                        兄
                    </div>
                    <div className="bg-white p-3 rounded-r-2xl rounded-tl-2xl rounded-bl-sm border border-gray-100 flex items-center space-x-1 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></div>
                    </div>
                </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-200 pb-24">
                <div className="flex items-end bg-gray-100 rounded-2xl px-4 py-2 border border-transparent focus-within:border-gray-300 transition-colors">
                <textarea
                    className="flex-1 bg-transparent text-primary placeholder-gray-400 focus:outline-none py-2 text-sm max-h-24 resize-none"
                    placeholder="メッセージを入力"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isTyping}
                    rows={1}
                    style={{ minHeight: '2.5rem' }}
                />
                <button 
                    onClick={handleSend}
                    disabled={!inputText.trim() || isTyping}
                    className={`ml-2 mb-1 p-1.5 rounded-full transition-colors ${
                        inputText.trim() && !isTyping ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-400'
                    }`}
                >
                    <Send size={16} />
                </button>
                </div>
            </div>
        </div>
      )}

      {/* --- DIAGNOSIS VIEW CONTENT --- */}
      {mode === 'DIAGNOSIS' && (
          <div 
            className="flex flex-col flex-1 overflow-y-auto no-scrollbar bg-white pb-24"
            onScroll={handleScroll}
          >
            {diagLoading.isLoading ? (
                <div className="flex flex-col items-center justify-center flex-1 space-y-4 min-h-[50vh]">
                    <Spinner message={diagLoading.message} />
                    {image && (
                    <img 
                        src={image} 
                        alt="Analyzing" 
                        className="w-24 h-24 object-cover rounded-sm opacity-50 grayscale"
                    />
                    )}
                </div>
            ) : analysis ? (
                // Analysis Result
                <div className="animate-fadeIn">
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
                    <div className="p-4 bg-white">
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

                    {/* Floating Reset Button */}
                    <div className="fixed bottom-24 right-4 z-10">
                        <button 
                            onClick={resetDiagnosis}
                            className="bg-white text-primary border border-gray-200 shadow-lg p-3 rounded-full hover:bg-gray-50"
                        >
                            <RefreshCw size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                // Upload View
                <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[60vh]">
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
                        <p className="text-sm font-bold text-gray-600">コーデ写真をアップロード</p>
                        <p className="text-xs text-gray-400 mt-2">全身写真を選択してください</p>
                        </>
                    )}
                    </div>

                    {diagError && (
                        <div className="mt-4 flex items-center text-red-500 bg-red-50 p-3 rounded-sm w-full text-xs">
                            <AlertCircle size={14} className="mr-2 flex-shrink-0" />
                            {diagError}
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
                        診断スタート
                        <RefreshCw size={16} className="ml-1" />
                        </button>
                    </div>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default CoachView;