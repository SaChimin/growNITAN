import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { ChatMessage } from '../types';
import { createCoachChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "よう！調子はどうだ？服のこと、髪型のこと、自信の付け方...何でも相談してくれよな。",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    chatSessionRef.current = createCoachChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      
      const aiResponseText = result.text || "悪い、ちょっと考え事してた。もう一回言ってくれ。";

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponseText,
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

  return (
    <div className="flex flex-col h-full bg-[#8E9DCC]/10">
      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button className="text-gray-600">
            <ChevronLeft size={24} />
        </button>
        <div className="text-center">
            <h1 className="text-sm font-bold text-primary">アニキ (AI Coach)</h1>
            <span className="text-[10px] text-green-500 font-bold">● Online</span>
        </div>
        <button className="text-gray-600">
            <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 bg-[#7289DA]/5">
        <div className="text-center text-[10px] text-gray-400 my-2">今日</div>
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'}`}
          >
            {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold mr-2 flex-shrink-0 mt-1">
                    兄
                </div>
            )}
            
            <div className="max-w-[75%]">
                <div 
                className={`p-3 text-sm leading-relaxed shadow-sm relative ${
                    msg.role === 'user' 
                    ? 'bg-secondary text-white rounded-l-2xl rounded-tr-2xl rounded-br-sm' 
                    : 'bg-white text-primary rounded-r-2xl rounded-tl-2xl rounded-bl-sm border border-gray-100'
                }`}
                >
                {msg.text}
                </div>
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
      <div className="p-3 bg-white border-t border-gray-200">
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
  );
};

export default ChatView;