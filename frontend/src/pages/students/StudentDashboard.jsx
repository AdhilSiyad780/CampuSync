import { useEffect, useState } from "react";
import { 
  BookOpen, Calendar, ClipboardList, GraduationCap, Menu,
  Clock, MapPin, User, Bell, CheckCircle2, 
  BrainCircuit, MessageSquare, LogOut, LayoutDashboard ,Megaphone
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

export default function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.user_type !== 'student') {
     navigate('/student/login')
  }

  const handleLogout = async () => {
    console.log("🚀 [Logout] Starting logout process...");
    
    try {
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
      navigate('/student/login')
    }
  };

  // Mock Data (Replace with your API calls)
  const studentInfo = {
    name: "Emily Harper",
    grade: "Grade 10-A",
    attendance: "92%"
  };

  const classes = [
    { subject: "Mathematics", time: "9:00 AM - 10:00 AM", teacher: "Mr. Harrison", room: "Room 201", color: "border-blue-500" },
    { subject: "Physics", time: "10:30 AM - 11:30 AM", teacher: "Dr. Mitchell", room: "Room 203", color: "border-indigo-500" },
    { subject: "English Lit", time: "1:00 PM - 2:00 PM", teacher: "Ms. Turner", room: "Room 205", color: "border-purple-500" },
  ];

  const assignments = [
    { subject: "History", task: "Essay on French Revolution", due: "May 15", status: "Pending" },
    { subject: "Biology", task: "Lab Report: Cell Structure", due: "May 18", status: "Pending" },
  ];

  const exams = [
    { subject: "Chemistry", date: "May 22", time: "10:00 AM" },
    { subject: "Computer Science", date: "May 25", time: "2:00 PM" },
  ];

  const menuItems = [
    { 
      name: "Dashboard", 
      icon: <LayoutDashboard size={20} />, 
      path: "/student/dashboard" 
    },
    { 
      name: "Profile", 
      icon: <User size={20} />, 
      path: "/student/profile" 
    },
    { 
      name: "Assignments", 
      icon: <ClipboardList size={20} />, 
      path: "/student/assignment" 
    },
    { 
      name: "Attendance", 
      icon: <CheckCircle2 size={20} />, 
      path: "/student/attendence" // Matches your "attendence" typo in App.jsx
    },
    { 
      name: "Exams", 
      icon: <GraduationCap size={20} />, 
      path: "/student/exams" 
    },
    { 
      name: "Announcements", 
      icon: <Megaphone size={20} />, 
      path: "/student/announcement" 
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white transition-all duration-300 flex flex-col shadow-xl z-20`}>
        <div className="h-20 flex items-center gap-3 px-6 border-b">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="text-white" size={20} />
          </div>
          {sidebarOpen && <span className="text-xl font-bold text-slate-800 tracking-tight">Campusync</span>}
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                location.pathname === item.path 
                ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
              } ${item.special ? "mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 hover:text-white" : ""}`}
            >
              {item.icon}
              {sidebarOpen && <span className="font-semibold text-sm">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <button onClick={()=>handleLogout()} className="m-4 flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
          <LogOut size={20} />
          {sidebarOpen && <span className="font-semibold text-sm">Logout</span>}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-full lg:hidden">
                <Menu size={20} />
             </button>
             <button  onClick={()=>{
              navigate('student/profile/')
             }}>
               < h2 className="text-xl font-bold text-slate-800">Welcome back, {studentInfo.name.split(' ')[0]}! 👋</h2>

             </button>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{studentInfo.name}</p>
                <p className="text-xs text-slate-500 font-medium">{studentInfo.grade}</p>
              </div>
           <Link to="/student/profile/">
  <img 
    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emily" 
    alt="avatar" 
    className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white shadow-sm hover:ring-2 hover:ring-indigo-300 transition-all" 
  />
</Link>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* TOP CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
               <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Overall Attendance</p>
               <h3 className="text-4xl font-black mb-4">{studentInfo.attendance}</h3>
               <div className="w-full bg-white/20 h-2 rounded-full">
                  <div className="bg-white h-full rounded-full" style={{ width: '92%' }}></div>
               </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">Need help with studies?</h3>
                  <p className="text-sm text-slate-500">Ask our AI Study Helper to summarize your notes or solve complex math problems.</p>
                  <button className="mt-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                    <BrainCircuit size={16} /> Open AI Helper
                  </button>
               </div>
               <img src="https://illustrations.popsy.co/white/reading-a-book.svg" alt="study" className="h-24 hidden lg:block" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* TODAY'S CLASSES */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600" /> Today's Schedule
              </h3>
              <div className="space-y-3">
                {classes.map((item, i) => (
                  <div key={i} className={`bg-white p-5 rounded-2xl border-l-4 ${item.color} shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all`}>
                    <div className="flex items-center gap-5">
                      <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{item.subject}</h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><User size={14} /> {item.teacher}</span>
                          <span className="flex items-center gap-1"><MapPin size={14} /> {item.room}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NOTICES & EXAMS */}
            <div className="space-y-8">
               {/* Pending Assignments */}
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ClipboardList size={18} className="text-orange-500" /> Pending Tasks
                  </h3>
                  <div className="space-y-4">
                    {assignments.map((task, i) => (
                      <div key={i} className="group">
                        <div className="flex justify-between items-start">
                           <div>
                             <p className="text-sm font-bold text-slate-800">{task.task}</p>
                             <p className="text-[11px] font-bold text-indigo-600 uppercase mt-0.5">{task.subject}</p>
                           </div>
                           <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Due {task.due}</span>
                        </div>
                        {i !== assignments.length - 1 && <hr className="mt-4 border-slate-100" />}
                      </div>
                    ))}
                  </div>
               </div>

               {/* Upcoming Exams */}
               <div className="bg-[#1E293B] p-6 rounded-3xl text-white shadow-lg">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <GraduationCap size={18} className="text-indigo-400" /> Upcoming Exams
                  </h3>
                  <div className="space-y-4">
                    {exams.map((exam, i) => (
                      <div key={i} className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-2xl">
                        <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl text-center min-w-[50px]">
                           <p className="text-xs font-bold leading-none">{exam.date.split(' ')[1]}</p>
                           <p className="text-[10px] uppercase font-bold mt-1">{exam.date.split(' ')[0]}</p>
                        </div>
                        <div>
                           <p className="text-sm font-bold">{exam.subject}</p>
                           <p className="text-[11px] text-slate-400 font-medium">{exam.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}