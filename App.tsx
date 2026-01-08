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

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<FashionItem | null>(null);
  const [previousView, setPreviousView] = useState<ViewState>(ViewState.HOME);
  const [isNavVisible, setIsNavVisible] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('akanuke_session')) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('akanuke_session', 'active');
    setIsLoggedIn(true);
    setCurrentView(ViewState.HOME);
  };

  const handleLogout = () => {
    localStorage.removeItem('akanuke_session');
    setIsLoggedIn(false);
    setCurrentView(ViewState.HOME);
  };

  const navigateTo = useCallback((view: ViewState) => {
    setPreviousView(currentView);
    setCurrentView(view);
    setIsNavVisible(true);
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

  if (!isLoggedIn) return <LoginView onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-white shadow-xl overflow-hidden relative">
      <main className="flex-1 overflow-hidden bg-background">
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