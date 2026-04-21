import { useEffect, useState } from "react";
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { Backarrow } from "../../componets/Backarrow";

export default function StudentAttendancePage() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // State for Month/Year selection
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const navigate = useNavigate();
   
  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.user_type !== 'student') {
     navigate('/student/login')
  }

  useEffect(() => {
    fetchStudentAttendance();
  }, [month, year]);

  const fetchStudentAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`student/attendance/?month=${month}&year=${year}`);
      setAttendanceData(res.data.attendance);
      setSummary(res.data.summary);
    } catch (err) {
      setError("Failed to load attendance records.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (offset) => {
    let newMonth = month + offset;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
       <Backarrow/>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER & CONTROLS */}
        x
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
           

            <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Attendance</h1>
            <p className="text-sm text-slate-500 mt-1">Track your daily presence and monthly statistics</p>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft size={20}/></button>
            <span className="px-4 text-sm font-black text-slate-700 min-w-[140px] text-center">
              {months[month - 1]} {year}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronRight size={20}/></button>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard label="Attendance" value={`${summary.attendance_percentage}%`} icon={TrendingUp} color="indigo" />
            <StatsCard label="Present" value={summary.present_days} icon={CheckCircle} color="emerald" />
            <StatsCard label="Absent" value={summary.absent_days} icon={XCircle} color="red" />
            <StatsCard label="Late/Late" value={summary.late_days} icon={Clock} color="amber" />
          </div>
        )}

        {/* LOG LIST */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center gap-2">
            <CalendarIcon size={20} className="text-slate-400" />
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Attendance Log</span>
          </div>

          <div className="divide-y divide-slate-50">
            {attendanceData.length > 0 ? (
              attendanceData.map((record, idx) => (
                <div key={idx} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-black text-slate-800 leading-none">
                        {new Date(record.date).getDate()}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-100 hidden md:block"></div>
                    <div>
                      <StatusBadge status={record.status} label={record.status_display} />
                      {record.remarks && <p className="text-xs text-slate-400 mt-1 italic">"{record.remarks}"</p>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center">
                <AlertCircle size={40} className="mx-auto text-slate-200 mb-2" />
                <p className="text-slate-400 font-bold italic text-sm">No records found for this month.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600"
  };
  return (
    <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm">
      <div className={`w-10 h-10 ${colors[color]} rounded-2xl flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const styles = {
    present: "bg-emerald-50 text-emerald-600",
    absent: "bg-red-50 text-red-600",
    late: "bg-amber-50 text-amber-600",
    excused: "bg-blue-50 text-blue-600"
  };
  return (
    <span className={`${styles[status]} px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest`}>
      {label}
    </span>
  );
}