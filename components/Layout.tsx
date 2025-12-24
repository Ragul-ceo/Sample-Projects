
import React from 'react';
import { User, UserRole } from '../types';
import Logo from './Logo';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, activeTab, onTabChange, children }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[360px] bg-[#0a0f1c] text-white hidden lg:flex flex-col shrink-0 relative z-20 shadow-2xl border-r border-white/5">
        <div className="p-12 pb-10">
          <Logo className="h-44 float-anim" showTagline={false} />
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mt-12"></div>
        </div>
        
        <nav className="flex-1 px-8 space-y-2 py-4 overflow-y-auto no-scrollbar">
          <SectionTitle>Global Operations</SectionTitle>
          <SidebarLink active={activeTab === 'OVERVIEW'} onClick={() => onTabChange('OVERVIEW')} icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" label="Dashboard" />
          <SidebarLink active={activeTab === 'TASKS'} onClick={() => onTabChange('TASKS')} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="Planner" />
          <SidebarLink active={activeTab === 'LEAVES'} onClick={() => onTabChange('LEAVES')} icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="Absence Hub" />
          <SidebarLink active={activeTab === 'PROJECTS'} onClick={() => onTabChange('PROJECTS')} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" label="Resource Assets" />
          
          {(user.role === UserRole.ADMIN || user.role === UserRole.HR) && (
            <>
              <SectionTitle className="mt-12">Administration</SectionTitle>
              <SidebarLink active={activeTab === 'EMPLOYEES'} onClick={() => onTabChange('EMPLOYEES')} icon="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09a10.116 10.116 0 001.259-2.227" label="Personnel" />
            </>
          )}
          
          <SectionTitle className="mt-12">Identity</SectionTitle>
          <SidebarLink active={activeTab === 'SETTINGS'} onClick={() => onTabChange('SETTINGS')} icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066" label="Preferences" />
        </nav>

        <div className="p-10">
          <div className="bg-white/[0.03] p-6 rounded-[32px] border border-white/5 hover:bg-white/[0.05] transition-all group cursor-pointer shadow-inner">
            <div className="flex items-center gap-5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#00599f] flex items-center justify-center font-black text-white text-2xl shadow-xl group-hover:scale-110 transition duration-500">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-extrabold truncate font-jakarta">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{user.role} Tier</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-[#b11e31] text-slate-500 hover:text-white py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">Sign Out</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <header className="h-28 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-12 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-10">
            <div className="lg:hidden">
              <Logo className="h-10 w-28" />
            </div>
            <div className="hidden lg:flex flex-col">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter font-jakarta uppercase">{activeTab.replace('_', ' ')} Terminal</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Secure Node Active</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <button className="w-16 h-16 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-[#00599f] transition-all relative shadow-sm hover:shadow-xl hover:-translate-y-1">
              <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-[#b11e31] rounded-full border-2 border-white shadow-[0_0_8px_#b11e31]"></span>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};

const SectionTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 px-4 ${className}`}>{children}</div>
);

const SidebarLink = ({ icon, label, active = false, onClick }: { icon: string, label: string, active?: boolean, onClick: () => void }) => (
  <div onClick={onClick} className={`flex items-center gap-5 px-6 py-5 rounded-2xl cursor-pointer transition-all duration-500 group relative ${active ? 'bg-gradient-to-r from-[#00599f] to-[#004a85] text-white shadow-2xl shadow-blue-900/40 -translate-y-0.5' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    <span className="transition-transform group-hover:scale-125"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg></span>
    <span className="text-[12px] font-black uppercase tracking-[0.15em]">{label}</span>
    {active && <span className="absolute right-4 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_white]"></span>}
  </div>
);

export default Layout;
