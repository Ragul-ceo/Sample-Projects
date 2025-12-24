
import React from 'react';
import { User, UserRole } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tighter text-blue-400">RAMINFOSYS</h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold">Employee Portal</p>
        </div>
        
        <nav className="mt-4 px-4 space-y-2">
          <div className="py-3 px-4 rounded-lg bg-blue-600/10 text-blue-400 font-medium">Dashboard</div>
          <div className="py-3 px-4 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer">Calendar</div>
          <div className="py-3 px-4 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer">Settings</div>
        </nav>

        <div className="mt-auto p-6 absolute bottom-0 w-64 hidden md:block border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="mt-4 w-full text-left text-xs text-slate-500 hover:text-red-400 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-slate-800">Welcome back, {user.name}</h2>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {user.role}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
