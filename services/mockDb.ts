
import { User, Task, LeaveRequest, AttendanceRecord, UserRole, Project, Announcement } from '../types';
import { INITIAL_USERS, INITIAL_TASSKS, INITIAL_PROJECTS } from '../constants';

class MockDB {
  private users: User[] = [];
  private tasks: Task[] = [];
  private leaves: LeaveRequest[] = [];
  private attendance: AttendanceRecord[] = [];
  private projects: Project[] = [];
  private announcements: Announcement[] = [];

  constructor() {
    this.load();
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('ram_')) {
        this.load();
      }
    });
  }

  public load() {
    const get = (key: string, def: any) => {
      const item = localStorage.getItem(key);
      try {
        return item ? JSON.parse(item) : def;
      } catch (e) {
        console.error(`Error parsing ${key}`, e);
        return def;
      }
    };
    this.users = get('ram_users', INITIAL_USERS);
    this.tasks = get('ram_tasks', INITIAL_TASSKS);
    this.leaves = get('ram_leaves', []);
    this.attendance = get('ram_attendance', []);
    this.projects = get('ram_projects', INITIAL_PROJECTS);
    this.announcements = get('ram_comms', [
      {
        id: 'a1',
        title: 'Welcome to the New ERP',
        content: 'We have successfully migrated to the Raminfosys v5.0 Gateway. Please verify your identity for check-in.',
        author: 'System Admin',
        date: new Date().toISOString(),
        priority: 'NORMAL'
      }
    ]);
  }

  private save() {
    localStorage.setItem('ram_users', JSON.stringify(this.users));
    localStorage.setItem('ram_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('ram_leaves', JSON.stringify(this.leaves));
    localStorage.setItem('ram_attendance', JSON.stringify(this.attendance));
    localStorage.setItem('ram_projects', JSON.stringify(this.projects));
    localStorage.setItem('ram_comms', JSON.stringify(this.announcements));
    window.dispatchEvent(new Event('storage'));
  }

  getProjects() { this.load(); return [...this.projects]; }
  getUsers() { this.load(); return [...this.users]; }
  
  createUser(u: Partial<User>) {
    this.load();
    const newUser: User = { 
      id: `u_${Math.random().toString(36).substr(2, 9)}`, 
      name: '', 
      email: '', 
      username: '', 
      password: '', 
      role: UserRole.EMPLOYEE, 
      department: 'General', 
      joinedDate: new Date().toISOString(), 
      isApproved: false, 
      ...u 
    };
    this.users = [...this.users, newUser]; 
    this.save(); 
    return newUser;
  }
  
  updateUser(id: string, data: Partial<User>) {
    this.load();
    this.users = this.users.map(u => u.id === id ? { ...u, ...data } : u);
    this.save();
  }

  getAttendance() { this.load(); return [...this.attendance]; }
  addAttendance(a: AttendanceRecord) { this.load(); this.attendance = [...this.attendance, a]; this.save(); }
  approveAttendance(id: string, status: 'APPROVED' | 'REJECTED') {
    this.load();
    this.attendance = this.attendance.map(a => a.id === id ? { ...a, status } : a);
    this.save();
  }

  exportMonthlyAttendanceCSV(monthYear: string) {
    this.load();
    const filtered = this.attendance.filter(a => {
      const d = new Date(a.checkIn);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${y}-${m}` === monthYear;
    });
    this.exportAttendanceCSV(filtered, `Monthly_${monthYear}`);
  }

  exportAttendanceCSV(filteredAttendance?: AttendanceRecord[], fileNameSuffix: string = "Full") {
    this.load();
    const recordsToExport = filteredAttendance || this.attendance;
    const headers = ['Date', 'Time', 'Employee Name', 'Username', 'Department', 'Status', 'Lat', 'Long'];
    const rows = recordsToExport.map(a => {
      const user = this.users.find(u => u.id === a.userId);
      const [date, time] = a.checkIn.split(', ');
      return [`"${date}"`, `"${time?.trim() || ''}"`, `"${a.userName}"`, `"${user?.username || 'N/A'}"`, `"${user?.department || 'N/A'}"`, `"${a.status}"`, a.latitude, a.longitude];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Raminfosys_Attendance_${fileNameSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getTasks() { this.load(); return [...this.tasks]; }
  addTask(t: Task) { this.load(); this.tasks = [...this.tasks, t]; this.save(); }
  updateTaskStatus(id: string, status: Task['status']) {
    this.load();
    this.tasks = this.tasks.map(t => t.id === id ? { ...t, status } : t);
    this.save();
  }

  getLeaves() { this.load(); return [...this.leaves]; }
  requestLeave(l: LeaveRequest) { this.load(); this.leaves = [...this.leaves, l]; this.save(); }
  updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    this.load();
    this.leaves = this.leaves.map(l => l.id === id ? { ...l, status } : l);
    this.save();
  }

  getAnnouncements() { this.load(); return [...this.announcements]; }
  postAnnouncement(a: Announcement) { this.load(); this.announcements = [a, ...this.announcements]; this.save(); }
}

export const db = new MockDB();
