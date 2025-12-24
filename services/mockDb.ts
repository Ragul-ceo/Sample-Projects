
import { User, Task, LeaveRequest, AttendanceRecord, UserRole, Project } from '../types';
import { INITIAL_USERS, INITIAL_TASSKS, INITIAL_PROJECTS } from '../constants';

class MockDB {
  private users: User[] = [];
  private tasks: Task[] = [];
  private leaves: LeaveRequest[] = [];
  private attendance: AttendanceRecord[] = [];
  private projects: Project[] = [];

  constructor() {
    this.load();
  }

  private load() {
    const get = (key: string, def: any) => {
      const item = localStorage.getItem(key);
      try {
        return item ? JSON.parse(item) : def;
      } catch (e) {
        return def;
      }
    };
    this.users = get('ram_users', INITIAL_USERS);
    this.tasks = get('ram_tasks', INITIAL_TASSKS);
    this.leaves = get('ram_leaves', []);
    this.attendance = get('ram_attendance', []);
    this.projects = get('ram_projects', INITIAL_PROJECTS);
  }

  private save() {
    localStorage.setItem('ram_users', JSON.stringify(this.users));
    localStorage.setItem('ram_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('ram_leaves', JSON.stringify(this.leaves));
    localStorage.setItem('ram_attendance', JSON.stringify(this.attendance));
    localStorage.setItem('ram_projects', JSON.stringify(this.projects));
  }

  // Projects
  getProjects() { return [...this.projects]; }
  addProject(p: Project) { this.projects.push(p); this.save(); }
  assignToProject(userId: string, projectId: string) {
    this.users = this.users.map(u => u.id === userId ? { ...u, currentProjectId: projectId } : u);
    this.projects = this.projects.map(p => {
      if (p.id === projectId && !p.team.includes(userId)) return { ...p, team: [...p.team, userId] };
      if (p.id !== projectId && p.team.includes(userId)) return { ...p, team: p.team.filter(id => id !== userId) };
      return p;
    });
    this.save();
  }

  // User Ops
  getUsers() { return [...this.users]; }
  createUser(u: Partial<User>) {
    const newUser: User = { 
      id: Math.random().toString(36).substr(2,9), 
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
    this.users.push(newUser); 
    this.save(); 
    return newUser;
  }
  
  updateUser(id: string, data: Partial<User>) {
    this.users = this.users.map(u => u.id === id ? { ...u, ...data } : u);
    this.save();
  }

  deleteUser(id: string) {
    this.users = this.users.filter(u => u.id !== id);
    this.save();
  }

  // Attendance
  getAttendance() { return [...this.attendance]; }
  addAttendance(a: AttendanceRecord) { this.attendance.push(a); this.save(); }
  approveAttendance(id: string, status: 'APPROVED' | 'REJECTED') {
    this.attendance = this.attendance.map(a => a.id === id ? { ...a, status } : a);
    this.save();
  }

  exportAttendanceCSV(filteredAttendance?: AttendanceRecord[], fileNameSuffix: string = "Full") {
    const recordsToExport = filteredAttendance || this.attendance;
    const headers = ['Date', 'Time', 'Employee Name', 'Username', 'Department', 'Status', 'Lat', 'Long'];
    const rows = recordsToExport.map(a => {
      const user = this.users.find(u => u.id === a.userId);
      const [date, time] = a.checkIn.split(', ');
      return [
        date,
        time?.trim() || '',
        a.userName,
        user?.username || 'N/A',
        user?.department || 'N/A',
        a.status,
        a.latitude,
        a.longitude
      ];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Raminfosys_Attendance_${fileNameSuffix}_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportMonthlyAttendanceCSV(monthYear: string) {
    const filtered = this.attendance.filter(a => {
      const d = new Date(a.checkIn);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${y}-${m}` === monthYear;
    });
    this.exportAttendanceCSV(filtered, `Monthly_${monthYear}`);
  }

  // Tasks
  getTasks() { return [...this.tasks]; }
  addTask(t: Task) { this.tasks.push(t); this.save(); }
  updateTaskStatus(id: string, status: Task['status']) {
    this.tasks = this.tasks.map(t => t.id === id ? { ...t, status } : t);
    this.save();
  }

  getLeaves() { return [...this.leaves]; }
}

export const db = new MockDB();
