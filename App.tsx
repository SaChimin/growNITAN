import React, { useState, useEffect, useCallback } from 'react';
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
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, isFirebaseConfigValid } from './services/firebase';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<FashionItem | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>(ViewState.HOME);
  const [isNavVisible, setIsNavVisible] = useState(true);

  // 認証状態の監視
  useEffect(() => {
    // Firebaseが設定されていない場合はローカルセッションのみを確認
    const guestSession = localStorage.getItem('akanuke_session') === 'guest';
    if (guestSession) {
      setIsLoggedIn(true);
      setIsInitialized(true);
      return;
    }

    if (isFirebaseConfigValid && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
        setIsInitialized(true);
      });
      return () => unsubscribe();
    } else {
      // Firebase未設定時は強制的に未ログイン状態から
      setIsInitialized(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView(ViewState.HOME);
  };

  const handleLogout = async () => {
    try {
      if (isFirebaseConfigValid && auth) {
        await signOut(auth);
      }
      localStorage.removeItem('akanuke_session');
      localStorage.removeItem('akanuke_user_profile');
      setIsLoggedIn(false);
      setCurrentView(ViewState.HOME);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const navigateTo = useCallback((view: ViewState) => {
    setPreviousView(currentView);
    setCurrentView(view);
    setIsNavVisible(true);
    // 画面の最上部へスクロール
    const mainElement = document.querySelector('main');
    if (mainElement) mainElement.scrollTop = 0;
  }, [currentView]);

  const handleProductSelect = (item: FashionItem) => {
    setSelectedItem(item);
    navigateTo(ViewState.PRODUCT_DETAIL);
  };

  const handleScrollUpdate = (direction: 'up' | 'down') => {
    setIsNavVisible(direction === 'up');
  };

  const renderCurrentView = () => {
    const commonProps = { onScrollDirectionChange: handleScrollUpdate };
    
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView onNavigate={navigateTo} onSearch={(q) => { setSearchInitialQuery(q); navigateTo(ViewState.SEARCH); }} onItemSelect={handleProductSelect} {...commonProps} />;
      case ViewState.COACH:
        return <CoachView onNavigate={navigateTo} onBack={() => navigateTo(previousView)} {...commonProps} />;
      case ViewState.SEARCH:
        return <SearchView onNavigate={navigateTo} initialQuery={searchInitialQuery} onItemSelect={handleProductSelect} />;
      case ViewState.FAVORITES:
        return <FavoritesView onItemSelect={handleProductSelect} {...commonProps} />;
      case ViewState.PROFILE:
        return <ProfileView onNavigate={navigateTo} onLogout={handleLogout} {...commonProps} />;
      case ViewState.HISTORY:
        return <HistoryView onNavigate={navigateTo} onItemSelect={handleProductSelect} {...commonProps} />;
      case ViewState.PRODUCT_DETAIL:
        return selectedItem ? <ProductDetailView item={selectedItem} onBack={() => navigateTo(previousView)} onItemSelect={handleProductSelect} onNavigate={navigateTo} /> : null;
      default:
        return <HomeView onNavigate={navigateTo} onSearch={() => {}} onItemSelect={handleProductSelect} />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary mb-4"></div>
        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Initializing...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-white shadow-xl overflow-hidden relative border-x border-gray-100">
      <main className="flex-1 overflow-y-auto no-scrollbar bg-background">
        {renderCurrentView()}
      </main>
      
      {currentView !== ViewState.PRODUCT_DETAIL && (
         <div className={`fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto transition-transform duration-300 ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
           <Navigation currentView={currentView} onNavigate={navigateTo} />
         </div>
      )}
    </div>
  );
};

export default App;