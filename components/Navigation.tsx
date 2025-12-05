import React from 'react';
import { ViewState } from '../types';
import { Home, Heart, User, Sparkles, Search } from 'lucide-react';

interface NavigationProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { view: ViewState.HOME, label: 'ホーム', icon: Home },
    { view: ViewState.SEARCH, label: '検索', icon: Search },
    { view: ViewState.COACH, label: 'AI', icon: Sparkles },
    { view: ViewState.FAVORITES, label: 'お気に入り', icon: Heart },
    { view: ViewState.PROFILE, label: 'マイページ', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 pb-safe pt-2 px-2 z-50 max-w-md mx-auto">
      <div className="flex justify-between items-end h-[50px]">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          const Icon = item.icon;
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`flex flex-col items-center justify-center space-y-1 flex-1 transition-colors pb-1 ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`relative ${isActive ? '-translate-y-1' : ''} transition-transform duration-200`}>
                 <Icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive && item.view === ViewState.FAVORITES ? 'currentColor' : 'none'} />
              </div>
              <span className={`text-[9px] font-bold tracking-tight ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;