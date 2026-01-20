
import React from 'react';
import { User, Role } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold leading-tight">GullyCricket</h1>
          <span className="text-xs text-slate-400 uppercase tracking-widest">{user.role}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium opacity-80">{user.username}</span>
          <button 
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
