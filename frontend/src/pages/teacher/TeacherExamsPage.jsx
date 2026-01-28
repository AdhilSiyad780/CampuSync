import { useEffect, useState } from "react";
import { 
  Plus, Edit, Trash2, Eye, Calendar, Users, Clock, Save, X, 
  ChevronRight, ClipboardList, AlertCircle, Loader2, CheckCircle,MessageSquare
} from "lucide-react";
import api from "../../api/axios";

export default function TeacherExamsPage() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [results, setResults] = useState([]);
  const [concerns, setConcerns] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showConcerns, setShowConcerns] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    subject: "",
    class_ids: [],
    exam_date: "",
    start_time: "",
    end_time: "",
    room: "",
    max_marks: 100,
    status: "scheduled",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examsRes, classesRes, subjectsRes, concernsRes] = await Promise.all([
        api.get("teacher/exams/"),
        api.get("class-all/"), 
        api.get("subject-all/"),
        api.get("teacher/concerns/?status=pending"),
      ]);
      
      setExams(examsRes.data || []);
      setClasses(classesRes.data || []); 
      setSubjects(subjectsRes.data || []);
      setConcerns(concernsRes.data || []);
    } catch (err) {
      setError("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleClassToggle = (classId) => {
    const newClassIds = form.class_ids.includes(classId)
      ? form.class_ids.filter(id => id !== classId)
      : [...form.class_ids, classId];
    setForm({ ...form, class_ids: newClassIds });
  };

  const resetForm = () => {
    setForm({
      id: null, title: "", description: "", subject: "", class_ids: [],
      exam_date: "", start_time: "", end_time: "", room: "", max_marks: 100, status: "scheduled"
    });
    setShowForm(false);
    setError("");
    setSuccess("");
  };

  const handleEdit = (exam) => {
    setForm({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      class_ids: exam.classes_details?.map(c => c.id) || [],
      exam_date: exam.exam_date,
      start_time: exam.start_time,
      end_time: exam.end_time,
      room: exam.room || "",
      max_marks: exam.max_marks,
      status: exam.status,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = { 
        ...form,
        subject: parseInt(form.subject),
        class_ids: form.class_ids.map(id => parseInt(id))
      };

      if (form.id) {
        await api.put(`teacher/exams/${form.id}/`, payload);
        setSuccess("Exam updated successfully!");
      } else {
        await api.post("teacher/exams/", payload);
        setSuccess("Exam created successfully!");
      }

      await loadData();
      resetForm();
    } catch (err) {
      const msg = err.response?.data;
      setError(msg ? Object.values(msg).flat()[0] : "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this exam?")) return;
    try {
      await api.delete(`teacher/exams/${id}/`);
      setSuccess("Exam deleted!");
      await loadData();
    } catch (err) {
      setError("Failed to delete exam");
    }
  };

  const viewResults = async (exam) => {
    setSelectedExam(exam);
    setShowResults(true);
    try {
      const res = await api.get(`teacher/exams/${exam.id}/results/`);
      setResults(res.data || []);
    } catch (err) {
      setError("Failed to load results");
    }
  };

  const createResults = async (examId) => {
    if (!window.confirm("Create result entries for all students?")) return;
    try {
      const res = await api.post(`teacher/exams/${examId}/create-results/`);
      setSuccess(res.data.message);
      await loadData();
    } catch (err) {
      setError("Failed to create results");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Exam Management</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Teacher Portal <ChevronRight size={14} /> <span className="text-indigo-600 font-bold">Exams</span>
            </p>
          </div>
          <div className="flex gap-3">
            {concerns.length > 0 && (
              <button
                onClick={() => setShowConcerns(true)}
                className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold shadow-lg flex items-center gap-2 hover:bg-amber-700 relative"
              >
                <AlertCircle size={20}/>
                Concerns
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                  {concerns.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700"
            >
              {showForm ? <X size={20}/> : <Plus size={20}/>}
              {showForm ? "Close" : "Create Exam"}
            </button>
          </div>
        </div>

        {/* ALERTS */}
        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold">{error}</div>}
        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold">{success}</div>}

        {/* FORM */}
        {showForm && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <h3 className="text-xl font-black text-slate-800 mb-6">{form.id ? "Edit Exam" : "Create New Exam"}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Title *</label>
                  <input name="title" value={form.title} onChange={handleChange} required className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Subject *</label>
                  <select name="subject" value={form.subject} onChange={handleChange} required className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold">
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Exam Date *</label>
                  <input type="date" name="exam_date" value={form.exam_date} onChange={handleChange} required className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">Start *</label>
                    <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase">End *</label>
                    <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Room</label>
                  <input name="room" value={form.room} onChange={handleChange} placeholder="e.g., Hall A" className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Max Marks *</label>
                  <input type="number" name="max_marks" value={form.max_marks} onChange={handleChange} min="1" required className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">Assign to Classes *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {classes.map(cls => (
                      <label key={cls.id} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.class_ids.includes(cls.id) ? "bg-indigo-50 border-indigo-300" : "bg-slate-50 border-slate-200"}`}>
                        <input type="checkbox" checked={form.class_ids.includes(cls.id)} onChange={() => handleClassToggle(cls.id)} className="w-4 h-4" />
                        <span className="text-sm font-bold">{cls.class_name} - {cls.division}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                  {form.id ? "Update" : "Create"}
                </button>
                <button type="button" onClick={resetForm} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-200">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* EXAMS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <ExamCard key={exam.id} exam={exam} onEdit={handleEdit} onDelete={handleDelete} onViewResults={viewResults} onCreateResults={createResults} />
          ))}
        </div>
      </div>

      {/* MODALS */}
      {showResults && selectedExam && <ResultsModal exam={selectedExam} results={results} onClose={() => setShowResults(false)} onReload={loadData} />}
      {showConcerns && <ConcernsModal concerns={concerns} onClose={() => setShowConcerns(false)} onReload={loadData} />}
    </div>
  );
}

function ExamCard({ exam, onEdit, onDelete, onViewResults, onCreateResults }) {
  const colors = { scheduled: "bg-blue-100 text-blue-700", ongoing: "bg-green-100 text-green-700", completed: "bg-slate-100 text-slate-700", cancelled: "bg-red-100 text-red-700" };
  
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-black text-slate-800 mb-1">{exam.title}</h4>
          <p className="text-xs text-slate-500">{exam.subject_name}</p>
        </div>
        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${colors[exam.status]}`}>{exam.status}</span>
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-50 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-400 flex items-center gap-1"><Calendar size={14}/> Date</span>
          <span className="font-black text-slate-700">{new Date(exam.exam_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-400 flex items-center gap-1"><Clock size={14}/> Time</span>
          <span className="font-black text-slate-700">{exam.start_time?.slice(0,5)} - {exam.end_time?.slice(0,5)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-400 flex items-center gap-1"><Users size={14}/> Classes</span>
          <span className="font-black text-slate-700">{exam.classes_details?.length || 0}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-400">Graded</span>
          <span className="bg-indigo-600 text-white font-black px-3 py-1 rounded-lg">{exam.graded_count || 0}/{exam.result_count || 0}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onViewResults(exam)} className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 flex items-center justify-center gap-1">
          <Eye size={14}/> Results
        </button>
        <button onClick={() => onEdit(exam)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"><Edit size={18}/></button>
        <button onClick={() => onDelete(exam.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={18}/></button>
      </div>

      {exam.result_count === 0 && (
        <button onClick={() => onCreateResults(exam.id)} className="w-full mt-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center justify-center gap-1">
          <ClipboardList size={14}/> Create Result Entries
        </button>
      )}
    </div>
  );
}

function ResultsModal({ exam, results, onClose, onReload }) {
  const [grading, setGrading] = useState(null);
  const [marks, setMarks] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("graded");
  const [saving, setSaving] = useState(false);
  const [selectedClass, setSelectedClass] = useState("all");

  const groupedResults = results.reduce((acc, r) => {
    const cls = `${r.student?.student_profile?.school_class?.class_name || 'Unknown'} - ${r.student?.student_profile?.school_class?.division || ''}`;
    if (!acc[cls]) acc[cls] = [];
    acc[cls].push(r);
    return acc;
  }, {});

  const filteredResults = selectedClass === "all" ? results : groupedResults[selectedClass] || [];

  const handleGrade = async () => {
    if (status !== "absent" && (!marks || marks < 0 || marks > exam.max_marks)) {
      alert(`Marks must be between 0 and ${exam.max_marks}`);
      return;
    }

    setSaving(true);
    try {
      await api.post(`teacher/results/${grading.id}/grade/`, {
        marks_obtained: status === "absent" ? null : parseFloat(marks),
        remarks, status
      });
      setGrading(null);
      setMarks("");
      setRemarks("");
      setStatus("graded");
      onReload();
    } catch (err) {
      alert("Failed to grade");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] max-w-6xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{exam.title}</h2>
            <p className="text-sm text-slate-500">Results ({filteredResults.length}) • Max: {exam.max_marks}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X size={20}/></button>
        </div>

        {/* CLASS FILTER */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button onClick={() => setSelectedClass("all")} className={`px-4 py-2 rounded-xl text-sm font-bold ${selectedClass === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            All ({results.length})
          </button>
          {Object.keys(groupedResults).map(cls => (
            <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-4 py-2 rounded-xl text-sm font-bold ${selectedClass === cls ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
              {cls} ({groupedResults[cls].length})
            </button>
          ))}
        </div>

        {/* RESULTS LIST */}
        <div className="space-y-3">
          {filteredResults.map(r => (
            <div key={r.id} className="bg-slate-50 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-slate-800">{r.student_name}</p>
                  <p className="text-xs text-slate-500">Roll: {r.student_roll}</p>
                  {r.has_concern && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-flex items-center gap-1"><AlertCircle size={12}/> Has Concern</span>}
                </div>
                <div>
                  {r.status === "graded" ? (
                    <div>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">{r.marks_obtained}/{exam.max_marks} ({r.percentage}%)</span>
                      <p className="text-xs font-black text-slate-600 mt-1">Grade: {r.grade}</p>
                    </div>
                  ) : r.status === "absent" ? (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold">Absent</span>
                  ) : (
                    <button onClick={() => { setGrading(r); setMarks(""); setRemarks(""); setStatus("graded"); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700">Grade</button>
                  )}
                </div>
              </div>
              {r.remarks && <div className="mt-3 bg-white rounded-xl p-3 border border-slate-200"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Remarks:</p><p className="text-xs text-slate-600">{r.remarks}</p></div>}
            </div>
          ))}
        </div>

        {/* GRADING FORM */}
        {grading && (
          <div className="mt-6 p-6 bg-indigo-50 rounded-2xl">
            <h4 className="font-bold text-slate-800 mb-4">Grade - {grading.student_name}</h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-xl border">
                  <option value="graded">Graded</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              {status === "graded" && (
                <div>
                  <label className="text-xs font-bold text-slate-600">Marks (out of {exam.max_marks})</label>
                  <input type="number" value={marks} onChange={e => setMarks(e.target.value)} min="0" max={exam.max_marks} step="0.5" className="w-full mt-1 px-4 py-2 rounded-xl border" />
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-600">Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows="3" className="w-full mt-1 px-4 py-2 rounded-xl border" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleGrade} disabled={saving} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">{saving ? "Saving..." : "Submit"}</button>
                <button onClick={() => setGrading(null)} className="bg-slate-200 text-slate-600 px-6 py-2 rounded-xl font-bold">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function ConcernsModal({ concerns, onClose, onReload }) {
  const [resolving, setResolving] = useState(null);
  const [response, setResponse] = useState("");
  const [concernStatus, setConcernStatus] = useState("resolved");
  const [revisedMarks, setRevisedMarks] = useState("");
  const [saving, setSaving] = useState(false);

  const handleResolve = async () => {
    if (!response.trim()) {
      alert("Please provide a response for the student.");
      return;
    }

    setSaving(true);
    try {
      await api.post(`teacher/concerns/${resolving.id}/resolve/`, {
        response, 
        status: concernStatus,
        revised_marks: revisedMarks ? parseFloat(revisedMarks) : null
      });
      setResolving(null);
      setResponse("");
      setConcernStatus("resolved");
      setRevisedMarks("");
      onReload(); // Refreshes both concerns count and exam cards
    } catch (err) {
      alert("Failed to resolve concern. Please check your network.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] max-w-5xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <AlertCircle size={28} className="text-amber-600"/> Student Concerns
            </h2>
            <p className="text-sm text-slate-500 font-bold">Pending Review ({concerns.length})</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
            <X size={24}/>
          </button>
        </div>

        {concerns.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <CheckCircle size={64} className="mx-auto text-emerald-500 mb-4"/>
            <p className="text-slate-600 font-black text-xl">All clear!</p>
            <p className="text-slate-400 font-bold">No pending student concerns at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {concerns.map(c => (
              <div key={c.id} className="bg-amber-50 rounded-[2rem] p-6 border-2 border-amber-100 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div className="space-y-1">
                    <p className="font-black text-slate-800 text-lg">{c.student_name}</p>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      {c.exam_title} • {c.subject_name}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] font-black bg-white text-slate-500 px-3 py-1 rounded-full border border-slate-100">
                        Current Marks: {c.previous_marks}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black uppercase px-4 py-1.5 rounded-full bg-amber-200 text-amber-800">
                      {c.status}
                    </span>
                    {!resolving && (
                      <button 
                        onClick={() => setResolving(c)}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-md"
                      >
                        Take Action
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-amber-200">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-2 flex items-center gap-1">
                    <MessageSquare size={12}/> Student Message:
                  </p>
                  <p className="text-sm text-slate-700 font-medium italic leading-relaxed">
                    "{c.concern_text}"
                  </p>
                  <p className="text-[10px] text-slate-400 mt-3 font-bold">
                    Submitted: {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>

                {/* RESOLUTION FORM */}
                {resolving?.id === c.id && (
                  <div className="mt-6 p-6 bg-white rounded-2xl border-2 border-indigo-100 animate-in slide-in-from-top-2">
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                      <CheckCircle size={18} className="text-indigo-600"/> Provide Resolution
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase">Set Status</label>
                        <select 
                          value={concernStatus} 
                          onChange={e => setConcernStatus(e.target.value)}
                          className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="resolved">Resolved (Marks Changed)</option>
                          <option value="rejected">Rejected (No Change)</option>
                          <option value="under_review">Keep Under Review</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase">Revised Marks (Optional)</label>
                        <input 
                          type="number" 
                          value={revisedMarks} 
                          onChange={e => setRevisedMarks(e.target.value)}
                          placeholder="Leave blank if no change"
                          className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Teacher's Response *</label>
                      <textarea 
                        value={response} 
                        onChange={e => setResponse(e.target.value)}
                        placeholder="Explain your decision to the student..."
                        rows="3"
                        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleResolve} 
                        disabled={saving}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                      >
                        {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        Confirm Resolution
                      </button>
                      <button 
                        onClick={() => { setResolving(null); setResponse(""); }}
                        className="bg-slate-100 text-slate-500 px-8 py-3 rounded-xl font-black hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}