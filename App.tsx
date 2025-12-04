import React, { useState } from 'react';
import Navigation from './components/Navigation';
import HomeView from './components/HomeView';
import DiagnosisView from './components/DiagnosisView';
import ChatView from './components/ChatView';
import SearchView from './components/SearchView';
import FavoritesView from './components/FavoritesView';
import ProfileView from './components/ProfileView';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  const handleSearchNavigation = (query: string) => {
    setSearchInitialQuery(query);
    setCurrentView(ViewState.SEARCH);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView onNavigate={setCurrentView} onSearch={handleSearchNavigation} />;
      case ViewState.DIAGNOSIS:
        return <DiagnosisView />;
      case ViewState.CHAT:
        return <ChatView onNavigate={setCurrentView} />;
      case ViewState.SEARCH:
        return <SearchView onNavigate={setCurrentView} initialQuery={searchInitialQuery} />;
      case ViewState.FAVORITES:
        return <FavoritesView />;
      case ViewState.PROFILE:
        return <ProfileView />;
      default:
        return <HomeView onNavigate={setCurrentView} onSearch={handleSearchNavigation} />;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-white shadow-xl overflow-hidden relative text-primary">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden pb-[60px] bg-background">
        {renderView()}
      </main>

      {/* Navigation */}
      {/* Hide navigation on Search view for full immersion */}
      {currentView !== ViewState.SEARCH && (
        <Navigation currentView={currentView} onNavigate={setCurrentView} />
      )}
    </div>
  );
};

export default App;