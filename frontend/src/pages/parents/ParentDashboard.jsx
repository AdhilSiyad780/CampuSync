import React, { useState } from "react";
import { 
  LayoutDashboard, User, Bell, BookOpen, CheckCircle, XCircle, 
  Clock, CreditCard, MessageSquare, TrendingUp, 
  PieChart, BarChart3, ChevronRight, LogOut, Menu, ChevronLeft, GraduationCap
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function ParentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const parentName = localStorage.getItem("parent_fullname") || "Parent";

  // Navigation Items
  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/parent/dashboard" },
    { name: "Attendance", icon: <CheckCircle size={20} />, path: "/parent/attendance" },
    { name: "Exams & Marks", icon: <BookOpen size={20} />, path: "/parent/exams" },
    { name: "Fees & Payments", icon: <CreditCard size={20} />, path: "/parent/fees" },
    { name: "Messages", icon: <MessageSquare size={20} />, path: "/parent/messages" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/parent/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* --- SIDEBAR --- */}
      <aside className={`${sidebarOpen ? "w-72" : "w-20"} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col fixed h-full z-50`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-20 mb-4">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
            <GraduationCap size={24} />
          </div>
          {sidebarOpen && <span className="text-xl font-black text-slate-800 tracking-tight">CampuSync</span>}
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 font-bold text-sm">
            <LogOut size={20} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-24 bg-white border border-slate-200 text-slate-400 p-1 rounded-full hover:text-blue-600 shadow-sm"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
        </button>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-72" : "ml-20"}`}>
        
        {/* TOP HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">Hello, {parentName}</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-blue-600 relative">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${parentName}`} 
              className="w-10 h-10 rounded-xl bg-blue-100 border-2 border-white shadow-sm cursor-pointer" 
              onClick={() => navigate('/parent/profile')}
            />
          </div>
        </header>

        {/* DASHBOARD CONTENT (Same as your request) */}
        <div className="p-8 space-y-8">
           {/* (Paste the Student Identity Card and Grid here from my previous response) */}
           {/* ... */}
           <section className="bg-[#1E293B] rounded-[2.5rem] p-8 text-white shadow-xl">
             <div className="flex items-center gap-6">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jorge" className="w-20 h-20 rounded-2xl bg-slate-700" />
               <div>
                 <h2 className="text-2xl font-black">Jorge Bills</h2>
                 <p className="text-slate-400 text-sm font-bold mt-1">Roll No: 12345 | Class: CS | Section: A</p>
               </div>
             </div>
           </section>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Attendance Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Attendance Summary</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-500">Total Classes</span>
                    <span className="font-black">150</span>
                  </div>
                  <div className="flex justify-between p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                    <span className="text-sm font-bold">Present</span>
                    <span className="font-black">135</span>
                  </div>
                  <div className="flex justify-between p-4 bg-red-50 rounded-2xl text-red-600">
                    <span className="text-sm font-bold">Absent</span>
                    <span className="font-black">10</span>
                  </div>
                </div>
              </div>

              {/* Exam Overview */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                 <h3 className="text-lg font-bold mb-6">Exam Overview</h3>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-6 rounded-3xl text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks Trend</p>
                       <p className="text-2xl font-black text-blue-600">+5%</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Avg</p>
                       <p className="text-2xl font-black text-indigo-600">92%</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
                       <p className="text-2xl font-black text-emerald-600">90%</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}