import { useEffect, useState } from "react";
// Update this line at the very top of your file
import { 
  Calendar, Clock, AlertCircle, ChevronRight, Loader2, 
  MessageSquare, CheckCircle, List, FileText, Send, Info,X // <--- Add Info here
} from "lucide-react";
import api from "../../api/axios";

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [activeTab, setActiveTab] = useState("exams");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Concern Modal State
  const [showConcernModal, setShowConcernModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [concernText, setConcernText] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "exams") {
        const res = await api.get("student/exams/");
        setExams(res.data);
      } else if (activeTab === "results") {
        const res = await api.get("student/results/");
        setResults(res.data);
      } else if (activeTab === "concerns") {
        const res = await api.get("student/concerns/");
        setConcerns(res.data);
      }
    } catch (err) {
      setError("Failed to sync with CampuSync servers.");
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseConcern = async () => {
    if (!concernText.trim()) return alert("Please describe your concern.");
    
    try {
      await api.post("student/concerns/raise/", {
        result: selectedResult.id,
        concern_text: concernText
      });
      setSuccess("Concern raised successfully.");
      setShowConcernModal(false);
      setConcernText("");
      setActiveTab("concerns");
    } catch (err) {
      const msg = err.response?.data;
      alert(typeof msg === 'string' ? msg : "You already have a pending concern for this result.");
    }
  };

  if (loading && exams.length === 0) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Academic Portal</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Student <ChevronRight size={14} /> <span className="text-indigo-600 font-bold uppercase">{activeTab}</span>
            </p>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
            <TabButton active={activeTab === "exams"} onClick={() => setActiveTab("exams")} icon={<Calendar size={16}/>} label="Exams" />
            <TabButton active={activeTab === "results"} onClick={() => setActiveTab("results")} icon={<FileText size={16}/>} label="Results" />
            <TabButton active={activeTab === "concerns"} onClick={() => setActiveTab("concerns")} icon={<AlertCircle size={16}/>} label="Concerns" />
          </div>
        </div>

        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold flex items-center gap-2"><CheckCircle size={18}/> {success}</div>}

        {/* CONTENT AREA */}
        <div className="mt-8">
          {activeTab === "exams" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.length > 0 ? exams.map(exam => <ExamCard key={exam.id} exam={exam} />) : <EmptyState message="No upcoming exams scheduled." />}
            </div>
          )}

          {activeTab === "results" && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam & Subject</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map(res => (
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6">
                        <p className="font-black text-slate-800 leading-tight">{res.exam_title}</p>
                        <p className="text-xs text-indigo-600 font-bold uppercase mt-1">{res.exam_max_marks} Marks Total</p>
                      </td>
                      <td className="p-6">
                        <span className="font-black text-slate-700">{res.marks_obtained ?? "N/A"}</span>
                        <span className="text-slate-400 text-xs ml-1">/ {res.exam_max_marks}</span>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${res.grade ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {res.grade || "PENDING"}
                        </span>
                      </td>
                      <td className="p-6">
                        {res.status === 'graded' && !res.has_concern && (
                          <button 
                            onClick={() => { setSelectedResult(res); setShowConcernModal(true); }}
                            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-black text-xs"
                          >
                            <AlertCircle size={14}/> Raise Concern
                          </button>
                        )}
                        {res.has_concern && <span className="text-xs font-bold text-slate-400 italic">Concern Filed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {results.length === 0 && <EmptyState message="No results published yet." />}
            </div>
          )}

          {activeTab === "concerns" && (
            <div className="space-y-4">
              {concerns.length > 0 ? concerns.map(c => (
                <div key={c.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.status}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-black text-slate-800 text-lg">{c.exam_title}</h4>
                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Your Concern:</span>
                      {c.concern_text}
                    </p>
                  </div>

                  {c.response && (
                    <div className="flex-1 border-l-4 border-indigo-500 bg-indigo-50/50 p-4 rounded-r-2xl">
                      <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Teacher Response:</p>
                      <p className="text-sm text-slate-700">{c.response}</p>
                      {c.revised_marks && (
                        <p className="mt-2 text-xs font-black text-emerald-600">Marks revised to: {c.revised_marks}</p>
                      )}
                    </div>
                  )}
                </div>
              )) : <EmptyState message="You haven't raised any concerns." />}
            </div>
          )}
        </div>
      </div>

      {/* CONCERN MODAL */}
      {showConcernModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Raise Concern</h3>
              <button onClick={() => setShowConcernModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 font-bold">What is the issue with your <span className="text-indigo-600">{selectedResult?.exam_title}</span> result?</p>
            
            <textarea 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
              rows="5"
              placeholder="Explain the issue clearly (e.g., calculation error, question ambiguity)..."
              value={concernText}
              onChange={(e) => setConcernText(e.target.value)}
            />

            <button 
              onClick={handleRaiseConcern}
              className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all"
            >
              <Send size={18}/> Submit Concern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      {icon} {label}
    </button>
  );
}

function ExamCard({ exam }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">{exam.subject_name}</span>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase">{exam.status}</span>
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-4">{exam.title}</h3>
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-600"><Calendar size={16} className="text-slate-400"/> {new Date(exam.exam_date).toLocaleDateString()}</div>
        <div className="flex items-center gap-3 text-sm font-bold text-slate-600"><Clock size={16} className="text-slate-400"/> {exam.start_time?.slice(0,5)} - {exam.end_time?.slice(0,5)}</div>
      </div>
      <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-widest">
        <span>Room: {exam.room || "TBA"}</span>
        <span>Max Marks: {exam.max_marks}</span>
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Info className="text-slate-300" size={32}/></div>
      <p className="text-slate-400 font-black">{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>;
}