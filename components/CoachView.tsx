import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft, Camera, MessageCircle, ScanFace, Share2, ShoppingCart, Tag, Shirt } from 'lucide-react';
import { ChatMessage, ViewState, FashionAnalysis, LoadingState } from '../types';
import { createCoachChat, analyzeFashionImage, safeParseJson } from '../services/geminiService';
import { Chat } from "@google/genai";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Spinner from './Spinner';

interface CoachViewProps {
  onNavigate: (view: ViewState) => void;
  onBack?: () => void;
  onScrollDirectionChange?: (direction: 'up' | 'down') => void;
}

const CoachView: React.FC<CoachViewProps> = ({ onNavigate, onBack, onScrollDirectionChange }) => {
  const [mode, setMode] = useState<'CHAT' | 'DIAGNOSIS'>('CHAT');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FashionAnalysis | null>(null);
  const [diagLoading, setDiagLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatSessionRef.current) chatSessionRef.current = createCoachChat();
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'model',
        text: "よう！アニキだ。今日はどんな悩みがあるんだ？コーデの診断もできるぜ。",
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mode]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatSessionRef.current || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const parsed = safeParseJson(result.text);
      
      if (!parsed) throw new Error("Invalid AI response");

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: parsed.text || "わりぃ、うまく言葉が出なかったぜ。",
        recommendations: parsed.recommendedItems?.map((item: any, i: number) => ({
          name: item.name,
          imageUrl: `https://pollinations.ai/p/${encodeURIComponent(item.imagePrompt || item.name)}?width=300&height=400&model=flux&seed=${Date.now()+i}`
        })),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);

      if (db) {
        try {
          await addDoc(collection(db, "coach_chat_history"), {
            user_message: userMsg.text,
            ai_response: aiMsg.text,
            timestamp: serverTimestamp(),
            status: "completed"
          });
        } catch (fireErr) {
          console.error("Firestore save error:", fireErr);
        }
      }

    } catch (e) {
      console.error("Coach chat error:", e);
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "わりぃ、ちょっと調子が悪い。もう一回言ってくれ。", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setDiagLoading({ isLoading: true, message: 'アニキが分析中だ...' });
    try {
      const base64Data = image.split(',')[1];
      const result = await analyzeFashionImage(base64Data);
      setAnalysis(result);

      if (db) {
        try {
          await addDoc(collection(db, "fashion_analysis_history"), {
            score: result.score,
            critique: result.critique,
            timestamp: serverTimestamp(),
            status: "completed"
          });
        } catch (fireErr) {
          console.error("Firestore save error:", fireErr);
        }
      }

    } catch (e) {
      console.error("Analysis error:", e);
      alert("分析に失敗したぜ。");
    } finally {
      setDiagLoading({ isLoading: false, message: '' });
    }
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
      alert('スクリーンショットを撮って共有してくれ！');
    }
  };

  const openAmazonSearch = (query: string) => {
    const url = `https://www.amazon.co.jp/s?k=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F7FA]">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => onBack ? onBack() : onNavigate(ViewState.HOME)}><ChevronLeft size={24} /></button>
            <div className="font-bold text-sm tracking-widest uppercase">AI Coach</div>
            <div className="w-6" />
          </div>
          <div className="px-4 pb-3 flex bg-gray-50 p-1 m-2 rounded-lg">
            <button onClick={() => setMode('CHAT')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${mode === 'CHAT' ? 'bg-white shadow-sm' : 'text-gray-400'}`}><MessageCircle size={14} />相談</button>
            <button onClick={() => setMode('DIAGNOSIS')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${mode === 'DIAGNOSIS' ? 'bg-white shadow-sm' : 'text-gray-400'}`}><ScanFace size={14} />診断</button>
          </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {mode === 'CHAT' ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}>
                  {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary text-white text-[10px] flex items-center justify-center mr-2 flex-shrink-0">兄</div>}
                  <div className={`max-w-[80%] p-3 text-sm shadow-sm rounded-2xl ${msg.role === 'user' ? 'bg-secondary text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'}`}>
                    {msg.text}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                        {msg.recommendations.map((rec, i) => (
                          <div key={i} className="flex-shrink-0 w-28 bg-gray-50 p-1 rounded">
                            <img src={rec.imageUrl} className="w-full aspect-[3/4] object-cover rounded-sm mb-1" alt={rec.name} />
                            <div className="text-[9px] font-bold truncate">{rec.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-[10px] text-gray-400 ml-10">アニキが入力中...</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-white border-t border-gray-100 pb-24">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-1">
                <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-transparent py-2 text-sm focus:outline-none" placeholder="アニキに相談..." disabled={isTyping} />
                <button onClick={handleSend} disabled={isTyping || !inputText.trim()} className="ml-2 p-1.5 bg-secondary text-white rounded-full disabled:bg-gray-300"><Send size={16} /></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 pb-24">
            {diagLoading.isLoading ? (
              <Spinner message={diagLoading.message} />
            ) : analysis ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="aspect-[3/4] rounded-lg overflow-hidden relative shadow-xl">
                  <img src={image!} className="w-full h-full object-cover" alt="My outfit" />
                  <div className="absolute top-4 right-4">
                     <button onClick={handleShare} className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg"><Share2 size={20} /></button>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-lg font-black italic text-2xl">
                    {analysis.score}<span className="text-xs not-italic text-gray-400">/100</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="text-xs font-bold text-gray-400 mb-1">アニキの評</div>
                  <p className="text-sm font-medium text-gray-700 leading-relaxed">{analysis.critique}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1"><Tag size={12} /> おすすめアイテム</div>
                    <div className="space-y-3">
                        {analysis.recommendedItems.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center border-b border-gray-50 pb-3 last:border-0">
                                <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-300"><Shirt size={20} /></div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-primary">{item.name}</div>
                                    <div className="text-[9px] text-gray-400">{item.reason}</div>
                                </div>
                                <button onClick={() => openAmazonSearch(item.searchQuery)} className="p-2 bg-primary text-white rounded-full shadow-sm"><ShoppingCart size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={() => { setAnalysis(null); setImage(null); }} className="w-full py-3 border border-gray-200 rounded-lg text-xs font-bold text-gray-400 bg-white">もう一度診断する</button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[3/4] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                  {image ? <img src={image} className="w-full h-full object-cover rounded-lg" alt="Preview" /> : <div className="text-center"><Camera size={48} className="mx-auto text-gray-300 mb-2" /><p className="text-sm font-bold text-gray-400">コーデをアップロード</p></div>}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
                <button onClick={handleAnalyze} disabled={!image || diagLoading.isLoading} className="w-full mt-6 py-4 bg-primary text-white font-bold rounded-lg shadow-lg disabled:bg-gray-200">診断開始</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachView;