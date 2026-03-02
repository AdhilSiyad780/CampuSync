import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  ChevronDown,
  GraduationCap,
} from "lucide-react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

export default function ParentAttendancePage() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
 

  // On mount: fetch children list
  useEffect(() => {
    fetchChildren();
  }, []);

  // When selectedChild or month/year changes, fetch attendance
  useEffect(() => {
    if (selectedChild) {
      fetchAttendance();
    }
  }, [selectedChild, month, year]);

  const fetchChildren = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("parent/attendance/");
      const kids = res.data.children || [];
      setChildren(kids);
      console.log(kids)
      // Auto-select the primary child or first child
      const primary = kids.find((c) => c.is_primary) || kids[0];
      if (primary) setSelectedChild(primary);
    } catch (err) {
      setError("Failed to load children.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    setAttendanceLoading(true);
    setError("");
    try {
      const res = await api.get(
        `parent/attendance/?student_id=${selectedChild.student_id}&month=${month}&year=${year}`
      );
      setAttendanceData(res.data.attendance || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      setError("Failed to load attendance.");
      setAttendanceData([]);
      setSummary(null);
    } finally {
      setAttendanceLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-10">
          <Users size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-semibold">No children linked to your account.</p>
          <p className="text-slate-400 text-sm mt-1">Please contact school administration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your child's daily attendance</p>
        </div>

        {/* CHILD SELECTOR + MONTH PICKER */}
        <div className="flex flex-col md:flex-row gap-3">

          {/* Child Selector */}
          <div className="relative flex-1">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <GraduationCap size={18} className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-800 leading-none">
                    {selectedChild?.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedChild?.class_name}</p>
                </div>
              </div>
              {children.length > 1 && (
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && children.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-10 overflow-hidden">
                {children.map((child) => (
                  <button
                    key={child.student_id}
                    onClick={() => {
                      setSelectedChild(child);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-all text-left ${
                      selectedChild?.student_id === child.student_id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                      <GraduationCap size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-none">{child.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {child.class_name} · Roll {child.roll_number}
                        {child.is_primary && (
                          <span className="ml-2 bg-indigo-100 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Primary</span>
                        )}
                      </p>
                    </div>
                    {selectedChild?.student_id === child.student_id && (
                      <CheckCircle size={16} className="text-indigo-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month Picker */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 text-sm font-black text-slate-700 min-w-[140px] text-center">
              {months[month - 1]} {year}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* CHILD INFO STRIP */}
        {selectedChild && (
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 flex flex-wrap gap-4 text-sm shadow-sm">
            <span className="text-slate-400">
              Admission: <span className="font-bold text-slate-700">{selectedChild.admission_number}</span>
            </span>
            <span className="text-slate-400">
              Roll: <span className="font-bold text-slate-700">{selectedChild.roll_number}</span>
            </span>
            <span className="text-slate-400">
              Relation: <span className="font-bold text-slate-700 capitalize">{selectedChild.relation_type}</span>
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-3 text-sm font-semibold">
            {error}
          </div>
        )}

        {attendanceLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* SUMMARY CARDS */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard label="Attendance" value={`${summary.attendance_percentage}%`} icon={TrendingUp} color="indigo" />
                <StatsCard label="Present" value={summary.present_days} icon={CheckCircle} color="emerald" />
                <StatsCard label="Absent" value={summary.absent_days} icon={XCircle} color="red" />
                <StatsCard label="Late" value={summary.late_days} icon={Clock} color="amber" />
              </div>
            )}

            {/* ATTENDANCE LOG */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center gap-2">
                <CalendarIcon size={20} className="text-slate-400" />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Attendance Log
                </span>
              </div>

              <div className="divide-y divide-slate-50">
                {attendanceData.length > 0 ? (
                  attendanceData.map((record, idx) => (
                    <div
                      key={idx}
                      className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[32px]">
                          <p className="text-lg font-black text-slate-800 leading-none">
                            {new Date(record.date).getDate()}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(record.date).toLocaleDateString("en-US", { weekday: "short" })}
                          </p>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-100 hidden md:block"></div>
                        <div>
                          <StatusBadge status={record.status} label={record.status_display} />
                          {record.remarks && (
                            <p className="text-xs text-slate-400 mt-1 italic">"{record.remarks}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center">
                    <AlertCircle size={40} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-slate-400 font-bold italic text-sm">
                      No records found for this month.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
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
    excused: "bg-blue-50 text-blue-600",
  };
  return (
    <span className={`${styles[status] || "bg-slate-50 text-slate-500"} px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest`}>
      {label}
    </span>
  );
}