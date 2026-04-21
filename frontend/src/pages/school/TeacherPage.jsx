// pages/TeachersPage.jsx

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, Calendar, Briefcase, 
  Users, Plus, Edit, Eye, Save, X, ChevronRight, 
  PhoneCall, ShieldCheck, GraduationCap, Award,
  IndianRupee, Search, Trash2, FileText, Upload
} from "lucide-react";
import api from "../../api/axios";
import { Backarrow } from "../../componets/Backarrow";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState({results: [], count: 0, next: null, previous: null});
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    id: null,
    fullname: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",
    joining_date: "",
    qualification: "",
    salary: "",
    specialization: "",
    years_of_experience: "",
    id_proof: null, // Now stores File object or URL string
  });

  useEffect(() => {
    loadTeachers(1);
  }, []);

  const resetLocalForm = () => {
    setForm({
      id: null, 
      fullname: "", 
      email: "", 
      phone: "", 
      DOB: "", 
      gender: "",
      joining_date: "", 
      qualification: "",
      salary: "", 
      specialization: "", 
      years_of_experience: "", 
      id_proof: null,
    });
    setError(""); 
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadTeachers = async (page) => {
    setLoading(true);
    try {
      const res = await api.get(`teachers/?page=${page}`);
      setTeachers(res.data || []);
      setCurrentPage(page);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
      setError("Failed to sync faculty directory.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); 
    setSuccess("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        e.target.value = ""; // Clear the input
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, JPG, and PNG files are allowed");
        e.target.value = ""; // Clear the input
        return;
      }
      
      // Store the actual file object
      setForm({ ...form, id_proof: file });
      setError(""); // Clear any previous errors
    }
  };

  const handleEdit = (teacher) => {
    let joiningDateValue = "";
    if (teacher.joining_date) {
      const d = new Date(teacher.joining_date);
      const pad = (n) => String(n).padStart(2, "0");
      joiningDateValue = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    setForm({ 
      ...teacher, 
      joining_date: joiningDateValue,
      // Keep id_proof as string URL when editing (it's already uploaded)
      id_proof: teacher.id_proof || null
    });
    setIsFormOpen(true);
    setSelectedTeacher(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); 
    setError(""); 
    setSuccess("");

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields to FormData
      formData.append('fullname', form.fullname);
      formData.append('email', form.email);
      formData.append('phone', form.phone || '');
      formData.append('DOB', form.DOB || '');
      formData.append('gender', form.gender || '');
      formData.append('joining_date', form.joining_date);
      formData.append('qualification', form.qualification);
      formData.append('salary', form.salary || '');
      formData.append('years_of_experience', form.years_of_experience || '');
      formData.append('specialization', form.specialization || '');
      
      // Add file if selected (only if it's a new File object, not existing URL)
      if (form.id_proof && form.id_proof instanceof File) {
        formData.append('id_proof', form.id_proof);
      }

      if (form.id) {
        // For update
        await api.put(`teachers/${form.id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setSuccess("Faculty record updated successfully.");
      } else {
        // For create
        const res = await api.post("teachers/", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log(res.data, '===========================');
        setSuccess("New teacher registered successfully.");
      }
      
      await loadTeachers(currentPage);
      setIsFormOpen(false);
      resetLocalForm();
    } catch (err) {
      console.error('Error:', err.response?.data);
      
      // Extract specific error messages
      const errorData = err.response?.data;
      let errorMessage = "Failed to save changes. Please verify all required fields.";
      
      if (errorData) {
        if (errorData.DOB) {
          errorMessage = Array.isArray(errorData.DOB) ? errorData.DOB[0] : errorData.DOB;
        } else if (errorData.email) {
          errorMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        } else if (errorData.id_proof) {
          errorMessage = Array.isArray(errorData.id_proof) ? errorData.id_proof[0] : errorData.id_proof;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getFileDisplayName = () => {
    if (!form.id_proof) return "Click to upload ID Proof";
    
    if (form.id_proof instanceof File) {
      return form.id_proof.name;
    } else if (typeof form.id_proof === 'string') {
      // Extract filename from URL
      const urlParts = form.id_proof.split('/');
      return urlParts[urlParts.length - 1] || "Uploaded file";
    }
    
    return "Click to upload ID Proof";
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
        <Backarrow/>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Faculty Management</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Admin Portal <ChevronRight size={14} /> <span className="text-blue-600 font-bold">Teachers</span>
            </p>
          </div>
          <button 
            onClick={() => { 
              if (isFormOpen) {
                resetLocalForm();
              }
              setIsFormOpen(!isFormOpen); 
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            {isFormOpen ? <X size={20}/> : <Plus size={20}/>}
            {isFormOpen ? "Cancel Action" : "Register Faculty"}
          </button>
        </div>

        {/* SUCCESS/ERROR MESSAGES */}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="text-emerald-400 hover:text-emerald-600">
              <X size={18} />
            </button>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
              <X size={18} />
            </button>
          </div>
        )}

        {/* REGISTRATION FORM */}
        {isFormOpen && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-blue-700 flex items-center px-8">
              <h3 className="text-white font-black text-xl flex items-center gap-3">
                <GraduationCap className="bg-white/20 p-1.5 rounded-lg" />
                {form.id ? "Update Faculty Profile" : "New Faculty Enrollment"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionTitle title="Personal Details" />
                
                <InputGroup 
                  label="Full Name *" 
                  name="fullname" 
                  value={form.fullname} 
                  onChange={handleChange} 
                  icon={<User size={18}/>} 
                  required
                />
                
                <InputGroup 
                  label="Email Address *" 
                  name="email" 
                  value={form.email} 
                  onChange={handleChange} 
                  icon={<Mail size={18}/>} 
                  type="email"
                  required
                />
                
                <InputGroup 
                  label="Phone Number" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  icon={<Phone size={18}/>} 
                />
                
                <InputGroup 
                  label="Date of Birth *" 
                  name="DOB" 
                  value={form.DOB} 
                  onChange={handleChange} 
                  icon={<Calendar size={18}/>} 
                  type="date"
                  required
                />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Gender
                  </label>
                  <select 
                    name="gender" 
                    value={form.gender} 
                    onChange={handleChange} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <SectionTitle title="Professional Information" className="md:col-span-2 mt-4" />
                
                <InputGroup 
                  label="Joining Date *" 
                  name="joining_date" 
                  value={form.joining_date} 
                  onChange={handleChange} 
                  icon={<Calendar size={18}/>} 
                  type="datetime-local"
                  required
                />
                
                <InputGroup 
                  label="Qualification *" 
                  name="qualification" 
                  value={form.qualification} 
                  onChange={handleChange} 
                  icon={<Award size={18}/>}
                  required
                />
                
                <InputGroup 
                  label="Salary (Monthly)" 
                  name="salary" 
                  value={form.salary} 
                  onChange={handleChange} 
                  icon={<IndianRupee size={18}/>} 
                  type="number"
                />
                
                <InputGroup 
                  label="Experience (Years)" 
                  name="years_of_experience" 
                  value={form.years_of_experience} 
                  onChange={handleChange} 
                  icon={<Briefcase size={18}/>} 
                  type="number"
                />
                
                <InputGroup 
                  label="Specialization" 
                  name="specialization" 
                  value={form.specialization} 
                  onChange={handleChange} 
                  icon={<GraduationCap size={18}/>} 
                  className="md:col-span-2"
                />
                
                {/* FILE UPLOAD FOR ID PROOF */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    ID Proof Document {!form.id && "*"}
                  </label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 text-center">
                      {getFileDisplayName()}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      PDF, PNG, or JPG (Max 5MB)
                    </p>
                    {form.id_proof && form.id_proof instanceof File && (
                      <div className="mt-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                        ✓ File selected
                      </div>
                    )}
                    {form.id_proof && typeof form.id_proof === 'string' && (
                      <a 
                        href={form.id_proof} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100"
                      >
                        View current file
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION SIDEBAR */}
              <div className="lg:col-span-4">
                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 sticky top-8">
                  <h4 className="text-sm font-black text-slate-800 mb-6">Enrollment Overview</h4>
                  <div className="space-y-4 mb-8">
                    <StatusItem 
                      label="Directory Status" 
                      value="Ready to Sync" 
                      color="text-blue-600" 
                    />
                    <StatusItem 
                      label="System ID" 
                      value={form.id ? `#${form.id}` : "Auto-generated"} 
                      color={form.id ? "text-slate-700 font-bold" : "text-slate-400 italic"} 
                    />
                    <StatusItem 
                      label="ID Proof" 
                      value={form.id_proof ? "Attached" : "Not uploaded"} 
                      color={form.id_proof ? "text-emerald-600" : "text-slate-400"} 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={saving} 
                    className="w-full bg-[#1E293B] text-white py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving Data...
                      </>
                    ) : (
                      <>
                        <Save size={18}/> 
                        {form.id ? "Update Profile" : "Register Faculty"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* FACULTY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.results.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Users size={64} className="mb-4" />
              <p className="font-bold text-lg">No teachers registered yet</p>
              <p className="text-sm">Click "Register Faculty" to add your first teacher</p>
            </div>
          ) : (
            teachers.results.map((t) => (
              <div 
                key={t.id} 
                className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black">
                    {t.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedTeacher(t)} 
                      className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
                      title="View details"
                    >
                      <Eye size={18}/>
                    </button>
                    <button 
                      onClick={() => handleEdit(t)} 
                      className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                      title="Edit teacher"
                    >
                      <Edit size={18}/>
                    </button>
                  </div>
                </div>
                
                <h4 className="text-xl font-black text-slate-800 tracking-tight">{t.fullname}</h4>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">
                  {t.specialization || "Faculty Member"}
                </p>
                
                <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                  <InfoRow label="Experience" value={`${t.years_of_experience || 0} Years`} />
                  <InfoRow label="Qualification" value={t.qualification} />
                  <InfoRow label="Employee ID" value={`#${t.employee_id || t.id}`} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION */}
        {teachers.count > 0 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-500">
              Showing {teachers.results.length} of {teachers.count}
            </p>
            <div className="flex items-center gap-3">
              <button 
                disabled={!teachers.previous} 
                onClick={() => loadTeachers(currentPage - 1)} 
                className="p-2 bg-slate-100 rounded-xl text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                {currentPage}
              </span>
              <button 
                disabled={!teachers.next} 
                onClick={() => loadTeachers(currentPage + 1)} 
                className="p-2 bg-blue-600 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedTeacher && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" 
          onClick={() => setSelectedTeacher(null)}
        >
          <div 
            className="bg-white rounded-[3rem] w-full max-w-2xl p-10 relative overflow-hidden animate-in zoom-in-95" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedTeacher(null)} 
              className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={24}/>
            </button>
            
            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black">
                {selectedTeacher.fullname.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800">{selectedTeacher.fullname}</h2>
                <p className="text-blue-600 font-bold uppercase text-xs tracking-widest">{selectedTeacher.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-sm">
              <DetailItem label="Qualification" value={selectedTeacher.qualification} />
              <DetailItem label="Salary" value={selectedTeacher.salary ? `₹${selectedTeacher.salary.toLocaleString()}` : "—"} />
              <DetailItem label="Experience" value={selectedTeacher.years_of_experience ? `${selectedTeacher.years_of_experience} Yrs` : "—"} />
              <DetailItem label="Joining Date" value={selectedTeacher.joining_date ? new Date(selectedTeacher.joining_date).toLocaleDateString() : "—"} />
              <DetailItem label="Phone" value={selectedTeacher.phone || "—"} />
              <DetailItem label="Gender" value={selectedTeacher.gender ? selectedTeacher.gender.charAt(0).toUpperCase() + selectedTeacher.gender.slice(1) : "—"} />
              <DetailItem label="DOB" value={selectedTeacher.DOB ? new Date(selectedTeacher.DOB).toLocaleDateString() : "—"} />
              <DetailItem label="Employee ID" value={`#${selectedTeacher.employee_id || selectedTeacher.id}`} />
              <DetailItem label="Specialization" value={selectedTeacher.specialization || "—"} />
            </div>
            
            {selectedTeacher.id_proof && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <a 
                  href={selectedTeacher.id_proof} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl group-hover:bg-blue-100 transition-colors">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">ID Proof Document</p>
                      <p className="text-xs text-slate-500">Click to view</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function InputGroup({ label, icon, className, ...props }) {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative flex items-center group">
        {icon && (
          <div className="absolute left-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">
            {icon}
          </div>
        )}
        <input 
          {...props} 
          className={`w-full bg-slate-50 border border-slate-100 rounded-2xl ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all`} 
        />
      </div>
    </div>
  );
}

function SectionTitle({ title, className }) {
  return (
    <h4 className={`${className || ''} text-xs font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2 md:col-span-2`}>
      {title}
    </h4>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="font-bold text-slate-400">{label}</span>
      <span className="font-black text-slate-700">{value || "—"}</span>
    </div>
  );
}

function StatusItem({ label, value, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-bold text-slate-800">{value || "—"}</p>
    </div>
  );
}