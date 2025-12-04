import React from 'react';
import { User, Settings, Package, Clock, CreditCard, ChevronRight, HelpCircle, Heart, Bell } from 'lucide-react';

const ProfileView: React.FC = () => {
  const menuItems = [
    { icon: Package, label: '注文履歴' },
    { icon: Clock, label: '閲覧履歴' },
    { icon: Heart, label: 'お気に入りアイテム' },
    { icon: Bell, label: 'お知らせ' },
    { icon: CreditCard, label: 'ポイント・クーポン' },
    { icon: Settings, label: '会員登録情報' },
    { icon: HelpCircle, label: 'ヘルプ・お問い合わせ' },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto no-scrollbar pb-24">
       {/* User Info Header */}
       <div className="bg-white p-6 flex items-center gap-4 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <User size={32} className="text-gray-300" />
            </div>
            <div>
                <h2 className="text-lg font-bold mb-1">ゲスト 様</h2>
                <div className="flex gap-2">
                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">レギュラー会員</span>
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-sm">0 pt</span>
                </div>
            </div>
       </div>

       {/* Rank Banner */}
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

       {/* Menu List */}
       <div className="bg-white mt-2 border-y border-gray-100">
            {menuItems.map((item, idx) => (
                <button key={idx} className="w-full flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors">
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
           <button className="w-full bg-white text-gray-400 py-3 text-xs font-bold border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors">
               ログアウト
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