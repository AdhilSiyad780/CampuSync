import { useEffect, useState } from "react";
import { 
  User, Mail, Phone, Calendar, 
  BookOpen, Briefcase, Camera, ArrowLeft, 
  ChevronRight, Edit, Save, X, Award, ShieldCheck, GraduationCap, Link as LinkIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function TeacherProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",
    employee_id: "",
    joining_date: "",
    qualification: "",
    specialization: "",
    years_of_experience: "",
    id_proof_url: "",
  });

  const user = JSON.parse(localStorage.getItem('user'))
  if (user?.user_type !== 'teacher') {
     navigate('/teacher/login')
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("teacher/profile/");
      const data = res.data || {};
      setForm({
        ...data,
        DOB: data.DOB ? data.DOB.split("T")[0] : "",
        joining_date: data.joining_date ? data.joining_date.split("T")[0] : "",
      });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
      }
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("teacher/profile/", form);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Teacher Profile</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Dashboard <ChevronRight size={14} /> <span className="text-blue-600 font-bold">Profile</span>
            </p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSubmit} disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700">
                  {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700">
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">{success}</div>}
        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">{error}</div>}

        {/* HERO SECTION */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
          <div className="px-8 pb-8 -mt-12">
            <div className="flex flex-col md:flex-row items-end gap-6">
              <div className="relative group">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${form.fullname}`} className="w-32 h-32 rounded-3xl bg-white border-4 border-white shadow-xl" alt="Avatar"/>
                <button className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg"><Camera size={16}/></button>
              </div>
              <div className="flex-1 pb-2">
                <h2 className="text-3xl font-black text-slate-800">{form.fullname || "Teacher Name"}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full border border-blue-100 tracking-wider">ID: {form.employee_id || "N/A"}</span>
                  <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-black uppercase rounded-full border border-slate-200 tracking-wider">{form.specialization || "Faculty"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PERSONAL INFO */}
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2 border-b border-slate-50 pb-4">
              <User size={20} className="text-blue-600" /> Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
              <ProfileItem label="Full Name" name="fullname" value={form.fullname} icon={<User size={16}/>} isEditing={isEditing} onChange={handleChange} />
              <ProfileItem label="Email Address" name="email" value={form.email} icon={<Mail size={16}/>} isEditing={false} />
              <ProfileItem label="Phone Number" name="phone" value={form.phone} icon={<Phone size={16}/>} isEditing={isEditing} onChange={handleChange} />
              <ProfileItem label="Date of Birth" name="DOB" value={form.DOB} type="date" icon={<Calendar size={16}/>} isEditing={isEditing} onChange={handleChange} />
              <ProfileItem label="Gender" name="gender" value={form.gender} icon={<User size={16}/>} isEditing={isEditing} onChange={handleChange} isSelect options={['male', 'female', 'other']} />
              <ProfileItem label="Qualification" name="qualification" value={form.qualification} icon={<GraduationCap size={16}/>} isEditing={isEditing} onChange={handleChange} />
              <ProfileItem label="ID Proof Link" name="id_proof_url" value={form.id_proof_url} icon={<LinkIcon size={16}/>} isEditing={isEditing} onChange={handleChange} isFullWidth />
            </div>
          </div>

          {/* CAREER SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#1E293B] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Briefcase size={80}/></div>
               <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-blue-400">
                <ShieldCheck size={20} /> Career Info
              </h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Experience</p>
                  <p className="text-2xl font-black">{form.years_of_experience || "0"} Years</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Joining Date</p>
                  <p className="text-xl font-bold text-blue-200">{form.joining_date || "N/A"}</p>
                </div>
                <div className="pt-6 border-t border-slate-700">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <Award size={14} className="text-amber-400" /> Senior Faculty Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ label, value, icon, isEditing, onChange, name, type="text", isSelect, options, isFullWidth }) {
  return (
    <div className={`space-y-2 ${isFullWidth ? 'md:col-span-2' : ''}`}>
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{label}</p>
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100">{icon}</div>
        {isEditing ? (
          isSelect ? (
            <select name={name} value={value} onChange={onChange} className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select</option>
              {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
          ) : (
            <input name={name} type={type} value={value} onChange={onChange} className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />
          )
        ) : (
          <p className="font-bold text-sm text-slate-700">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}