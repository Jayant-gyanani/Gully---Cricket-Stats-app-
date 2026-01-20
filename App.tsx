
import React from 'react';
import { useAppStore } from './store';
import { Role } from './types';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UmpireDashboard from './components/UmpireDashboard';
import PlayerDashboard from './components/PlayerDashboard';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const { state, login, logout, createPlayer, deleteUser, updateUser, calculateAndSaveStats, updateState } = useAppStore();

  if (!state.currentUser) {
    return <Login onLogin={login} />;
  }

  const renderDashboard = () => {
    switch (state.currentUser?.role) {
      case Role.ADMIN:
        return (
          <AdminDashboard 
            state={state} 
            updateState={updateState} 
            createPlayer={createPlayer} 
            updateUser={updateUser}
            deleteUser={deleteUser} 
            calculateAndSaveStats={calculateAndSaveStats}
          />
        );
      case Role.UMPIRE:
        return <UmpireDashboard state={state} updateState={updateState} />;
      case Role.PLAYER:
        return <PlayerDashboard state={state} />;
      default:
        return <div>Access Denied</div>;
    }
  };

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <Navbar user={state.currentUser} onLogout={logout} />
      <div className="max-w-md mx-auto p-4 relative">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default App;
