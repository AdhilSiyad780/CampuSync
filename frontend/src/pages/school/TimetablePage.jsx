import { useState, useEffect } from "react";
import { 
  Clock, Plus, BookOpen, User, Edit, Trash2, Save, X,
  ChevronRight, AlertCircle, Users, CheckCircle
} from "lucide-react";
import api from "../../api/axios";

const DAYS = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
];

export default function TimetablePage() {
  const [view, setView] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [timetableGrid, setTimetableGrid] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, timeSlotsRes, classesRes, teachersRes] = await Promise.all([
        api.get("subjects/"),
        api.get("timeslot/"),
        api.get("classes/"),
        api.get("teachers/available/")
      ]);
      console.log('Teachers Response:', teachersRes.data);
    console.log('Subjects Response:', subjectsRes.data);
    console.log('Classes Response:', classesRes.data);
    console.log('TimeSlots Response:', timeSlotsRes.data);
    
      setSubjects(subjectsRes.data || []);
      setTimeSlots(timeSlotsRes.data || []);
      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data || []);
      
    } catch (err) {
      console.error("Load error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableGrid = async (classId) => {
    try {
      const res = await api.get(`timetable/grid/${classId}/`);
      setTimetableGrid(res.data);
      setSelectedClass(classId);
    } catch (err) {
      console.error("Load timetable error:", err);
      setError("Failed to load timetable");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Timetable Management
            </h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Academic Management <ChevronRight size={14} /> 
              <span className="text-indigo-600 font-bold">Timetables</span>
            </p>
          </div>

          <div className="flex gap-2 bg-white rounded-2xl p-1 border border-slate-200">
            <button
              onClick={() => setView('subjects')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                view === 'subjects'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Subjects
            </button>
            <button
              onClick={() => setView('slots')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                view === 'slots'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Time Slots
            </button>
            <button
              onClick={() => setView('timetable')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                view === 'timetable'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Timetable
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold flex items-center gap-2">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* CONTENT */}
        {view === 'subjects' && (
          <SubjectsView 
            subjects={subjects}
            teachers={teachers}
            setSubjects={setSubjects}
            setError={setError}
            setSuccess={setSuccess}
          />
        )}
        
        {view === 'slots' && (
          <TimeSlotsView
            timeSlots={timeSlots}
            setTimeSlots={setTimeSlots}
            setError={setError}
            setSuccess={setSuccess}
          />
        )}

        {view === 'timetable' && (
          <TimetableView
            classes={classes}
            timeSlots={timeSlots}
            subjects={subjects}
            teachers={teachers}
            selectedClass={selectedClass}
            timetableGrid={timetableGrid}
            loadTimetableGrid={loadTimetableGrid}
            setError={setError}
            setSuccess={setSuccess}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// SUBJECTS VIEW
// ============================================

function SubjectsView({ subjects, teachers, setSubjects, setError, setSuccess }) {
  const [form, setForm] = useState({ 
    id: null, 
    name: "", 
    code: "", 
    description: "",
    teachers: []
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      setError("Name and code are required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: form.name,
        code: form.code,
        description: form.description,
        teachers: form.teachers
      };

      if (form.id) {
        const res = await api.put(`subjects/${form.id}/`, payload);
        setSubjects(subjects.map(s => s.id === form.id ? res.data : s));
        setSuccess("Subject updated!");
      } else {
        const res = await api.post("subjects/", payload);
        setSubjects([...subjects, res.data]);
        setSuccess("Subject created!");
      }
      setForm({ id: null, name: "", code: "", description: "", teachers: [] });
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this subject?")) return;
    try {
      await api.delete(`subjects/${id}/`);
      setSubjects(subjects.filter(s => s.id !== id));
      setSuccess("Subject deleted!");
    } catch (err) {
      setError("Failed to delete subject");
    }
  };

  const handleEdit = (subject) => {
    setForm({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      teachers: subject.teachers || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
        <h3 className="text-xl font-black text-slate-800 mb-6">
          {form.id ? "Edit Subject" : "Add Subject"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Subject Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Mathematics"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Subject Code *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g., MATH101"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
              rows="3"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Assign Teachers</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2">
              {teachers.map(teacher => (
                <label
                  key={teacher.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.teachers.includes(teacher.id)
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.teachers.includes(teacher.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm({ ...form, teachers: [...form.teachers, teacher.id] });
                      } else {
                        setForm({ ...form, teachers: form.teachers.filter(id => id !== teacher.id) });
                      }
                    }}
                    className="w-5 h-5 rounded text-indigo-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{teacher.fullname}</p>
                    <p className="text-xs text-slate-500">{teacher.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {form.id ? "Update Subject" : "Add Subject"}
              </>
            )}
          </button>
          {form.id && (
            <button
              onClick={() => setForm({ id: null, name: "", code: "", description: "", teachers: [] })}
              className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-200 flex items-center gap-2"
            >
              <X size={18} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-600 mb-2">No Subjects Yet</h3>
            <p className="text-sm text-slate-400">Add your first subject using the form above</p>
          </div>
        ) : (
          subjects.map(subject => (
            <div key={subject.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-black text-slate-800">{subject.name}</h4>
                  <p className="text-sm text-indigo-600 font-bold">{subject.code}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(subject)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {subject.description && (
                <p className="text-xs text-slate-600 mb-4">{subject.description}</p>
              )}

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Teachers</span>
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2 py-0.5 rounded-lg">
                    {subject.teacher_count || 0}
                  </span>
                </div>
                {subject.teachers_details && subject.teachers_details.length > 0 ? (
                  <div className="space-y-1">
                    {subject.teachers_details.map(teacher => (
                      <div key={teacher.id} className="flex items-center gap-2 text-xs">
                        <User size={12} className="text-slate-400" />
                        <span className="font-bold text-slate-700">{teacher.fullname}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No teachers assigned</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// TIME SLOTS VIEW
// ============================================

function TimeSlotsView({ timeSlots, setTimeSlots, setError, setSuccess }) {
  const [form, setForm] = useState({
    id: null,
    name: "",
    start_time: "",
    end_time: "",
    order: "",
    is_break: false
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.start_time || !form.end_time || !form.order) {
      setError("All fields are required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (form.id) {
        const res = await api.put(`timeslot/${form.id}/`, form);
        setTimeSlots(timeSlots.map(s => s.id === form.id ? res.data : s).sort((a, b) => a.order - b.order));
        setSuccess("Time slot updated!");
      } else {
        const res = await api.post("timeslot/", form);
        setTimeSlots([...timeSlots, res.data].sort((a, b) => a.order - b.order));
        setSuccess("Time slot created!");
      }
      setForm({ id: null, name: "", start_time: "", end_time: "", order: "", is_break: false });
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save time slot");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this time slot?")) return;
    try {
      await api.delete(`timeslot/${id}/`);
      setTimeSlots(timeSlots.filter(s => s.id !== id));
      setSuccess("Time slot deleted!");
    } catch (err) {
      setError("Failed to delete time slot");
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
        <h3 className="text-xl font-black text-slate-800 mb-6">
          {form.id ? "Edit Time Slot" : "Add Time Slot"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Period 1"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Start Time *</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">End Time *</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase">Order *</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              placeholder="1, 2, 3..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_break}
              onChange={(e) => setForm({ ...form, is_break: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
            <label className="text-sm font-bold text-slate-700">This is a break period</label>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : (form.id ? "Update" : "Add Time Slot")}
          </button>
          {form.id && (
            <button
              onClick={() => setForm({ id: null, name: "", start_time: "", end_time: "", order: "", is_break: false })}
              className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
        <h3 className="text-xl font-black text-slate-800 mb-6">Time Slots</h3>
        <div className="space-y-3">
          {timeSlots.map(slot => (
            <div
              key={slot.id}
              className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                slot.is_break
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-700 border-2 border-slate-200">
                  {slot.order}
                </div>
                <div>
                  <p className="font-black text-slate-800">{slot.name}</p>
                  <p className="text-sm text-slate-600">
                    <Clock size={14} className="inline mr-1" />
                    {slot.start_time} - {slot.end_time}
                  </p>
                </div>
                {slot.is_break && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-lg uppercase">
                    Break
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(slot)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// TIMETABLE VIEW  
// ============================================
function TimetableView({ 
  classes, timeSlots, subjects, teachers, 
  selectedClass, timetableGrid, loadTimetableGrid,
  setError, setSuccess 
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [cellForm, setCellForm] = useState({
    id: null,
    subject: "",
    teacher: "",
    room_number: ""
  });
  const [saving, setSaving] = useState(false);

  const handleClassSelect = (classId) => {
    loadTimetableGrid(classId);
  };

  const handleCellClick = (day, timeSlot) => {
    if (timeSlot.is_break) return;
    
    const existing = timetableGrid?.grid[day]?.find(
      entry => entry.time_slot === timeSlot.id
    );

    setEditingCell({ day, timeSlot: timeSlot.id });
    setCellForm({
      id: existing?.id || null,
      subject: existing?.subject || "",
      teacher: existing?.teacher || "",
      room_number: existing?.room_number || ""
    });
  };

  const handleSaveCell = async () => {
    if (!cellForm.subject || !cellForm.teacher) {
      setError("Please select both a subject and a teacher");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        school_class: Number(selectedClass),
        day_of_week: editingCell.day,
        time_slot: Number(editingCell.timeSlot),
        subject: Number(cellForm.subject),
        teacher: Number(cellForm.teacher),
        room_number: cellForm.room_number || ""
      };

      if (cellForm.id) {
        // Updated to match your router basename 'timetable-entry'
        await api.put(`timetable-entries/${cellForm.id}/`, payload);
      } else {
        await api.post("timetable-entries/", payload);
        
      }

      setSuccess("Timetable updated successfully!");
      setEditingCell(null);
      loadTimetableGrid(selectedClass);
    } catch (err) {
      console.error("Save error:", err);
      const errorMsg = err.response?.data?.non_field_errors?.[0] || 
                       err.response?.data?.teacher?.[0] || 
                       "Failed to save assignment";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCell = async () => {
    if (!cellForm.id) {
      setEditingCell(null);
      return;
    }

    if (!window.confirm("Are you sure you want to remove this entry?")) return;

    try {
      await api.delete(`timetable-entries/${cellForm.id}/`);
      setSuccess("Entry removed!");
      setEditingCell(null);
      loadTimetableGrid(selectedClass);
    } catch (err) {
      setError("Failed to delete entry");
    }
  };

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
        <h3 className="text-xl font-black text-slate-800 mb-6">Select Class</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => handleClassSelect(cls.id)}
              className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                selectedClass === cls.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300"
              }`}
            >
              <div className="text-lg">
                {cls.class_name} - {cls.division}
              </div>
              <div className="text-xs opacity-75">{cls.academic_year}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Grid */}
      {timetableGrid && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 overflow-x-auto">
          {/* Header logic remains same */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Class Schedule: <span className="text-indigo-600">{timetableGrid.class_name}</span>
            </h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div> Break
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                <div className="w-3 h-3 bg-white border border-slate-200 rounded"></div> Lecture
              </div>
            </div>
          </div>

          <div className="min-w-[1200px]">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="p-4 bg-slate-50 border border-slate-200 rounded-tl-2xl font-black text-slate-500 text-[10px] uppercase tracking-widest text-center">Time</th>
                  {DAYS.map((day, index) => (
                    <th key={day.value} className={`p-4 bg-slate-50 border-y border-r border-slate-200 font-black text-slate-700 text-sm ${index === DAYS.length - 1 ? "rounded-tr-2xl" : ""}`}>{day.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot.id} className="group">
                    <td className="p-4 border-l border-b border-r border-slate-200 bg-slate-50/30 text-center">
                      <p className="font-black text-slate-700 text-xs">{slot.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">{slot.start_time} - {slot.end_time}</p>
                    </td>
                    {DAYS.map((day) => {
                      const entry = timetableGrid.grid[day.value]?.find(e => e.time_slot === slot.id);
                      return (
                        <td 
                          key={`${day.value}-${slot.id}`} 
                          onClick={() => !slot.is_break && handleCellClick(day.value, slot)}
                          className={`p-2 border-r border-b border-slate-200 transition-all relative ${slot.is_break ? "bg-amber-50/40" : "hover:bg-indigo-50/50 cursor-pointer"}`}
                        >
                          {slot.is_break ? (
                            <div className="flex items-center justify-center py-4 text-[10px] font-black text-amber-500 uppercase tracking-widest opacity-60">{slot.name}</div>
                          ) : entry ? (
                            <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm group-hover:border-indigo-200 transition-all">
                              <p className="font-black text-indigo-600 text-xs truncate leading-tight mb-1">{entry.subject_name}</p>
                              <p className="text-[10px] text-slate-500 font-bold truncate">{entry.teacher_name}</p>
                            </div>
                          ) : (
                            <div className="h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><Plus size={16} /></div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL OVERLAY */}
      {editingCell && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Assign Period</h3>
              <button onClick={() => setEditingCell(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Subject</label>
                <select 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={cellForm.subject}
                  onChange={e => setCellForm({...cellForm, subject: e.target.value})}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Teacher</label>
                <select 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={cellForm.teacher}
                  onChange={e => setCellForm({...cellForm, teacher: e.target.value})}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.fullname}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Room Number</label>
                <input 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Room 101"
                  value={cellForm.room_number}
                  onChange={e => setCellForm({...cellForm, room_number: e.target.value})}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-8">
              <button 
                onClick={handleSaveCell}
                disabled={saving}
                className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Assignment'}
              </button>
              {cellForm.id && (
                <button 
                  onClick={handleDeleteCell}
                  className="w-full p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
                >
                  Remove Entry
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}