import { useEffect, useState } from "react";
import { 
  Users, Calendar, CheckCircle, XCircle, Clock, 
  ChevronRight, Save, Filter, Loader2 
} from "lucide-react";
import api from "../../api/axios";

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: status }
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. Initial Load: Get classes assigned to teacher
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get("attendance/teacher/classes/");
        setClasses(res.data.classes || []);
      } catch (err) {
        setError("Failed to load classes.");
      }
    };
    fetchClasses();
  }, []);

  // 2. Fetch Students based on Class and Date
  const fetchStudents = async (classId, targetDate) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Passes date to backend so we can see existing records
      const res = await api.get(`attendance/students/${classId}/?date=${targetDate}`);
      
      setStudents(res.data.students);
      
      // Map statuses from backend to our local state
      const initialAttendance = {};
      res.data.students.forEach(s => {
        // If status is 'not_marked', we default to 'present' for the UI
        initialAttendance[s.id] = s.status === 'not_marked' ? 'present' : s.status;
      });
      setAttendance(initialAttendance);

      if (res.data.is_completed) {
        setSuccess(`Viewing attendance marked on ${targetDate}`);
      }
    } catch (err) {
      setError("Failed to load student list.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 3. Re-fetch whenever the date changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass, date);
    }
  }, [date]);

  const handleClassChange = (e) => {
    const id = e.target.value;
    setSelectedClass(id);
    if (id) fetchStudents(id, date);
    else setStudents([]);
  };

  const toggleStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkMark = (status) => {
    const newBatch = {};
    students.forEach(s => newBatch[s.id] = status);
    setAttendance(newBatch);
  };

  const submitAttendance = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    
    const payload = {
      school_class: parseInt(selectedClass),
      date: date,
      attendance_data: Object.entries(attendance).map(([id, status]) => ({
        student_id: parseInt(id),
        status: status,
        remarks: ""
      }))
    };

    try {
      await api.post("attendance/mark/", payload);
      setSuccess(`Attendance for ${date} saved successfully!`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Catch specific backend validation (e.g., 7-day limit or future date)
      const msg = err.response?.data?.non_field_errors?.[0] || 
                  err.response?.data?.date?.[0] || 
                  "Failed to save attendance.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Daily Attendance</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Teacher Portal <ChevronRight size={14} /> <span className="text-indigo-600 font-bold">Attendance Register</span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select 
              value={selectedClass}
              onChange={handleClassChange}
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name} - {c.division}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MESSAGES */}
        {success && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold border border-emerald-100 animate-in fade-in">{success}</div>}
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100 animate-in fade-in">{error}</div>}

        {/* MAIN LIST SECTION */}
        {selectedClass && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-bold">Syncing Class Data...</p>
              </div>
            ) : (
              <>
                {/* BULK TOGGLES */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-slate-400" />
                    <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Students: {students.length}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleBulkMark('present')} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-200 transition-all">Select All Present</button>
                    <button onClick={() => handleBulkMark('absent')} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-black hover:bg-red-200 transition-all">Select All Absent</button>
                  </div>
                </div>

                {/* STUDENT ROWS */}
                <div className="divide-y divide-slate-50">
                  {students.map((student) => (
                    <div key={student.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                          {student.roll_number || "0"}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Adm: {student.admission_number}</p>
                        </div>
                      </div>

                      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                        <StatusToggle 
                          active={attendance[student.id] === 'present'} 
                          onClick={() => toggleStatus(student.id, 'present')}
                          type="present"
                        />
                        <StatusToggle 
                          active={attendance[student.id] === 'absent'} 
                          onClick={() => toggleStatus(student.id, 'absent')}
                          type="absent"
                        />
                        <StatusToggle 
                          active={attendance[student.id] === 'late'} 
                          onClick={() => toggleStatus(student.id, 'late')}
                          type="late"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* SAVE BUTTON */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={submitAttendance}
                    disabled={saving || students.length === 0}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-3"
                  >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}
                    {saving ? "Saving Records..." : "Confirm & Save Register"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {!selectedClass && (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <Filter size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-black text-slate-700 mb-1">No Class Selected</h3>
            <p className="text-slate-400 font-bold text-sm italic">Please select a class from the dropdown to start taking attendance.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusToggle({ active, onClick, type }) {
  const configs = {
    present: { icon: CheckCircle, label: "P", color: "text-emerald-600", bg: "bg-emerald-500" },
    absent: { icon: XCircle, label: "A", color: "text-red-600", bg: "bg-red-500" },
    late: { icon: Clock, label: "L", color: "text-amber-600", bg: "bg-amber-500" },
  };
  const config = configs[type];
  const Icon = config.icon;

  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
        active ? `${config.bg} text-white shadow-md scale-105` : `text-slate-400 hover:bg-white`
      }`}
    >
      <Icon size={14} />
      {config.label}
    </button>
  );
}