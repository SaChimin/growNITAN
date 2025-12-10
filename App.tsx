import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import CoachView from './components/CoachView';
import SearchView from './components/SearchView';
import FavoritesView from './components/FavoritesView';
import ProfileView from './components/ProfileView';
import ProductDetailView from './components/ProductDetailView';
import HistoryView from './components/HistoryView';
import LoginView from './components/LoginView';
import { ViewState, FashionItem } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<FashionItem | null>(null);
  
  // ナビゲーション履歴管理
  const [previousView, setPreviousView] = useState<ViewState>(ViewState.HOME); // 商品詳細用
  const [coachReturnView, setCoachReturnView] = useState<ViewState>(ViewState.HOME); // AIチャット用
  
  const [isNavVisible, setIsNavVisible] = useState(true);

  // 初回ロード時にログイン状態を確認
  useEffect(() => {
    const session = localStorage.getItem('akanuke_session');
    if (session) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('akanuke_session', 'active');
    setIsLoggedIn(true);
    setCurrentView(ViewState.HOME);
  };

  const handleLogout = () => {
    // 確認ダイアログなしで即座にログアウト
    localStorage.removeItem('akanuke_session');
    setIsLoggedIn(false);
    setCurrentView(ViewState.HOME); // Reset view
  };

  // ビュー切り替え時はナビゲーションを表示状態に戻す
  const handleNavigate = (view: ViewState) => {
    // Coach画面に行く場合、現在の画面を戻り先として保存
    if (view === ViewState.COACH) {
      setCoachReturnView(currentView);
    }
    setCurrentView(view);
    setIsNavVisible(true);
  };

  const handleSearchNavigation = (query: string) => {
    setSearchInitialQuery(query);
    handleNavigate(ViewState.SEARCH);
  };

  const handleProductSelect = (item: FashionItem) => {
    setSelectedItem(item);
    if (currentView !== ViewState.PRODUCT_DETAIL) {
        setPreviousView(currentView);
    }
    handleNavigate(ViewState.PRODUCT_DETAIL);
  };

  const handleBackFromDetail = () => {
    handleNavigate(previousView);
  };

  // スクロール方向に応じたナビゲーション制御
  const handleScrollUpdate = (direction: 'up' | 'down') => {
    if (direction === 'down' && isNavVisible) {
      setIsNavVisible(false);
    } else if (direction === 'up' && !isNavVisible) {
      setIsNavVisible(true);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView onNavigate={handleNavigate} onSearch={handleSearchNavigation} onItemSelect={handleProductSelect} onScrollDirectionChange={handleScrollUpdate} />;
      case ViewState.COACH:
        // onBackで記憶しておいた元の画面に戻る
        return <CoachView onNavigate={handleNavigate} onBack={() => handleNavigate(coachReturnView)} onScrollDirectionChange={handleScrollUpdate} />;
      case ViewState.SEARCH:
        return <SearchView onNavigate={handleNavigate} initialQuery={searchInitialQuery} onItemSelect={handleProductSelect} onScrollDirectionChange={handleScrollUpdate} />;
      case ViewState.FAVORITES:
        return <FavoritesView onItemSelect={handleProductSelect} onScrollDirectionChange={handleScrollUpdate} />;
      case ViewState.PROFILE:
        // onLogoutを渡す
        return <ProfileView onNavigate={handleNavigate} onLogout={handleLogout} onScrollDirectionChange={handleScrollUpdate} />;
      case ViewState.HISTORY:
        return <HistoryView onNavigate={handleNavigate} onItemSelect={handleProductSelect} onScrollDirectionChange={handleScrollUpdate} />;
      case ViewState.PRODUCT_DETAIL:
        return selectedItem ? (
            <ProductDetailView 
                item={selectedItem} 
                onBack={handleBackFromDetail} 
                onItemSelect={handleProductSelect}
                onNavigate={handleNavigate}
            />
        ) : (
            <HomeView onNavigate={handleNavigate} onSearch={handleSearchNavigation} onItemSelect={handleProductSelect} onScrollDirectionChange={handleScrollUpdate} />
        );
      default:
        return <HomeView onNavigate={handleNavigate} onSearch={handleSearchNavigation} onItemSelect={handleProductSelect} onScrollDirectionChange={handleScrollUpdate} />;
    }
  };

  // ログインしていない場合はLoginViewを表示
  if (!isLoggedIn) {
      return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-white shadow-xl overflow-hidden relative text-primary">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden bg-background">
        {renderView()}
      </main>

      {/* Navigation (Hide on ProductDetail) */}
      {currentView !== ViewState.PRODUCT_DETAIL && (
         <div className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto transition-transform duration-300 ease-in-out ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            <Navigation currentView={currentView} onNavigate={handleNavigate} />
         </div>
      )}
    </div>
  );
};

export default App;