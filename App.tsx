
import React, { useState, useEffect } from 'react';
import { User, UserRole, AttendanceRecord, Task, LeaveRequest, Project } from './types';
import { db } from './services/mockDb';
import Layout from './components/Layout';
import CameraCapture from './components/CameraCapture';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECTS' | 'ATTENDANCE' | 'EMPLOYEES' | 'TASKS'>('OVERVIEW');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
  const [appState, setAppState] = useState({
    tasks: [] as Task[],
    attendance: [] as AttendanceRecord[],
    leaves: [] as LeaveRequest[],
    users: [] as User[],
    projects: [] as Project[]
  });

  // Data refreshing effect
  useEffect(() => {
    const refresh = () => setAppState({
      tasks: db.getTasks(),
      attendance: db.getAttendance(),
      leaves: db.getLeaves(),
      users: db.getUsers(),
      projects: db.getProjects()
    });
    refresh();
    const interval = setInterval(refresh, 2500); // 2.5s poll
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const fd = new FormData(e.currentTarget);
    const username = (fd.get('username') as string || '').trim();
    const password = (fd.get('password') as string || '').trim();

    // Case-insensitive username check
    const user = db.getUsers().find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );

    if (!user) {
      setLoginError('Invalid credentials. Please verify your username and password.');
    } else if (!user.isApproved) {
      setLoginError('Your access has been revoked or is pending activation. Contact Admin.');
    } else {
      setCurrentUser(user);
    }
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const fd = new FormData(e.currentTarget);
    const updateData: Partial<User> = {
      name: fd.get('name') as string,
      email: fd.get('email') as string,
      username: fd.get('username') as string,
      password: fd.get('password') as string,
      department: fd.get('department') as string,
      role: fd.get('role') as UserRole,
      isApproved: fd.get('isApproved') === 'on'
    };
    db.updateUser(editingUser.id, updateData);
    setEditingUser(null);
    alert('SUCCESS: Employee profile and access updated in database.');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center">
            <h1 className="text-6xl font-black text-blue-500 tracking-tighter drop-shadow-lg">RAMINFOSYS</h1>
            <p className="text-slate-400 mt-4 text-xs uppercase tracking-[0.4em] font-bold opacity-70">Secured Personnel Gateway</p>
          </div>
          
          <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-white/20 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
             <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Login</h2>
                <p className="text-sm text-slate-400">Authenticating access to ERP v3.0</p>
              </div>

              {loginError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold border border-red-100 animate-bounce">
                  {loginError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique Username</label>
                  <input name="username" placeholder="Username" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:bg-white transition" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                  <input name="password" type="password" placeholder="••••••••" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:bg-white transition" />
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition shadow-2xl shadow-blue-500/20 active:scale-[0.98]">
                ESTABLISH SESSION
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-100 text-[10px] text-center text-slate-400 font-medium">
              <p>Demo Admin: admin / password123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navTabs = (currentUser.role === UserRole.ADMIN) 
    ? ['OVERVIEW', 'PROJECTS', 'ATTENDANCE', 'EMPLOYEES', 'TASKS'] 
    : ['OVERVIEW', 'PROJECTS', 'ATTENDANCE', 'TASKS'];

  // Filter attendance by selected month for the table view
  const filteredAttendance = appState.attendance.filter(a => {
    const d = new Date(a.checkIn);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}` === selectedMonth;
  });

  return (
    <Layout user={currentUser} onLogout={() => setCurrentUser(null)}>
      {/* MANAGEMENT SUB-NAVIGATION */}
      {(currentUser.role === UserRole.HR || currentUser.role === UserRole.ADMIN) && (
        <div className="flex gap-2 mb-10 bg-white p-2.5 rounded-[30px] border border-slate-200 shadow-sm no-scrollbar overflow-x-auto">
          {navTabs.map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-8 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* HR & ADMIN CONTROL CENTERS */}
      {(currentUser.role === UserRole.HR || currentUser.role === UserRole.ADMIN) && (
        <div className="space-y-10 animate-in fade-in duration-500">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm relative">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">Active Check-in Queue</h3>
                      <p className="text-xs text-slate-400 font-medium">Verification required for employee presence logs</p>
                    </div>
                    <button 
                      onClick={() => db.exportAttendanceCSV()}
                      className="bg-green-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition shadow-xl shadow-green-500/20 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3"></path></svg>
                      DOWNLOAD ALL
                    </button>
                  </div>
                  <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {appState.attendance.filter(a => a.status === 'PENDING').map(a => (
                      <div key={a.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[35px] border border-slate-100 group hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <img src={a.faceCapture} className="w-20 h-20 rounded-[25px] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition" alt="Face" />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 border-4 border-white rounded-full"></div>
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-xl leading-tight">{a.userName}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1.5 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              {a.checkIn}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => db.approveAttendance(a.id, 'APPROVED')} className="h-14 w-14 flex items-center justify-center bg-white text-green-500 border-2 border-slate-100 rounded-2xl hover:bg-green-500 hover:text-white hover:border-green-500 transition-all shadow-sm font-black text-xl">
                             ✓
                          </button>
                          <button onClick={() => db.approveAttendance(a.id, 'REJECTED')} className="h-14 w-14 flex items-center justify-center bg-white text-red-400 border-2 border-slate-100 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm font-black text-xl">
                             ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {appState.attendance.filter(a => a.status === 'PENDING').length === 0 && (
                      <div className="text-center py-24 grayscale opacity-40">
                        <div className="text-6xl mb-6">📂</div>
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-800">Operational Queue Clear</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <div className="bg-slate-900 p-10 rounded-[50px] text-white shadow-3xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-[60px] group-hover:scale-125 transition duration-700"></div>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Personnel Activated</p>
                  <h4 className="text-7xl font-black mt-2 tracking-tighter">{appState.users.filter(u => u.isApproved).length}</h4>
                  <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-4">
                     <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <span>Total Records</span>
                        <span>{appState.attendance.length} Logs</span>
                     </div>
                     <button 
                       onClick={() => db.exportAttendanceCSV()}
                       className="w-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-black py-4 rounded-2xl transition tracking-widest"
                     >
                       DOWNLOAD FULL DATABASE
                     </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ATTENDANCE DATABASE */}
          {activeTab === 'ATTENDANCE' && (
            <div className="bg-white rounded-[50px] p-12 border border-slate-100 shadow-sm animate-in fade-in duration-500">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Attendance Intelligence</h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">Audit-ready historical records with monthly precision</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-[30px] border border-slate-100 shadow-inner">
                  <div className="flex flex-col gap-1 px-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reporting Month</label>
                    <input 
                      type="month" 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-transparent border-none outline-none font-black text-slate-700 text-sm cursor-pointer"
                    />
                  </div>
                  <div className="h-10 w-[1px] bg-slate-200 mx-2"></div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => db.exportMonthlyAttendanceCSV(selectedMonth)}
                      className="bg-blue-600 text-white px-6 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition shadow-xl flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      MONTHLY CSV
                    </button>
                    <button 
                      onClick={() => db.exportAttendanceCSV()}
                      className="bg-slate-900 text-white px-6 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition shadow-xl flex items-center gap-2"
                    >
                      MASTER LOG
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-[30px] border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
                      <th className="py-6 pl-8">Employee Identity</th>
                      <th className="py-6">Time-Stamp</th>
                      <th className="py-6">Verification</th>
                      <th className="py-6 text-right pr-8">Geo-Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAttendance.map(a => {
                      const user = appState.users.find(u => u.id === a.userId);
                      return (
                        <tr key={a.id} className="group hover:bg-slate-50/50 transition duration-300">
                          <td className="py-7 pl-8">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500 text-xs">
                                 {a.userName.charAt(0)}
                               </div>
                               <div>
                                 <p className="font-black text-slate-800 text-sm">{a.userName}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.username}</p>
                               </div>
                            </div>
                          </td>
                          <td className="py-7 text-xs text-slate-600 font-mono tracking-tighter">
                            {a.checkIn}
                          </td>
                          <td className="py-7">
                            <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${a.status === 'APPROVED' ? 'bg-green-100 text-green-700' : a.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-600'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-7 text-right pr-8">
                            <div className="text-[11px] font-bold text-slate-400 flex flex-col items-end gap-1">
                               <span className="bg-slate-100 px-2 py-0.5 rounded uppercase text-[8px]">Lat: {a.latitude.toFixed(5)}</span>
                               <span className="bg-slate-100 px-2 py-0.5 rounded uppercase text-[8px]">Lon: {a.longitude.toFixed(5)}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredAttendance.length === 0 && (
                      <tr><td colSpan={4} className="py-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.4em]">No records found for {selectedMonth}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PROJECTS (Workforce Mapping) */}
          {activeTab === 'PROJECTS' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700">
              <div>
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter">Resource Allocation</h3>
                <p className="text-slate-400 font-medium mt-2">Mapping personnel to active enterprise projects</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {appState.projects.map(p => (
                  <div key={p.id} className="bg-white rounded-[50px] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition duration-500 group">
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">{p.client}</p>
                      </div>
                      <span className="bg-slate-900 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">{p.status}</span>
                    </div>
                    <div className="space-y-5">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Assigned Personnel</p>
                      <div className="grid grid-cols-1 gap-3">
                        {p.team.map(uid => {
                          const user = appState.users.find(u => u.id === uid);
                          return (
                            <div key={uid} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-[10px]">
                                  {user?.name.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{user?.name}</span>
                              </div>
                              <span className="text-[8px] font-black text-slate-300 uppercase">{user?.department}</span>
                            </div>
                          )
                        })}
                        {p.team.length === 0 && <p className="text-xs text-slate-300 italic py-2">No staff assigned</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: EMPLOYEES (Directory & Access) */}
          {activeTab === 'EMPLOYEES' && currentUser.role === UserRole.ADMIN && (
            <div className="bg-white rounded-[50px] p-12 border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Identity & Access Management</h3>
                  <p className="text-slate-400 font-medium text-sm mt-1">Global administrative override for all personnel</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
                   <span className="text-2xl font-black text-blue-600">{appState.users.length}</span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-[35px] border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em]">
                      <th className="py-7 pl-10">Employee Record</th>
                      <th className="py-7">Authentication</th>
                      <th className="py-7">System Role</th>
                      <th className="py-7">Access Status</th>
                      <th className="py-7 text-right pr-10">Administrative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appState.users.map(u => (
                      <tr key={u.id} className="group hover:bg-slate-50 transition duration-300">
                        <td className="py-8 pl-10">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-[22px] flex items-center justify-center font-black text-xl border-4 border-white shadow-lg">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-lg leading-tight">{u.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{u.department}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-8">
                           <div className="flex flex-col gap-1">
                              <p className="text-xs font-bold text-slate-600">@{u.username}</p>
                              <p className="text-[10px] font-mono text-blue-500 bg-blue-50 px-2 py-0.5 rounded w-fit">{u.password}</p>
                           </div>
                        </td>
                        <td className="py-8">
                           <span className={`text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest ${u.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                             {u.role}
                           </span>
                        </td>
                        <td className="py-8">
                           <div className="flex items-center gap-2.5">
                              <div className={`w-3 h-3 rounded-full ${u.isApproved ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]'}`}></div>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${u.isApproved ? 'text-green-600' : 'text-red-500'}`}>
                                {u.isApproved ? 'ACTIVE' : 'REVOKED'}
                              </span>
                           </div>
                        </td>
                        <td className="py-8 text-right pr-10">
                          <button 
                            onClick={() => setEditingUser(u)} 
                            className="bg-white border-2 border-slate-100 text-slate-400 text-[10px] font-black px-6 py-3 rounded-2xl hover:text-blue-600 hover:border-blue-600 transition-all uppercase tracking-widest"
                          >
                            OVERRIDE
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TASKS (Management & Provisioning) */}
          {activeTab === 'TASKS' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="bg-white rounded-[50px] p-12 border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-black text-slate-800 mb-10 tracking-tight">System Account Provisioning</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  db.createUser({
                    name: String(f.get('name')),
                    username: (f.get('username') as string).trim(),
                    password: (f.get('password') as string).trim(),
                    department: String(f.get('department')),
                    role: f.get('role') as UserRole,
                    isApproved: true // Admin created users are auto-approved
                  });
                  (e.target as HTMLFormElement).reset();
                  alert('DATABASE SYNC: Employee account established and activated.');
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Full Name</label>
                    <input name="name" placeholder="E.g. Alexander Pierce" required className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none focus:ring-4 ring-blue-500/10 focus:bg-white transition" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Username</label>
                      <input name="username" placeholder="a_pierce" required className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Key</label>
                      <input name="password" placeholder="Pass123!" required className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dept. ID</label>
                      <input name="department" placeholder="Engineering" required className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                      <select name="role" className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none font-black text-[10px] uppercase tracking-widest">
                        <option value={UserRole.EMPLOYEE}>Standard Employee</option>
                        <option value={UserRole.HR}>HR Manager</option>
                        <option value={UserRole.ADMIN}>System Admin</option>
                      </select>
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 text-white font-black py-6 rounded-[30px] hover:bg-blue-700 transition shadow-2xl shadow-blue-500/20 uppercase tracking-[0.2em] text-xs">ESTABLISH IDENTITY</button>
                </form>
              </section>

              <section className="bg-white rounded-[50px] p-12 border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-black text-slate-800 mb-10 tracking-tight">Milestone Delegation</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  db.addTask({
                    id: Math.random().toString(36).substr(2, 9),
                    title: String(f.get('title')),
                    description: String(f.get('desc')),
                    assignedTo: String(f.get('to')),
                    assignedBy: currentUser.id,
                    projectId: String(f.get('project')),
                    status: 'TODO',
                    deadline: String(f.get('deadline'))
                  });
                  (e.target as HTMLFormElement).reset();
                  alert('DISPATCH: Milestone synchronized with employee calendar.');
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objective Title</label>
                    <input name="title" placeholder="Backend Refactor..." required className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none focus:ring-4 ring-blue-500/10 focus:bg-white transition" />
                  </div>
                  <textarea name="desc" placeholder="Operational details and requirements..." className="w-full p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none h-32" required />
                  <div className="grid grid-cols-2 gap-6">
                    <select name="to" required className="p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none text-[10px] font-black uppercase tracking-widest">
                      <option value="">Staff Select...</option>
                      {appState.users.filter(u => u.isApproved).map(u => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
                    </select>
                    <select name="project" required className="p-5 bg-slate-50 rounded-3xl border border-slate-100 outline-none text-[10px] font-black uppercase tracking-widest">
                      <option value="">Project Link...</option>
                      {appState.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <button className="w-full bg-slate-900 text-white font-black py-6 rounded-[30px] hover:bg-slate-800 transition shadow-2xl uppercase tracking-[0.2em] text-xs">DELEGATE OBJECTIVE</button>
                </form>
              </section>
             </div>
          )}
        </div>
      )}

      {/* EMPLOYEE PORTAL INTERFACE */}
      {currentUser.role === UserRole.EMPLOYEE && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500">
          <div className="space-y-10">
            <div className="bg-slate-900 rounded-[60px] p-16 text-white shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[120px] group-hover:bg-blue-600/20 transition duration-1000"></div>
              <div className="relative z-10">
                <h3 className="text-6xl font-black mb-8 tracking-tighter leading-none">CHECK-IN<br/>VERIFIED</h3>
                <p className="text-slate-400 mb-16 text-xl font-medium opacity-80 max-w-sm">Secure biometric handshake and GPS location anchoring required to initiate shift logs.</p>
                <button 
                  onClick={() => setShowCamera(true)}
                  className="w-full bg-blue-600 py-7 rounded-[35px] font-black text-2xl hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/40 active:scale-[0.96] tracking-tighter"
                >
                  START DAILY SHIFT
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-[60px] p-14 border border-slate-100 shadow-sm">
              <h4 className="font-black text-slate-800 uppercase text-[12px] tracking-[0.3em] mb-12 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Session History
              </h4>
              <div className="space-y-5">
                {appState.attendance.filter(a => a.userId === currentUser.id).slice(-4).reverse().map(a => (
                  <div key={a.id} className="flex items-center justify-between p-7 bg-slate-50 rounded-[35px] border border-slate-50 transition hover:border-slate-200">
                    <div className="flex items-center gap-6">
                      <div className={`w-4 h-4 rounded-full ${a.status === 'APPROVED' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-amber-400 animate-pulse'}`}></div>
                      <div>
                        <p className="text-lg font-black text-slate-700">{a.checkIn.split(', ')[0]}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{a.checkIn.split(', ')[1]}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${a.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
                {appState.attendance.filter(a => a.userId === currentUser.id).length === 0 && (
                   <div className="py-20 text-center opacity-30 grayscale">
                      <div className="text-5xl mb-4">⏱️</div>
                      <p className="font-black uppercase tracking-widest text-xs">Awaiting first session today</p>
                   </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[60px] p-16 border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-16">
               <h3 className="text-4xl font-black text-slate-800 tracking-tighter">PROJECT<br/>ROADMAP</h3>
               <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-5 py-2.5 rounded-2xl uppercase tracking-widest border border-blue-100 shadow-sm">
                 {appState.projects.find(p => p.id === currentUser.currentProjectId)?.name || 'INTERNAL'}
               </span>
            </div>
            <div className="space-y-12 flex-1 overflow-y-auto pr-4 custom-scrollbar">
              {appState.tasks.filter(t => t.assignedTo === currentUser.id).map(task => (
                <div key={task.id} className="group relative pl-12 border-l-4 border-slate-100 hover:border-blue-500 transition-all duration-700 pb-2">
                  <div className="absolute -left-[10px] top-0 w-4 h-4 bg-white border-4 border-slate-200 rounded-full group-hover:border-blue-500 group-hover:scale-125 transition"></div>
                  <h5 className="font-black text-slate-800 text-2xl group-hover:text-blue-600 transition tracking-tight">{task.title}</h5>
                  <p className="text-slate-500 mt-4 text-base leading-relaxed font-medium opacity-80">{task.description}</p>
                  <div className="mt-8 flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-2">📅 DEADLINE: {task.deadline}</span>
                    <span className={`flex items-center gap-2 ${task.status === 'COMPLETED' ? 'text-green-600' : 'text-blue-600'}`}>
                       STATUS: {task.status}
                    </span>
                  </div>
                  {task.status !== 'COMPLETED' && (
                    <button 
                      onClick={() => { db.updateTaskStatus(task.id, 'COMPLETED'); alert('SYNCED: Milestone successfully cleared in server.'); }}
                      className="mt-8 text-[11px] font-black text-blue-600 border-b-2 border-blue-200 hover:border-blue-600 transition-all pb-1 tracking-[0.2em]"
                    >
                      SYNC AS COMPLETE
                    </button>
                  )}
                </div>
              ))}
              {appState.tasks.filter(t => t.assignedTo === currentUser.id).length === 0 && (
                <div className="py-40 text-center text-slate-300">
                  <p className="text-sm font-black uppercase tracking-[0.5em]">Calendar Clear</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL ADMINISTRATIVE OVERRIDE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[60px] p-14 max-w-2xl w-full shadow-3xl border border-white/20 animate-in zoom-in-95 duration-500">
            <h3 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter leading-none">Credentials Override</h3>
            <p className="text-sm text-slate-400 mb-12 font-medium">Overwriting identity metadata for: <span className="text-blue-600 font-bold">{editingUser.name}</span></p>
            <form onSubmit={handleUpdateUser} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Legal Name</label>
                  <input name="name" defaultValue={editingUser.name} required className="w-full p-5 bg-slate-50 rounded-[24px] border border-slate-100 outline-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">System Username</label>
                   <input name="username" defaultValue={editingUser.username} required className="w-full p-5 bg-slate-50 rounded-[24px] border border-slate-100 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-blue-600 ml-1">Access Password</label>
                   <input name="password" defaultValue={editingUser.password} required className="w-full p-5 bg-blue-50/50 rounded-[24px] border border-blue-200 outline-none font-mono text-blue-600 font-bold" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Corporate Department</label>
                   <input name="department" defaultValue={editingUser.department} className="w-full p-5 bg-slate-50 rounded-[24px] border border-slate-100 outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Role Permission Cluster</label>
                  <select name="role" defaultValue={editingUser.role} className="w-full p-5 bg-slate-50 rounded-[24px] border border-slate-100 outline-none font-black text-[10px] uppercase tracking-widest">
                    <option value={UserRole.EMPLOYEE}>Employee</option>
                    <option value={UserRole.HR}>HR Manager</option>
                    <option value={UserRole.ADMIN}>System Admin</option>
                  </select>
              </div>
              <div className="p-7 bg-slate-900 rounded-[35px] border border-white/10 flex items-center justify-between group cursor-pointer">
                <div>
                  <label htmlFor="isAppr" className="text-sm font-black text-white uppercase tracking-widest cursor-pointer">Account Status</label>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{editingUser.isApproved ? 'AUTHORIZED' : 'ACCESS REVOKED'}</p>
                </div>
                <input type="checkbox" name="isApproved" defaultChecked={editingUser.isApproved} className="w-8 h-8 rounded-xl text-blue-500 bg-slate-800 border-none cursor-pointer" id="isAppr" />
              </div>
              <div className="flex gap-6 pt-6">
                <button className="flex-1 bg-blue-600 text-white font-black py-6 rounded-[30px] hover:bg-blue-700 transition shadow-2xl uppercase tracking-[0.2em] text-xs">COMMIT UPDATES</button>
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 border-4 border-slate-100 text-slate-400 font-black py-6 rounded-[30px] hover:bg-slate-50 transition uppercase tracking-[0.2em] text-xs">ABORT</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture 
          onCapture={(data) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                db.addAttendance({
                  id: Math.random().toString(36).substr(2, 9),
                  userId: currentUser!.id,
                  userName: currentUser!.name,
                  checkIn: new Date().toLocaleString(),
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  faceCapture: data,
                  status: 'PENDING'
                });
                setShowCamera(false);
                alert('AUTHENTICATED: Biometric signature and satellite coordinates synced to database.');
              },
              () => {
                alert('GPS FAILURE: Physical location anchoring is mandatory for ERP access.');
                setShowCamera(false);
              }
            );
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </Layout>
  );
};

export default App;
