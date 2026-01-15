import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, Calendar, Briefcase, 
  Users, Plus, Edit, Eye, Save, X, ChevronRight, 
  PhoneCall, ShieldCheck, GraduationCap, Award,
  IndianRupee, Search, Trash2
} from "lucide-react";
import api from "../../api/axios";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [form, setForm] = useState({
    id: null,
    fullname: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",
    department_id: "",
    employee_id: "",
    joining_date: "",
    qualification: "",
    salary: "",
    specialization: "",
    years_of_experience: "",
    id_proof_url: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadTeachers();
  }, []);

  const resetLocalForm = () => {
    setForm({
      id: null, fullname: "", email: "", phone: "", DOB: "", gender: "",
      department_id: "", employee_id: "", joining_date: "", qualification: "",
      salary: "", specialization: "", years_of_experience: "", id_proof_url: "",
    });
    setError(""); setSuccess("");
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const res = await api.get("teachers/");
      setTeachers(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
      setError("Failed to sync faculty directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
  };

  const handleEdit = (teacher) => {
    let joiningDateValue = "";
    if (teacher.joining_date) {
      const d = new Date(teacher.joining_date);
      const pad = (n) => String(n).padStart(2, "0");
      joiningDateValue = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    setForm({ ...teacher, joining_date: joiningDateValue });
    setIsFormOpen(true);
    setSelectedTeacher(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");

    try {
      const payload = {
        ...form,
        department_id: form.department_id ? Number(form.department_id) : null,
        employee_id: form.employee_id ? Number(form.employee_id) : null,
        salary: form.salary ? Number(form.salary) : null,
        years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
      };

      if (form.id) {
        await api.put(`teachers/${form.id}/`, payload);
        setSuccess("Faculty record updated successfully.");
      } else {
        await api.post("teachers/", payload);
        setSuccess("New teacher registered successfully.");
      }
      await loadTeachers();
      setIsFormOpen(false);
      resetLocalForm();
    } catch (err) {
      setError("Failed to save changes. Please verify all required fields.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Faculty Management</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Admin Portal <ChevronRight size={14} /> <span className="text-blue-600 font-bold">Teachers</span>
            </p>
          </div>
          <button 
            onClick={() => { resetLocalForm(); setIsFormOpen(!isFormOpen); }}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            {isFormOpen ? <X size={20}/> : <Plus size={20}/>}
            {isFormOpen ? "Cancel Action" : "Register Faculty"}
          </button>
        </div>

        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold">{success}</div>}
        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold">{error}</div>}

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
              {/* Personal Section */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <SectionTitle title="Personal Details" />
                <InputGroup label="Full Name *" name="fullname" value={form.fullname} onChange={handleChange} icon={<User size={18}/>} />
                <InputGroup label="Email Address *" name="email" value={form.email} onChange={handleChange} icon={<Mail size={18}/>} type="email" />
                <InputGroup label="Phone Number" name="phone" value={form.phone} onChange={handleChange} icon={<Phone size={18}/>} />
                <InputGroup label="Date of Birth" name="DOB" value={form.DOB} onChange={handleChange} icon={<Calendar size={18}/>} type="date" />
                
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                   <select name="gender" value={form.gender} onChange={handleChange} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                   </select>
                </div>

                <SectionTitle title="Professional Information" className="md:col-span-2 mt-4" />
                <InputGroup label="Employee ID *" name="employee_id" value={form.employee_id} onChange={handleChange} icon={<ShieldCheck size={18}/>} type="number" />
                <InputGroup label="Joining Date *" name="joining_date" value={form.joining_date} onChange={handleChange} icon={<Calendar size={18}/>} type="datetime-local" />
                <InputGroup label="Qualification *" name="qualification" value={form.qualification} onChange={handleChange} icon={<Award size={18}/>} />
                <InputGroup label="Salary (Monthly)" name="salary" value={form.salary} onChange={handleChange} icon={<IndianRupee size={18}/>} type="number" />
                <InputGroup label="Exp (Years)" name="years_of_experience" value={form.years_of_experience} onChange={handleChange} icon={<Briefcase size={18}/>} type="number" />
                <InputGroup label="Department ID" name="department_id" value={form.department_id} onChange={handleChange} icon={<Users size={18}/>} type="number" />
                <InputGroup label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} icon={<Plus size={18}/>} className="md:col-span-2" />
                <InputGroup label="ID Proof URL" name="id_proof_url" value={form.id_proof_url} onChange={handleChange} icon={<FileText size={18}/>} className="md:col-span-2" />
              </div>

              {/* Action Sidebar */}
              <div className="lg:col-span-4">
                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 sticky top-8">
                  <h4 className="text-sm font-black text-slate-800 mb-6">Enrollment Overview</h4>
                  <div className="space-y-4 mb-8">
                    <StatusItem label="Directory Status" value="Ready to Sync" color="text-blue-600" />
                    <StatusItem label="Employee ID" value={form.employee_id || "Pending"} color="text-slate-600" />
                  </div>
                  <button type="submit" disabled={saving} className="w-full bg-[#1E293B] text-white py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all">
                    {saving ? "Saving Data..." : <><Save size={18}/> {form.id ? "Update Profile" : "Register Faculty"}</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* FACULTY LIST (GRID STYLE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((t) => (
            <div key={t.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black">
                    {t.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedTeacher(t)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Eye size={18}/></button>
                    <button onClick={() => handleEdit(t)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={18}/></button>
                  </div>
               </div>
               
               <h4 className="text-xl font-black text-slate-800 tracking-tight">{t.fullname}</h4>
               <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{t.specialization || "Faculty Member"}</p>
               
               <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                  <InfoRow label="Employee ID" value={t.employee_id} />
                  <InfoRow label="Department" value={t.department_id || "General"} />
                  <InfoRow label="Experience" value={`${t.years_of_experience || 0} Years`} />
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED VIEW MODAL */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedTeacher(null)}>
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 relative overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedTeacher(null)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X size={24}/></button>
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
                <DetailItem label="Employee ID" value={selectedTeacher.employee_id} />
                <DetailItem label="Qualification" value={selectedTeacher.qualification} />
                <DetailItem label="Salary" value={`₹${selectedTeacher.salary}`} />
                <DetailItem label="Experience" value={`${selectedTeacher.years_of_experience} Yrs`} />
                <DetailItem label="Joining Date" value={new Date(selectedTeacher.joining_date).toLocaleDateString()} />
                <DetailItem label="Phone" value={selectedTeacher.phone} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Components
function InputGroup({ label, icon, className, ...props }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative flex items-center group">
        <div className="absolute left-4 text-slate-300 group-focus-within:text-blue-500 transition-colors">{icon}</div>
        <input {...props} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
      </div>
    </div>
  );
}

function SectionTitle({ title, className }) {
  return <h4 className={`${className} text-xs font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2`}>{title}</h4>;
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

function FileText(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
}