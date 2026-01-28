import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, Calendar, 
  Plus, Edit, Eye, Save, X, ChevronRight, 
  PhoneCall, GraduationCap, ShieldCheck, Heart, Trash2,
  Droplets, Hash, LayoutGrid, FileText
} from "lucide-react";
import api from "../../api/axios";

export default function StudentsPage() {
  const [students, setStudents] = useState({results:[],count:0,next:null,previous:null});
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage,setCurrentPage] = useState(1);
  

  const [form, setForm] = useState({
    id: null,
    fullname: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",
    admission_number: "",
    admission_date: "",
    blood_group: "",
    school_class: "", // Matches Django ForeignKey field name
    guardian_name: "",
    guardian_number: "",
    roll_number: "",
    student_contact: "",
    id_proof_url: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (page=1) => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.get(`students/?page=${page}`),
        api.get("classes/")
      ]);
      
      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
      setCurrentPage(page)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
      }
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
  };

  const resetLocalForm = () => {
    setForm({
      id: null, fullname: "", email: "", phone: "", DOB: "", gender: "",
      admission_number: "", admission_date: "", blood_group: "",
      school_class: "", // Updated
      guardian_name: "", guardian_number: "",
      roll_number: "", student_contact: "", id_proof_url: "",
    });
  };

  const handleEdit = (student) => {
    let admissionDateValue = "";
    if (student.admission_date) {
      const d = new Date(student.admission_date);
      const pad = (n) => String(n).padStart(2, "0");
      admissionDateValue = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    setForm({ 
      ...student, 
      admission_date: admissionDateValue,
      school_class: student.school_class || "" // Ensure we map the class ID correctly
    });
    setIsFormOpen(true);
    setSelectedStudent(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    console.log("Payload being sent to Django:", form);

    
    try {
      if (form.id) {
        await api.put(`students/${form.id}/`, form);
        setSuccess("Student profile updated.");
      } else {
        await api.post("students/", form);
        setSuccess("New student enrolled.");
      }
      await loadData();
      setIsFormOpen(false);
      resetLocalForm();
    } catch (err) {
      console.error("Save error:", err.response?.data);
      const serverErrors = err.response?.data;
      const errorMsg = serverErrors?.email?.[0] || 
                       serverErrors?.admission_number?.[0] || 
                       serverErrors?.school_class?.[0] ||
                       "Failed to save student. Please verify required fields.";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Directory</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Dashboard <ChevronRight size={14} /> <span className="text-blue-600 font-bold">Students</span>
            </p>
          </div>
          <button 
            onClick={() => { resetLocalForm(); setIsFormOpen(!isFormOpen); }}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            {isFormOpen ? <X size={20}/> : <Plus size={20}/>}
            {isFormOpen ? "Close Form" : "Enroll Student"}
          </button>
        </div>

        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">{success}</div>}
        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">{error}</div>}

        {/* EXPANDABLE ENROLLMENT FORM */}
        {isFormOpen && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center px-8">
              <h3 className="text-white font-black text-xl flex items-center gap-3">
                <GraduationCap className="bg-white/20 p-1.5 rounded-lg" />
                {form.id ? "Edit Student Profile" : "New Student Enrollment"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <h4 className="md:col-span-2 text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2">Personal Information</h4>
                <InputGroup label="Full Name *" name="fullname" value={form.fullname} onChange={handleChange} icon={<User size={18}/>} />
                <InputGroup label="Email Address *" name="email" value={form.email} onChange={handleChange} icon={<Mail size={18}/>} type="email" />
                <InputGroup label="Phone Number" name="phone" value={form.phone} onChange={handleChange} icon={<Phone size={18}/>} />
                <InputGroup label="Date of Birth *" name="DOB" value={form.DOB} onChange={handleChange} icon={<Calendar size={18}/>} type="date" />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                   <select name="gender" value={form.gender} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                   </select>
                </div>
                <InputGroup label="Blood Group" name="blood_group" value={form.blood_group} onChange={handleChange} icon={<Droplets size={18}/>} />

                <h4 className="md:col-span-2 text-xs font-black text-blue-600 uppercase tracking-widest border-b pb-2 mt-4">Academic Details</h4>
                <InputGroup label="Admission No *" name="admission_number" value={form.admission_number} onChange={handleChange} icon={<Hash size={18}/>} />
                <InputGroup label="Admission Date" name="admission_date" value={form.admission_date} onChange={handleChange} icon={<Calendar size={18}/>} type="datetime-local" />
                
                {/* Class Dropdown */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class *</label>
                   <div className="relative flex items-center">
                      <div className="absolute left-4 text-slate-300">
                        <LayoutGrid size={18}/>
                      </div>
                      <select 
                        name="school_class" 
                        value={form.school_class} 
                        onChange={handleChange} 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                      >
                        <option value="">Select Class</option>
                        {classes.results.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.class_name} - {cls.division}
                          </option>
                        ))}
                      </select>
                   </div>
                </div>
                
                <InputGroup label="Roll Number" name="roll_number" value={form.roll_number} onChange={handleChange} icon={<Hash size={18}/>} type="number" />
                <InputGroup label="ID Proof URL" name="id_proof_url" value={form.id_proof_url} onChange={handleChange} icon={<FileText size={18}/>} />
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Guardian Info</h4>
                  <InputGroup label="Guardian Name" name="guardian_name" value={form.guardian_name} onChange={handleChange} icon={<User size={18}/>} />
                  <InputGroup label="Guardian Number" name="guardian_number" value={form.guardian_number} onChange={handleChange} icon={<PhoneCall size={18}/>} />
                  <InputGroup label="Student Contact" name="student_contact" value={form.student_contact} onChange={handleChange} icon={<Phone size={18}/>} />
                </div>
                
                <button type="submit" disabled={saving} className="w-full bg-[#1E293B] text-white py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-60">
                   {saving ? (
                     <>
                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       Processing...
                     </>
                   ) : (
                     <>
                       <Save size={18}/> {form.id ? "Update Profile" : "Enroll Student"}
                     </>
                   )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STUDENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <GraduationCap size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-600 mb-2">No Students Yet</h3>
              <p className="text-sm text-slate-400">Enroll your first student using the form above</p>
            </div>
          ) : (
            students.results.map((s) => (
              <div key={s.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black">
                      {s.fullname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedStudent(s); }} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Eye size={18}/></button>
                      <button onClick={() => handleEdit(s)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={18}/></button>
                    </div>
                 </div>
                 
                 <h4 className="text-xl font-black text-slate-800 tracking-tight">{s.fullname}</h4>
                 <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg uppercase">Roll: {s.roll_number || 'N/A'}</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-lg uppercase">
                      {s.class_name ? `${s.class_name} - ${s.division}` : 'No Class'}
                    </span>
                 </div>
                 
                 <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400">Admission No</span>
                      <span className="font-black text-slate-700">{s.admission_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400">Guardian</span>
                      <span className="font-black text-slate-700">{s.guardian_name || '—'}</span>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* PAGINATION SECTION */}
                         {/* PAGINATION SECTION */}
<div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 mt-8">
  <p className="text-xs font-bold text-slate-500">
    Showing {students.results.length} of {students.count} students
  </p>
  <div className="flex gap-2">
    <button
      disabled={!students.previous}
      onClick={() => loadData(currentPage - 1)}
      className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-slate-200 transition-all"
    >
      Previous
    </button>
    <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black">
      {currentPage}
    </div>
    <button
      disabled={!students.next}
      onClick={() => loadData(currentPage + 1)}
      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
    >
      Next
    </button>
  </div>
</div>
      {/* DETAIL MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 relative overflow-hidden animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedStudent(null)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X size={24}/></button>
            
            <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-lg shadow-blue-200">
                    {selectedStudent.fullname.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800">{selectedStudent.fullname}</h2>
                    <p className="text-blue-600 font-bold uppercase text-xs tracking-widest mt-1">{selectedStudent.email}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10 text-sm">
                <DetailItem label="Roll Number" value={selectedStudent.roll_number} icon={<Hash size={16}/>} />
                <DetailItem label="Class" value={selectedStudent.class_name ? `${selectedStudent.class_name} - ${selectedStudent.division}` : '—'} icon={<LayoutGrid size={16}/>} />
                <DetailItem label="Admission No" value={selectedStudent.admission_number} icon={<ShieldCheck size={16}/>} />
                <DetailItem label="Guardian" value={selectedStudent.guardian_name} icon={<User size={16}/>} />
                <DetailItem label="Blood Group" value={selectedStudent.blood_group} icon={<Droplets size={16}/>} />
                <DetailItem label="DOB" value={selectedStudent.DOB} icon={<Calendar size={16}/>} />
            </div>

            <div className="flex gap-4 pt-8 border-t border-slate-100">
                <button onClick={() => handleEdit(selectedStudent)} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                    <Edit size={18}/> Edit Student Profile
                </button>
                <button onClick={() => setSelectedStudent(null)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">
                    Close
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, icon, className, ...props }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-300">{icon}</div>
        <input {...props} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
        {icon} {label}
      </p>
      <p className="font-bold text-slate-800">{value || "—"}</p>
    </div>
  );
}