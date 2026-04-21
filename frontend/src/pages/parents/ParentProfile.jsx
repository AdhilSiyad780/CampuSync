import { useEffect, useState } from "react";
import { 
  User, Mail, Phone, Calendar, Camera, 
  ChevronRight, Save, Edit, Heart, MessageSquare, 
  ShieldCheck, GraduationCap, Link as LinkIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Backarrow } from "../../componets/Backarrow";

export default function ParentProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullname: "",
    email: "", 
    phone: "",
    DOB: "",
    gender: "",
    whatsapp_number: "",
    profile_picture: null,
    // Relations is now an array of student objects
    relations: [], 
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("parent/profile/");
      const data = res.data;
      setForm({
        fullname: data.fullname || "",
        email: data.email || "",
        phone: data.phone || "",
        DOB: data.DOB || "",
        gender: data.gender || "",
        whatsapp_number: data.whatsapp_number || "",
        profile_picture: data.profile_picture || null,
        relations: data.relations || [], // Expected: [{ student_name: "Jorge", relation_type: "father" }]
      });
    } catch (err) {
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("parent/profile/", form);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  console.log(form)
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <Backarrow/>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Parent Account</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Dashboard <ChevronRight size={14} /> <span className="text-blue-600 font-bold font-bold">Manage Profile</span>
            </p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 flex items-center gap-2">
                  <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 flex items-center gap-2">
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PERSONAL INFO CARD */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex items-center gap-6 mb-10">
                <div className="relative">
                  <img 
                    src={form.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${form.fullname}`} 
                    className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-white shadow-md object-cover" 
                    alt="Profile"
                  />
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg cursor-pointer">
                      <Camera size={14} />
                      <input type="file" className="hidden" />
                    </label>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">{form.fullname || "Parent Name"}</h3>
                  <p className="text-sm text-slate-400 font-medium">{form.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                <ProfileField label="Full Name" name="fullname" value={form.fullname} icon={<User size={18}/>} isEditing={isEditing} onChange={handleChange} />
                <ProfileField label="Phone Number" name="phone" value={form.phone} icon={<Phone size={18}/>} isEditing={isEditing} onChange={handleChange} />
                <ProfileField label="WhatsApp" name="whatsapp_number" value={form.whatsapp_number} icon={<MessageSquare size={18}/>} isEditing={isEditing} onChange={handleChange} />
                <ProfileField label="Date of Birth" name="DOB" value={form.DOB} type="date" icon={<Calendar size={18}/>} isEditing={isEditing} onChange={handleChange} />
                <ProfileField label="Gender" name="gender" value={form.gender} icon={<User size={18}/>} isEditing={isEditing} onChange={handleChange} isSelect options={['male', 'female', 'other']} />
              </div>
            </div>
          </div>

          {/* LINKED STUDENTS SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#1E293B] rounded-[2.5rem] p-8 text-white shadow-xl">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400">
                <GraduationCap size={20} /> Linked Students
              </h3>
              
              <div className="space-y-4">
                {form.relations.length > 0 ? (
                  form.relations.map((rel, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-black">
                        {rel.student_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{rel.student_name}</p>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{rel.relation_type}</p>
                      </div>
                      {rel.is_primary && (
                        <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg" title="Primary Guardian">
                          <ShieldCheck size={14} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No students linked to this account.</p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  To link another student or change relations, please contact the <span className="text-blue-400 font-bold">School Administration</span>.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value, icon, isEditing, onChange, name, type="text", isSelect, options }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-100">{icon}</div>
        {isEditing ? (
          isSelect ? (
            <select name={name} value={value} onChange={onChange} className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none">
              <option value="">Select</option>
              {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
          ) : (
            <input name={name} type={type} value={value} onChange={onChange} className="w-full bg-white border border-blue-100 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none" />
          )
        ) : (
          <p className="font-bold text-sm text-slate-700">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}