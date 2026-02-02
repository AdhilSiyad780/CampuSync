import { useEffect, useState } from "react";
import { 
  FileText, Calendar, BookOpen, Paperclip, 
  ChevronRight, Clock, CheckCircle, AlertCircle, Upload, X, MessageSquare 
} from "lucide-react";
import api from "../../api/axios";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Submission State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.user_type !== 'student') {
     navigate('/student/login')
  }


  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get("student/assignments/");
      setAssignments(res.data.results ? res.data : { results: res.data, count: res.data.length });
    } catch (err) {
      setError("Failed to load your assignments.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSubmissionFile(e.target.files[0]);
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      alert("Please select a file to upload");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("assignment", selectedAssignment.id);
    formData.append("attachment", submissionFile);
    formData.append("submission_text", submissionText);

    try {
      await api.post("student/assignments/submit/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccess("Assignment submitted successfully!");
      setIsSubmitModalOpen(false);
      setSubmissionFile(null);
      setSubmissionText("");
      fetchAssignments(); 
    } catch (err) {
      setError("Failed to upload submission. Check file size/type.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Coursework</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            Student Portal <ChevronRight size={14} /> <span className="text-indigo-600 font-bold">Assignments</span>
          </p>
        </div>

        {success && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold border border-emerald-100">{success}</div>}
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}

        {/* ASSIGNMENTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.results.map((asn) => (
            <div key={asn.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <BookOpen size={20} />
                </div>
                <StatusBadge isOverdue={asn.is_overdue} status={asn.my_submission_status} />
              </div>

              <h3 className="text-lg font-black text-slate-800 leading-tight mb-1">{asn.title}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{asn.subject_name}</p>
              
              <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-1">
                {asn.description}
              </p>

              {/* MARKS & REVIEW SECTION */}
              {asn.my_submission_status === 'graded' && asn.my_submission_details && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-600 uppercase">Score Obtained</span>
                    <span className="text-lg font-black text-emerald-700">
                      {asn.my_submission_details.marks_obtained} / {asn.total_marks}
                    </span>
                  </div>
                  {asn.my_submission_details.feedback && (
                    <div className="pt-2 border-t border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                        <MessageSquare size={10}/> Teacher Feedback
                      </p>
                      <p className="text-xs text-emerald-800 italic mt-1 leading-relaxed">
                        "{asn.my_submission_details.feedback}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-slate-50 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-2"><Clock size={14}/> Due Date</span>
                  <span className={`font-black ${asn.is_overdue ? "text-red-500" : "text-slate-700"}`}>
                    {new Date(asn.due_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-2"><FileText size={14}/> Max Marks</span>
                  <span className="font-black text-slate-700">{asn.total_marks}</span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2">
                {asn.attachment && (
                  <a 
                    href={asn.attachment} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Download Teacher's Attachment"
                  >
                    <Paperclip size={18} />
                  </a>
                )}
                <button 
                  onClick={() => { setSelectedAssignment(asn); setIsSubmitModalOpen(true); }}
                  disabled={asn.my_submission_status === 'submitted' || asn.my_submission_status === 'graded'}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                >
                  {asn.my_submission_status === 'submitted' ? "Turned In" : asn.my_submission_status === 'graded' ? "Completed" : "Turn In Work"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUBMISSION MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800">Submit Assignment</h2>
              <button onClick={() => setIsSubmitModalOpen(false)}><X size={24} className="text-slate-400" /></button>
            </div>

            <p className="text-sm text-slate-500 mb-6">Uploading work for: <br/><span className="font-bold text-slate-800">{selectedAssignment?.title}</span></p>

            <form onSubmit={handleSubmitWork} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Submission Notes</label>
                <textarea
                  className="w-full mt-2 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  rows="3"
                  placeholder="Describe your work..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 transition-all relative">
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  required
                />
                <Upload size={32} className="mx-auto text-indigo-400 mb-2" />
                <p className="text-xs font-bold text-slate-600">
                  {submissionFile ? submissionFile.name : "Click to select or drag & drop"}
                </p>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Uploading..." : "Submit to Teacher"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ isOverdue, status }) {
  if (status === 'graded') {
    return (
      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
        <CheckCircle size={12}/> Graded
      </span>
    );
  }
  
  if (status === 'submitted' || status === 'late') {
    return (
      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
        <Clock size={12}/> {status === 'late' ? "Late Submission" : "Under Review"}
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
        <AlertCircle size={12}/> Overdue
      </span>
    );
  }

  return <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Pending</span>;
}