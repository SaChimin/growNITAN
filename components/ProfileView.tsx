import React, { useState, useEffect, useRef } from 'react';
import { User, Settings, Clock, ChevronRight, Heart, Save, Check, LogOut, Lock, Info } from 'lucide-react';
import { UserProfile, ViewState } from '../types';

interface ProfileViewProps {
  onNavigate?: (view: ViewState) => void;
  onLogout?: () => void; // 追加
  onScrollDirectionChange?: (direction: 'up' | 'down') => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate, onLogout, onScrollDirectionChange }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'ゲスト',
    height: '',
    weight: '',
    age: '',
    skinType: '普通肌',
    hairStyle: 'マッシュ',
    concerns: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // ゲスト判定（名前が'ゲスト'かどうかで簡易判定）
  const isGuest = profile.name === 'ゲスト';

  // Scroll Detection
  const lastScrollY = useRef(0);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
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

  const menuItems = [
    { icon: Clock, label: '閲覧履歴', action: () => onNavigate?.(ViewState.HISTORY) },
    { icon: Heart, label: 'お気に入りアイテム', action: () => onNavigate?.(ViewState.FAVORITES) },
  ];

  useEffect(() => {
    const savedProfile = localStorage.getItem('akanuke_user_profile');
    if (savedProfile) {
      try {
        setProfile(prev => ({ ...prev, ...JSON.parse(savedProfile) }));
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('akanuke_user_profile', JSON.stringify(profile));
    setSaveMessage('プロフィールを保存したぜ！');
    setIsEditing(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleClick = (item: { label: string, action: (() => void) | null }) => {
      if (item.action) {
          item.action();
      } else {
          alert(`${item.label}機能は現在準備中です。今後のアップデートをお待ちください！`);
      }
  };

  return (
    <div 
        className="flex flex-col h-full bg-background overflow-y-auto no-scrollbar pb-24"
        onScroll={handleScroll}
    >
       {/* User Info Header */}
       <div className="bg-white p-6 border-b border-gray-100">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                    <User size={32} className="text-gray-300" />
                </div>
                <div>
                    <h2 className="text-lg font-bold mb-1">{profile.name || 'ゲスト'} 様</h2>
                    <div className="flex gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${isGuest ? 'bg-gray-200 text-gray-500' : 'bg-primary text-white'}`}>
                            {isGuest ? 'ゲスト会員' : 'レギュラー会員'}
                        </span>
                        {!isGuest && (
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-sm">0 pt</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Form Area */}
            <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-gray-500 flex items-center gap-1">
                        <Settings size={12} />
                        基本データ (AI診断に使用)
                    </h3>
                    
                    {!isGuest ? (
                        <button 
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-sm flex items-center gap-1 transition-colors ${
                                isEditing 
                                ? 'bg-primary text-white hover:bg-gray-800' 
                                : 'bg-white border border-gray-200 text-primary hover:bg-gray-100'
                            }`}
                        >
                            {isEditing ? <><Save size={12} /> 保存</> : '編集'}
                        </button>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-sm">
                            <Lock size={10} />
                            編集不可
                        </span>
                    )}
                </div>

                {/* Guest Restriction Message */}
                {isGuest && (
                    <div className="mb-4 bg-white border border-blue-100 p-3 rounded-sm flex gap-3">
                        <Info size={16} className="text-secondary flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-gray-600 mb-1">ゲストモードでは編集できません</p>
                            <p className="text-[10px] text-gray-400 leading-tight">
                                正確なAI診断を受けるために、身長や体重などのデータを保存するには
                                <button onClick={onLogout} className="text-primary underline ml-1 hover:opacity-70">
                                    アカウント登録
                                </button>
                                してください。
                            </p>
                        </div>
                    </div>
                )}

                <div className={`space-y-3 ${isGuest ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">名前</label>
                            <input 
                                type="text" 
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full text-sm font-bold bg-white border border-gray-200 rounded-sm px-2 py-1.5 focus:border-secondary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">年齢</label>
                            <input 
                                type="number" 
                                name="age"
                                value={profile.age}
                                onChange={handleChange}
                                disabled={!isEditing}
                                placeholder="例: 22"
                                className="w-full text-sm font-bold bg-white border border-gray-200 rounded-sm px-2 py-1.5 focus:border-secondary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">身長 (cm)</label>
                            <input 
                                type="number" 
                                name="height"
                                value={profile.height}
                                onChange={handleChange}
                                disabled={!isEditing}
                                placeholder="175"
                                className="w-full text-sm font-bold bg-white border border-gray-200 rounded-sm px-2 py-1.5 focus:border-secondary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">体重 (kg)</label>
                            <input 
                                type="number" 
                                name="weight"
                                value={profile.weight}
                                onChange={handleChange}
                                disabled={!isEditing}
                                placeholder="65"
                                className="w-full text-sm font-bold bg-white border border-gray-200 rounded-sm px-2 py-1.5 focus:border-secondary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-bold text-gray-400 block mb-1">肌質</label>
                            <select 
                                name="skinType"
                                value={profile.skinType}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className="w-full text-sm font-bold bg-white border border-gray-200 rounded-sm px-2 py-1.5 focus:border-secondary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 appearance-none"
                            >
                                <option value="普通肌">普通</option>
                                <option value="乾燥肌">乾燥</option>
                                <option value="脂性肌">脂性</option>
                                <option value="混合肌">混合</option>
                                <option value="敏感肌">敏感</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">現在の髪型</label>
                        <select 
                            name="hairStyle"
                            value={profile.hairStyle}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="w-full text-sm font-bold bg-white border border-gray-200 rounded-sm px-2 py-1.5 focus:border-secondary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 appearance-none"
                        >
                            <option value="ショート">ショート（短髪）</option>
                            <option value="マッシュ">マッシュ</option>
                            <option value="センターパート">センターパート</option>
                            <option value="パーマ">パーマ</option>
                            <option value="ミディアム">ミディアム</option>
                            <option value="ロング">ロング</option>
                            <option value="ボウズ">ボウズ</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">悩み・目標（AIへの共有事項）</label>
                        <textarea 
                            name="concerns"
                            value={profile.concerns}
                            onChange={handleChange}
                            disabled={!isEditing}
                            placeholder="例: 足が短く見えるのが悩み。大人っぽくなりたい。"
                            rows={2}
                            className="w-full text-xs bg-white border border-gray-200 rounded-sm px-2 py-1.5 focus:border-secondary focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 resize-none"
                        />
                    </div>
                </div>

                {saveMessage && (
                    <div className="mt-3 flex items-center text-green-600 text-xs font-bold animate-pulse">
                        <Check size={14} className="mr-1" />
                        {saveMessage}
                    </div>
                )}
            </div>
       </div>

       {/* Rank Banner */}
       {!isGuest && (
        <div className="p-4">
            <div className="bg-gradient-to-r from-gray-800 to-black text-white p-4 rounded-sm flex justify-between items-center shadow-md">
                <div>
                    <div className="text-xs font-bold text-gray-400 mb-1">アニキランク</div>
                    <div className="text-xl font-black italic tracking-wider">BRONZE</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-400">次のランクまで</div>
                    <div className="text-sm font-bold">あと <span className="text-yellow-400 text-lg">3</span> 回 診断</div>
                </div>
            </div>
        </div>
       )}

       {/* Menu List */}
       <div className="bg-white mt-2 border-y border-gray-100">
            {menuItems.map((item, idx) => (
                <button 
                    key={idx} 
                    onClick={() => handleClick(item)}
                    className="w-full flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <item.icon size={20} className="text-gray-400" />
                        <span className="text-sm font-medium text-primary">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                </button>
            ))}
       </div>
        
       {/* Other Links */}
       <div className="mt-6 px-4">
           <button 
                onClick={onLogout}
                className="w-full bg-white text-gray-400 py-3 text-xs font-bold border border-gray-200 rounded-sm hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
            >
               <LogOut size={14} />
               {isGuest ? 'トップへ戻る' : 'ログアウト'}
           </button>
           <div className="text-center mt-6 mb-8">
               <div className="text-xs font-bold text-gray-300">AKANUKE BRO</div>
               <div className="text-[10px] text-gray-300 mt-1">Ver 1.0.0</div>
           </div>
       </div>
    </div>
  );
};

export default ProfileView;