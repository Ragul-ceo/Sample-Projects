
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, UserRole, AttendanceRecord, Task, LeaveRequest, Project, Announcement } from './types';
import { db } from './services/mockDb';
import Layout from './components/Layout';
import CameraCapture from './components/CameraCapture';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PROJECTS' | 'EMPLOYEES' | 'TASKS' | 'LEAVES' | 'SETTINGS'>('OVERVIEW');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [appState, setAppState] = useState({
    tasks: [] as Task[],
    attendance: [] as AttendanceRecord[],
    leaves: [] as LeaveRequest[],
    users: [] as User[],
    projects: [] as Project[],
    announcements: [] as Announcement[]
  });

  const refreshState = useCallback(() => {
    db.load();
    setAppState({
      tasks: db.getTasks(),
      attendance: db.getAttendance(),
      leaves: db.getLeaves(),
      users: db.getUsers(),
      projects: db.getProjects(),
      announcements: db.getAnnouncements()
    });
  }, []);

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 3000);
    window.addEventListener('storage', refreshState);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', refreshState);
    };
  }, [refreshState]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = (formData.get('username') as string || '').trim();
    const password = (formData.get('password') as string || '').trim();

    setLoginError(null);
    setIsLoggingIn(true);
    await new Promise(r => setTimeout(r, 800));
    
    db.load();
    const user = db.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (!user) {
      setLoginError('Authentication failed. Check credentials.');
      setIsLoggingIn(false);
    } else if (!user.isApproved) {
      setLoginError('Account locked. Contact System Admin.');
      setIsLoggingIn(false);
    } else {
      setCurrentUser(user);
      setIsLoggingIn(false);
    }
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    db.createUser({
      name: fd.get('name') as string,
      username: fd.get('username') as string,
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      department: fd.get('department') as string,
      role: fd.get('role') as UserRole,
      isApproved: true
    });
    refreshState();
    setShowAddUserModal(false);
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    db.addTask({
      id: `t_${Date.now()}`,
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      assignedTo: fd.get('assignedTo') as string,
      assignedBy: currentUser!.id,
      projectId: fd.get('projectId') as string || 'p1',
      status: 'TODO',
      deadline: fd.get('deadline') as string
    });
    refreshState();
    setShowAddTaskModal(false);
  };

  const handleRequestLeave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    db.requestLeave({
      id: `l_${Date.now()}`,
      userId: currentUser!.id,
      userName: currentUser!.name,
      startDate: fd.get('startDate') as string,
      endDate: fd.get('endDate') as string,
      reason: fd.get('reason') as string,
      type: fd.get('type') as any,
      status: 'PENDING'
    });
    refreshState();
    setShowLeaveModal(false);
  };

  const isHR = currentUser?.role === UserRole.HR;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const canManage = isAdmin || isHR;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fcfdfe] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00599f] opacity-[0.03] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#b11e31] opacity-[0.03] blur-[120px] rounded-full"></div>
        
        <div className="w-full max-w-[460px] z-10 animate-in fade-in zoom-in duration-700">
          <div className="flex flex-col items-center mb-12">
            <Logo className="h-52 float-anim mb-4" />
          </div>
          
          <div className="bg-white/80 backdrop-blur-2xl p-12 rounded-[56px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter font-jakarta mb-8 text-center uppercase">Gateway Login</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <Input label="Network UID" name="username" placeholder="Username" required />
              <Input label="Access Key" name="password" type="password" placeholder="••••••••" required />
              
              {loginError && <div className="text-rose-600 text-[12px] font-bold text-center bg-rose-50/80 py-3 rounded-2xl border border-rose-100">{loginError}</div>}
              
              <button disabled={isLoggingIn} className="w-full bg-[#00599f] text-white font-black py-5.5 rounded-[24px] hover:bg-[#004a85] transition-all shadow-xl shadow-blue-900/20 uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3">
                {isLoggingIn ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Authorize Access'}
              </button>
            </form>
          </div>
          <p className="mt-12 text-center text-slate-300 text-[10px] font-bold tracking-[0.4em] uppercase">Secured by Ram Infosys • v5.3.0</p>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={() => setCurrentUser(null)} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
        
        {/* DASHBOARD */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-12">
            <header className="flex flex-col sm:flex-row justify-between items-end gap-6">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter font-jakarta">Dashboard</h1>
                <p className="text-slate-500 font-medium text-lg mt-1">Status briefing for identity node: {currentUser.name}</p>
              </div>
              <div className="bg-white px-6 py-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{new Date().toDateString()}</span>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Total Force" value={appState.users.length} icon="users" color="blue" />
              <StatCard label="Live Units" value={appState.projects.filter(p => p.status === 'ACTIVE').length} icon="layers" color="indigo" />
              <StatCard label="Pending Logs" value={appState.attendance.filter(a => a.status === 'PENDING').length} icon="clock" color="amber" />
              <StatCard label="Milestones" value={appState.tasks.filter(t => t.status !== 'COMPLETED').length} icon="check-square" color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 bg-white rounded-[48px] p-10 lg:p-14 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-black text-slate-900 font-jakarta tracking-tight">Biometric Log Verification</h3>
                  <button onClick={refreshState} className="p-3 text-slate-400 hover:text-[#00599f] transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
                </div>
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                  {appState.attendance.filter(a => canManage ? a.status === 'PENDING' : a.userId === currentUser.id).map(a => (
                    <div key={a.id} className="group flex items-center justify-between p-7 bg-slate-50/50 rounded-[40px] border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                      <div className="flex items-center gap-6">
                        <img src={a.faceCapture} className="w-20 h-20 rounded-[28px] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition" alt="Face" />
                        <div>
                          <p className="font-black text-slate-900 text-xl tracking-tight">{a.userName}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {a.checkIn}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {canManage ? (
                          <>
                            <button onClick={() => db.approveAttendance(a.id, 'APPROVED')} className="px-7 py-3.5 bg-[#00599f] text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest">Verify</button>
                            <button onClick={() => db.approveAttendance(a.id, 'REJECTED')} className="px-7 py-3.5 bg-rose-50 text-rose-600 rounded-[20px] font-black text-[10px] uppercase tracking-widest">Deny</button>
                          </>
                        ) : (
                          <span className={`px-7 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest border ${a.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{a.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-10">
                {isEmployee && (
                  <div className="bg-gradient-to-br from-[#00599f] to-[#004a85] rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <h3 className="text-3xl font-black mb-4 tracking-tighter leading-tight font-jakarta">IDENTITY<br/>PROTOCOL</h3>
                      <p className="text-white/70 text-sm mb-12 font-medium">Verify your presence via biometric and GPS telemetry.</p>
                      <button onClick={() => setShowCamera(true)} className="w-full bg-white text-[#00599f] font-black py-5 rounded-[22px] hover:shadow-2xl transition-all uppercase tracking-widest text-[11px]">Start Session</button>
                    </div>
                  </div>
                )}
                <div className="bg-white rounded-[48px] p-10 lg:p-12 border border-slate-100 shadow-sm">
                  <h4 className="text-xl font-black text-slate-900 mb-8 font-jakarta">Transmissions</h4>
                  <div className="space-y-8">
                    {appState.announcements.slice(0, 3).map(ann => (
                      <div key={ann.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-500 before:rounded-full">
                        <p className="font-black text-slate-800 text-[15px] leading-snug">{ann.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{new Date(ann.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PLANNER (TASKS) */}
        {activeTab === 'TASKS' && (
          <div className="space-y-12">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter font-jakarta">Operational Planner</h1>
                <p className="text-slate-500 font-medium text-lg mt-1">Orchestrating milestones and enterprise output.</p>
              </div>
              {canManage && (
                <button onClick={() => setShowAddTaskModal(true)} className="bg-[#00599f] text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-900/10">Assign Mission</button>
              )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {appState.tasks.filter(t => canManage ? true : t.assignedTo === currentUser.id).map(t => (
                <div key={t.id} className={`p-10 rounded-[48px] border bg-white shadow-sm transition-all hover:shadow-2xl ${t.status === 'COMPLETED' ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start mb-8">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{t.status}</span>
                    <span className="text-[10px] text-slate-400 font-black tracking-[0.2em]">{t.deadline}</span>
                  </div>
                  <h4 className="text-2xl font-black text-slate-800 font-jakarta leading-tight mb-4">{t.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed mb-10">{t.description}</p>
                  <div className="pt-8 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">
                        {appState.users.find(u => u.id === t.assignedTo)?.name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator {appState.users.find(u => u.id === t.assignedTo)?.name.split(' ')[0]}</span>
                    </div>
                    {t.assignedTo === currentUser.id && t.status !== 'COMPLETED' && (
                      <button onClick={() => db.updateTaskStatus(t.id, 'COMPLETED')} className="text-[#00599f] font-black text-[10px] uppercase tracking-widest border-b-2 border-blue-100">Complete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABSENCE REGISTRY (LEAVES) */}
        {activeTab === 'LEAVES' && (
          <div className="space-y-12">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter font-jakarta uppercase leading-none">Absence<br/>Registry</h1>
                <p className="text-slate-500 font-medium text-lg mt-1">Management of operational availability.</p>
              </div>
              {!canManage && (
                <button onClick={() => setShowLeaveModal(true)} className="bg-[#00599f] text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl">Request Absence</button>
              )}
            </header>

            <div className="bg-white rounded-[56px] p-12 border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="text-slate-300 text-[11px] font-black uppercase tracking-[0.3em] border-b border-slate-50">
                    <th className="pb-10 px-4">Entity</th>
                    <th className="pb-10 px-4">Type</th>
                    <th className="pb-10 px-4">Interval</th>
                    <th className="pb-10 px-4">Status</th>
                    {canManage && <th className="pb-10 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appState.leaves.filter(l => canManage ? true : l.userId === currentUser.id).map(l => (
                    <tr key={l.id} className="group hover:bg-slate-50/50 transition duration-500">
                      <td className="py-10 px-4">
                        <p className="font-black text-slate-900 text-[17px]">{l.userName}</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{l.reason}</p>
                      </td>
                      <td className="py-10 px-4"><span className="text-slate-600 font-black uppercase text-[11px] tracking-widest bg-slate-100 px-4 py-1.5 rounded-lg">{l.type}</span></td>
                      <td className="py-10 px-4 font-bold text-slate-500 text-sm">{l.startDate} → {l.endDate}</td>
                      <td className="py-10 px-4">
                        <span className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : l.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{l.status}</span>
                      </td>
                      {canManage && (
                        <td className="py-10 px-4 text-right">
                          {l.status === 'PENDING' && (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => db.updateLeaveStatus(l.id, 'APPROVED')} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition">✓</button>
                              <button onClick={() => db.updateLeaveStatus(l.id, 'REJECTED')} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition">✕</button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PERSONNEL (EMPLOYEES) */}
        {activeTab === 'EMPLOYEES' && canManage && (
          <div className="bg-white rounded-[56px] p-16 border border-slate-100 shadow-sm animate-in slide-in-from-bottom-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-10 mb-20">
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter font-jakarta">Personnel Registry</h3>
              <button onClick={() => setShowAddUserModal(true)} className="bg-[#00599f] text-white px-12 py-5.5 rounded-[32px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-900/20 active:scale-95">Onboard Personnel</button>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="text-slate-300 text-[11px] font-black uppercase tracking-[0.3em] border-b border-slate-50">
                    <th className="pb-10 px-4">Entity Identity</th>
                    <th className="pb-10 px-4">Cluster Unit</th>
                    <th className="pb-10 px-4">Access Tier</th>
                    <th className="pb-10 px-4 text-right">Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appState.users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition group">
                      <td className="py-12 px-4">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-white border border-slate-100 text-[#00599f] rounded-[28px] flex items-center justify-center font-black text-2xl shadow-sm group-hover:bg-[#00599f] group-hover:text-white transition-all duration-500">{u.name.charAt(0)}</div>
                          <div>
                            <p className="font-black text-slate-900 text-xl tracking-tight">{u.name}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1 group-hover:text-[#00599f] transition-colors">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-12 px-4"><span className="text-slate-600 font-black uppercase text-[12px] tracking-widest bg-slate-100 px-5 py-2.5 rounded-2xl border border-slate-200/50">{u.department}</span></td>
                      <td className="py-12 px-4"><span className="bg-blue-50 text-[#00599f] px-6 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em]">{u.role}</span></td>
                      <td className="py-12 px-4 text-right">
                        <button onClick={() => setEditingUser(u)} className="text-slate-400 hover:text-[#00599f] transition font-black text-[11px] uppercase tracking-widest">Configure</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}
      {showAddUserModal && (
        <Modal onClose={() => setShowAddUserModal(false)} title="Initialize Identity">
          <form onSubmit={handleAddUser} className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <Input label="Full Identity Name" name="name" placeholder="John Doe" required />
              <Input label="Network UID" name="username" placeholder="jdoe_sys" required />
            </div>
            <Input label="Initial Secret" name="password" type="password" placeholder="••••••••" required />
            <div className="grid grid-cols-2 gap-8">
              <Input label="Operational Cluster" name="department" placeholder="Engineering" required />
              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Access Tier</label>
                <select name="role" className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black uppercase text-[11px] tracking-widest outline-none focus:bg-white appearance-none transition-all">
                  <option value={UserRole.EMPLOYEE}>Employee</option>
                  <option value={UserRole.HR}>HR Executive</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#00599f] text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[12px] shadow-2xl shadow-blue-900/20 hover:-translate-y-1 transition-all">Authorize Onboarding</button>
          </form>
        </Modal>
      )}

      {showAddTaskModal && (
        <Modal onClose={() => setShowAddTaskModal(false)} title="Assign Mission">
          <form onSubmit={handleAddTask} className="space-y-8">
            <Input label="Mission Title" name="title" placeholder="Database Optimization" required />
            <div className="space-y-3">
              <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Objective Description</label>
              <textarea name="description" className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-medium outline-none focus:bg-white h-32 resize-none transition-all"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Target Operator</label>
                <select name="assignedTo" className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black uppercase text-[11px] tracking-widest outline-none focus:bg-white appearance-none transition-all">
                  {appState.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <Input label="Deployment Deadline" name="deadline" type="date" required />
            </div>
            <button type="submit" className="w-full bg-[#00599f] text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[12px] shadow-2xl">Deploy Mission</button>
          </form>
        </Modal>
      )}

      {showLeaveModal && (
        <Modal onClose={() => setShowLeaveModal(false)} title="Request Absence">
          <form onSubmit={handleRequestLeave} className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <Input label="Commencement" name="startDate" type="date" required />
              <Input label="Conclusion" name="endDate" type="date" required />
            </div>
            <div className="space-y-3">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Absence Protocol</label>
                <select name="type" className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black uppercase text-[11px] tracking-widest outline-none focus:bg-white appearance-none transition-all">
                  <option value="VACATION">Vacation / Leave</option>
                  <option value="SICK">Medical Outage</option>
                  <option value="CASUAL">Personal Matters</option>
                </select>
            </div>
            <Input label="Justification Narrative" name="reason" placeholder="Brief explanation of absence..." required />
            <button type="submit" className="w-full bg-[#00599f] text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[12px] shadow-2xl">Transmit Request</button>
          </form>
        </Modal>
      )}

      {showCamera && (
        <CameraCapture 
          onCapture={(data) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                db.addAttendance({
                  id: `att_${Date.now()}`,
                  userId: currentUser!.id,
                  userName: currentUser!.name,
                  checkIn: new Date().toLocaleString(),
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  faceCapture: data,
                  status: 'PENDING'
                });
                refreshState();
                setShowCamera(false);
              },
              () => { alert('GPS authorization mandatory.'); setShowCamera(false); }
            );
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </Layout>
  );
};

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center z-[500] p-6 animate-in fade-in zoom-in-95 duration-300">
    <div className="bg-white rounded-[64px] p-16 max-w-2xl w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] overflow-y-auto max-h-[90vh] border border-white relative">
      <button onClick={onClose} className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 rounded-full transition">✕</button>
      <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter font-jakarta">{title}</h3>
      <p className="text-slate-400 font-medium mb-12">Ram Infosys Gateway Procedure Node</p>
      {children}
    </div>
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="space-y-3">
    <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{label}</label>
    <input 
      {...props} 
      className="w-full p-5 bg-slate-50 rounded-[28px] border border-slate-100 font-black outline-none focus:bg-white focus:border-blue-400 transition-all text-slate-800 placeholder:text-slate-300 shadow-sm" 
    />
  </div>
);

const StatCard = ({ label, value, color, icon }: { label: string, value: number, color: string, icon: string }) => {
  const iconPaths: Record<string, string> = {
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    layers: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    'check-square': "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
  };
  const colorStyles: Record<string, string> = {
    blue: 'bg-[#00599f] shadow-blue-600/30',
    indigo: 'bg-indigo-600 shadow-indigo-600/30',
    amber: 'bg-amber-500 shadow-amber-500/30',
    rose: 'bg-rose-600 shadow-rose-600/30'
  };

  return (
    <div className="bg-white p-12 rounded-[64px] border border-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-2xl transition-all duration-700 hover:-translate-y-3">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 opacity-[0.5] rounded-full -mr-12 -mt-12 group-hover:scale-150 transition duration-700"></div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-12">
          <div className={`${colorStyles[color]} text-white p-5 rounded-[28px] shadow-2xl`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={iconPaths[icon]}></path></svg>
          </div>
        </div>
        <h4 className="text-7xl font-black text-slate-900 tracking-tighter font-jakarta mb-3 leading-none">{value}</h4>
        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] leading-tight">{label}</p>
      </div>
    </div>
  );
};

export default App;
