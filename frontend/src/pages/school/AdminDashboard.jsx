import { useEffect, useState } from "react";
import { Menu, X, Users, School, UserCog, BookOpen } from "lucide-react";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [plans,setPlans] = useState([])

  useEffect(()=>{
     LoadPlans();
  },[])
  const LoadPlans = async ()=>{
       try {
        const res = await api.get('subscriptions/plans/')
        
       } catch (err) {
         if (err.response?.status === 401) {
        localStorage.removeItem("access");
        navigate("/superadmin/login");
      }
      setError("Failed to load plans");

       }
  }




  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-white shadow-md transition-all duration-300 overflow-hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1
            className={`text-xl font-bold text-blue-600 transition-opacity duration-300 ${
              sidebarOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            Campusync
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-slate-200 rounded-full"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="mt-4">
          {[
            { name: "Dashboard", icon: <BookOpen size={18} /> },
            { name: "Students", icon: <Users size={18} /> },
            { name: "Staff", icon: <UserCog size={18} /> },
            { name: "School Details", icon: <School size={18} /> },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition"
            >
              {item.icon}
              {sidebarOpen && <span className="text-slate-700">{item.name}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6">

        {/* TOPBAR */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>

          <div className="flex items-center gap-4">
            <p className="text-slate-600 text-sm">Admin</p>
            <img
              src="https://api.dicebear.com/7.x/initials/svg?seed=A"
              alt="profile"
              className="w-10 h-10 rounded-full bg-slate-200"
            />
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-slate-600">Total Students</h3>
            <p className="text-3xl font-bold mt-2">412</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-slate-600">Total Staff</h3>
            <p className="text-3xl font-bold mt-2">34</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-slate-600">Active Parents</h3>
            <p className="text-3xl font-bold mt-2">295</p>
          </div>
        </div>

        {/* CHART + TABLE PLACEHOLDER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-slate-700">Recent Admissions</h3>
            <div className="h-40 flex items-center justify-center text-slate-500">
              (Chart Placeholder)
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-slate-700">Latest Staff Added</h3>
            <div className="h-40 flex items-center justify-center text-slate-500">
              (Table Placeholder)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
