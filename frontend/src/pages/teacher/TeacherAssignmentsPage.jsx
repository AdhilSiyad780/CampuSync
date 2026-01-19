import { useEffect, useState } from "react";
import { 
  FileText, Plus, Edit, Trash2, Eye, Calendar, 
  Users, BookOpen, Paperclip, Save, X, ChevronRight 
} from "lucide-react";
import api from "../../api/axios";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);

  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    subject: "",
    class_ids: [],
    due_date: "",
    total_marks: 100,
    attachment: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, subjectsRes, classesRes] = await Promise.all([
        api.get("assignments/"),
        api.get("subjects/"),
        api.get("classes/"),
      ]);
      
      setAssignments(assignmentsRes.data || []);
      setSubjects(subjectsRes.data.results || subjectsRes.data || []);
      setClasses(classesRes.data.results || classesRes.data || []);
    } catch (err) {
      console.error("Load error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === "file") {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleClassToggle = (classId) => {
    const newClassIds = form.class_ids.includes(classId)
      ? form.class_ids.filter(id => id !== classId)
      : [...form.class_ids, classId];
    
    setForm({ ...form, class_ids: newClassIds });
  };

  const resetForm = () => {
    setForm({
      id: null,
      title: "",
      description: "",
      subject: "",
      class_ids: [],
      due_date: "",
      total_marks: 100,
      attachment: null,
    });
    setShowForm(false);
  };

  const handleEdit = (assignment) => {
    // Format due_date for datetime-local input
    const dueDate = new Date(assignment.due_date);
    const formattedDate = dueDate.toISOString().slice(0, 16);
    
    setForm({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      subject: assignment.subject,
      class_ids: assignment.classes_details.map(c => c.id),

      due_date: formattedDate,
      total_marks: assignment.total_marks,
      attachment: null,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.subject || form.class_ids.length === 0 || !form.due_date) {
      setError("Please fill all required fields");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("subject", form.subject);
      form.class_ids.forEach(id => {
                formData.append("class_ids", id); 
       });
      console.log(form.class_ids)
      formData.append("due_date", form.due_date);
      formData.append("total_marks", form.total_marks);
      
      if (form.attachment) {
        formData.append("attachment", form.attachment);
      }

      if (form.id) {
        await api.put(`assignments/${form.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess("Assignment updated successfully!");
      } else {
        await api.post("assignments/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setSuccess("Assignment created successfully!");
      }

      await loadData();
      resetForm();
    } catch (err) {
      console.error("Save error:", err.response?.data);
      setError("Failed to save assignment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment?")) return;
    
    try {
      await api.delete(`assignments/${id}/`);
      setSuccess("Assignment deleted!");
      await loadData();
    } catch (err) {
      setError("Failed to delete assignment");
    }
  };

  const viewSubmissions = async (assignment) => {
  try {
    const res = await api.get(`assignments/${assignment.id}/class-report/`);
    setSubmissions(res.data || []); // Now contains ALL students
    setSelectedAssignment(assignment);
    setShowSubmissions(true);
  } catch (err) {
    setError("Failed to load class report");
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">My Assignments</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Teacher Portal <ChevronRight size={14} /> <span className="text-blue-600 font-bold">Assignments</span>
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700"
          >
            {showForm ? <X size={20}/> : <Plus size={20}/>}
            {showForm ? "Close" : "Create Assignment"}
          </button>
        </div>

        {/* ALERTS */}
        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold">{error}</div>}
        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold">{success}</div>}

        {/* FORM */}
        {showForm && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
            <h3 className="text-xl font-black text-slate-800 mb-6">
              {form.id ? "Edit Assignment" : "Create New Assignment"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Title *</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Assignment title"
                    required
                    className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Assignment instructions..."
                    rows="4"
                    required
                    className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Subject *</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Due Date *</label>
                  <input
                    type="datetime-local"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Total Marks *</label>
                  <input
                    type="number"
                    name="total_marks"
                    value={form.total_marks}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Attachment (Optional)</label>
                  <input
                    type="file"
                    name="attachment"
                    onChange={handleChange}
                    className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block">Assign to Classes *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {classes.map(cls => (
                      <label
                        key={cls.id}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          form.class_ids.includes(cls.id)
                            ? "bg-blue-50 border-blue-300"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.class_ids.includes(cls.id)}
                          onChange={() => handleClassToggle(cls.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-bold">{cls.class_name} - {cls.division}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? "Saving..." : <><Save size={18}/> {form.id ? "Update" : "Create"}</>}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-200"
                >
                  <X size={18}/> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ASSIGNMENTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <FileText size={48} className="mx-auto text-slate-300 mb-4"/>
              <h3 className="text-lg font-bold text-slate-600 mb-2">No Assignments Yet</h3>
              <p className="text-sm text-slate-400">Create your first assignment</p>
            </div>
          ) : (
            assignments.map(assignment => (
              <div key={assignment.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-800 mb-1">{assignment.title}</h4>
                    <p className="text-xs text-slate-500">{assignment.subject_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewSubmissions(assignment)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                      title="View Submissions"
                    >
                      <Eye size={18}/>
                    </button>
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                      <Edit size={18}/>
                    </button>
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{assignment.description}</p>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400 flex items-center gap-1">
                      <Calendar size={14}/> Due
                    </span>
                    <span className={`font-black ${assignment.is_overdue ? "text-red-600" : "text-slate-700"}`}>
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400 flex items-center gap-1">
                      <Users size={14}/> Classes
                    </span>
                    <span className="font-black text-slate-700">{assignment.classes_details.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400">Submissions</span>
                    <span className="bg-blue-600 text-white font-black px-3 py-1 rounded-lg">
                      {assignment.submission_count}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SUBMISSIONS MODAL */}
      {showSubmissions && selectedAssignment && (
        <SubmissionsModal
          assignment={selectedAssignment}
          submissions={submissions}
          onClose={() => setShowSubmissions(false)}
          onReload={loadData}
        />
      )}
    </div>
  );
}
// Inside SubmissionsModal Component
function SubmissionsModal({ assignment, submissions, onClose, onReload }) {
  const [grading, setGrading] = useState(null);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const handleGrade = async () => {
    // Check if we actually have a submission ID
    if (!grading?.id) {
      alert("No submission found to grade.");
      return;
    }

    if (!marks || marks < 0 || marks > assignment.total_marks) {
      alert(`Marks must be between 0 and ${assignment.total_marks}`);
      return;
    }

    setSaving(true);
    try {
      // API call to the grading endpoint we defined earlier
      await api.post(`submissions/${grading.id}/grade/`, {
        marks_obtained: parseInt(marks),
        feedback: feedback
      });
      
      setGrading(null);
      setMarks("");
      setFeedback("");
      onReload(); // Refetch the list to show updated status
    } catch (err) {
      console.error("Grade Error:", err);
      alert("Failed to save grade. Ensure the backend endpoint is correct.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-[2.5rem] max-w-4xl w-full p-10 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-start mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{assignment.title}</h2>
            <div className="flex items-center gap-3 mt-1">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class Progress</span>
               <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all" 
                    style={{ width: `${(submissions.filter(s => s.status === 'graded').length / submissions.length) * 100}%` }}
                  ></div>
               </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
        </div>

        {/* STUDENT LIST */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {submissions.map(student => (
            <div key={student.student_id} className="bg-slate-50 border border-slate-100 rounded-3xl p-5 hover:bg-white hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm border border-slate-100">
                    {student.roll_number}
                  </div>
                  <div>
                    <p className="font-black text-slate-800">{student.student_name}</p>
                    <StatusText status={student.status} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* IMPROVED ATTACHMENT VIEWING */}
                  {student.attachment ? (
                    <a 
                      href={student.attachment} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all text-xs font-bold"
                    >
                      <Paperclip size={16} />
                      View Attachment
                    </a>
                  ) : (
                    <div className="px-4 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold italic">
                      No File
                    </div>
                  )}

                  {student.status === "graded" ? (
                    <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase">Score:</span>
                       <span className="text-sm font-black text-slate-800">{student.marks_obtained}/{assignment.total_marks}</span>
                    </div>
                  ) : student.status !== "not_submitted" ? (
                    <button
                      onClick={() => { setGrading({id: student.submission_id, student_name: student.student_name}); setMarks(""); setFeedback(""); }}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      Grade Now
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* FLOATING GRADING OVERLAY */}
        {grading && (
          <div className="mt-8 p-8 bg-[#1E293B] rounded-[2rem] text-white animate-in slide-in-from-bottom-6 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-lg flex items-center gap-3">
                <Edit className="text-indigo-400" size={20}/>
                Grading: {grading.student_name}
              </h4>
              <button onClick={() => setGrading(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Marks (Max {assignment.total_marks})</label>
                <input
                  type="number"
                  value={marks}
                  onChange={e => setMarks(e.target.value)}
                  placeholder="00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Feedback Remarks</label>
                <input
                  type="text"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Great work, keep it up!"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-3 flex items-end">
                <button
                  onClick={handleGrade}
                  disabled={saving}
                  className="w-full bg-indigo-500 text-white py-3.5 rounded-xl font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? "..." : <><Save size={18}/> Save Grade</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusText({ status }) {
  const styles = {
    not_submitted: "text-red-400",
    pending: "text-amber-500",
    graded: "text-emerald-500",
    late: "text-orange-500"
  };
  const labels = {
    not_submitted: "Missing",
    pending: "Needs Grading",
    graded: "Completed",
    late: "Submitted Late"
  };
  return <p className={`text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>{labels[status]}</p>;
}