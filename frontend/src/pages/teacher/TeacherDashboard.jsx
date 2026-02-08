import React, { useState, useEffect } from "react"; // Added useEffect
import { 
  LayoutDashboard, Users, BookOpen, ClipboardCheck, 
  Calendar, GraduationCap, MessageSquare, Settings, 
  LogOut, ChevronLeft, Menu, Bell, Search, TrendingUp, CheckCircle, AlertCircle,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios"; // ✅ ADDED MISSING IMPORT

export default function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  

  // --- Sidebar Navigation Items ---
  const menuItems = [
    { name: "Overview", icon: <LayoutDashboard size={20} />, path: "/teacher/dashboard" },
    { name: "Attendance", icon: <ClipboardCheck size={20} />, path: "/teacher/attendence" },
    { name: "Assignments", icon: <MessageSquare size={20} />, path: "/teacher/assignment" },
    { name: "Exams", icon: <GraduationCap size={20} />, path: "/teacher/exam" },
    { name: "Announcements", icon: <Bell size={20} />, path: "/teacher/announcement" },
    { name: "My Classes", icon: <BookOpen size={20} />, path: "/teacher/classes" }, 
  ];

  // --- Statistics Data ---
  const stats = [
    { name: "Total Students", value: "128", icon: <Users size={20}/>, light: "bg-blue-50", text: "text-blue-600" },
    { name: "Active Classes", value: "6", icon: <BookOpen size={20}/>, light: "bg-indigo-50", text: "text-indigo-600" },
    { name: "Attendance Avg", value: "94%", icon: <CheckCircle size={20}/>, light: "bg-emerald-50", text: "text-emerald-600" },
    { name: "Pending Tasks", value: "12", icon: <AlertCircle size={20}/>, light: "bg-amber-50", text: "text-amber-600" },
  ];

  const handleLogout = async () => {
    console.log("🚀 [Logout] Starting logout process...");
    
    try {
      // ✅ Added leading slash to ensure hit to /api/logout/
      const res = await api.post('/logout/'); 
      console.log("📡 [Server] Cookies cleared successfully:", res.data);
    } catch (err) {
      console.group("❌ [Logout Error]");
      console.error("Status:", err.response?.status || "No Response");
      console.error("Detail:", err.response?.data || err.message);
      console.groupEnd();
    } finally {
      console.log("🧹 [Storage] Cleaning up LocalStorage...");
      localStorage.removeItem("user");
      

      
      console.log("👋 [Navigation] Redirecting...");
      // Using href is safer for logout to fully purge React state
      navigate('/teacher/login')
    }
  };

  // Rest of your JSX...
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <aside className={`${sidebarOpen ? "w-72" : "w-20"} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed h-full z-50`}>
        <div className="flex items-center gap-3 px-6 h-20 mb-4">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <GraduationCap size={24} />
          </div>
          {sidebarOpen && <span className="text-xl font-black text-slate-800 tracking-tight">CampuSync</span>}
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                  isActive 
                    ? "bg-blue-50 text-blue-600 border border-blue-100" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className={isActive ? "text-blue-600" : "text-slate-400"}>{item.icon}</span>
                {sidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <button onClick={() => navigate("/teacher/profile")} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 font-bold text-sm">
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm">
            <LogOut size={20} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-24 bg-white border border-slate-200 text-slate-400 p-1 rounded-full hover:text-blue-600 shadow-sm"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
        </button>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-72" : "ml-20"}`}>
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center bg-slate-100 px-4 py-2 rounded-xl w-96">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Search students, classes..." className="bg-transparent border-none outline-none px-3 text-sm w-full" />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-blue-600">
              <Bell size={22} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[10px] text-white flex items-center justify-center font-bold">3</span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 cursor-pointer" onClick={() => navigate("/teacher/profile")}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 leading-none">Ms. Clara Bennett</p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1 text-right">Senior Faculty</p>
              </div>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Clara" className="w-10 h-10 rounded-xl bg-blue-100 border-2 border-white shadow-sm" alt="profile" />
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <section>
            <h1 className="text-3xl font-black text-slate-800">Teacher Dashboard</h1>
            <p className="text-slate-500 font-medium tracking-tight">February 2026</p>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:scale-[1.02] transition-transform cursor-default">
                <div className={`${stat.light} ${stat.text} p-4 rounded-2xl`}>{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.name}</p>
                  <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Table and Insights sections... */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Upcoming Classes</h3>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { time: "09:00 AM", subject: "Advanced Physics", room: "Lab 3", status: "Completed" },
                  { time: "11:30 AM", subject: "Quantum Mechanics", room: "Room 102", status: "Ongoing" },
                  { time: "02:00 PM", subject: "Applied Mathematics", room: "Hall B", status: "Upcoming" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50 rounded-3xl transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="text-xs font-black text-slate-400 w-16">{item.time}</div>
                      <div>
                        <p className="font-bold text-slate-800">{item.subject}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.room}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                      item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#1E293B] rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-between">
              <div>
                <div className="bg-blue-500/20 text-blue-400 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp size={24}/>
                </div>
                <h3 className="text-xl font-black mb-2">Class Insights</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">Average class performance is up by 12% this week. Great job!</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}