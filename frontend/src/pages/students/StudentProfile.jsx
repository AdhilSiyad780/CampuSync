import { useEffect, useState } from "react";
import { 
  User, Mail, Phone, MapPin, Calendar, 
  GraduationCap, ShieldCheck, Edit, Camera,
  ArrowLeft, PhoneCall, HeartPulse, Award,
  FileText, Upload, Plus, ChevronRight, X, Save
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function StudentProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize state for the unified serializer data
  const [profile, setProfile] = useState({
    fullname: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",
    section:"",
    admission_number: "", // Read-only from StudentProfile
    blood_group: "",      // From StudentProfile
    guardian_name: "",    // From StudentProfile
    guardian_number: "",  // From StudentProfile
    roll_number: "",      // From StudentProfile
    student_contact: "",   // From StudentProfile
    documents: []
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // ---------- LOAD PROFILE ----------
  const loadProfile = async () => {
    setLoading(true);
    try {
      // Endpoint that uses the Unified Student Serializer
      const res = await api.get("student/profile/");
      setProfile(res.data);
    } catch (err) {
      console.error("LOAD ERROR:", err.response?.data);
      if (err.response?.status === 401) {
        navigate("/login");
      }
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- SAVE PROFILE ----------
  const handleSave = async () => {
  setSaving(true);
  setError("");
  setSuccess("");

  try {
    // Filter out empty/null values before sending
    const cleanedProfile = Object.entries(profile).reduce((acc, [key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const res = await api.put("student/profile/", cleanedProfile);
    setProfile(res.data);
    setSuccess("Profile updated successfully!");
    setIsEditing(false);
  } catch (err) {
    console.error("SAVE ERROR:", err.response?.data);
    setError("Update failed. Please check your information.");
  } finally {
    setSaving(false);
  }
};
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
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
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Dashboard <ChevronRight size={14} /> <span className="text-indigo-600 font-medium">Student Profile</span>
            </p>
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-70 transition-all"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ALERTS */}
        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">{success}</div>}
        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: IDENTITY */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <img 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile.fullname}`} 
                  alt="Avatar" 
                  className="w-full h-full rounded-3xl bg-slate-100 border-4 border-white shadow-md"
                />
              </div>
              <h2 className="text-xl font-black text-slate-800">{profile.fullname}</h2>
              <p className="text-sm text-slate-500 font-medium italic">ID: {profile.admission_number}</p>
              
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-indigo-100">Roll No: {profile.roll_number}</span>
                <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase border border-emerald-100">Status: Active</span>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-indigo-600" /> Documents</h3>
              <div className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center">
                <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No documents uploaded</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FIELDS */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-8 pb-4 border-b border-slate-100 flex items-center gap-2">
                <User size={20} className="text-indigo-600" /> Information Detail
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6">
                <EditableItem 
  label="Section" 
  name="section" 
  value={profile.section} 
  icon={<GraduationCap size={16} />} 
  isEditing={isEditing} 
  onChange={handleChange} 
/>
                <EditableItem label="Full Name" name="fullname" value={profile.fullname} icon={<User size={16} />} isEditing={isEditing} onChange={handleChange} />
                <EditableItem label="Email (Login ID)" name="email" value={profile.email} icon={<Mail size={16} />} isEditing={false} /> {/* Email usually read-only */}
                <EditableItem label="Date of Birth" name="DOB" value={profile.DOB} type="date" icon={<Calendar size={16} />} isEditing={isEditing} onChange={handleChange} />
                <EditableItem label="Gender" name="gender" value={profile.gender} icon={<User size={16} />} isEditing={isEditing} onChange={handleChange} isSelect options={['male', 'female', 'other']} />
                <EditableItem label="Blood Group" name="blood_group" value={profile.blood_group} icon={<HeartPulse size={16} />} isEditing={isEditing} onChange={handleChange} />
                <EditableItem label="Contact Number" name="phone" value={profile.phone} icon={<Phone size={16} />} isEditing={isEditing} onChange={handleChange} />
                <EditableItem label="Guardian Name" name="guardian_name" value={profile.guardian_name} icon={<User size={16} />} isEditing={isEditing} onChange={handleChange} />
                <EditableItem label="Guardian Contact" name="guardian_number" value={profile.guardian_number} icon={<PhoneCall size={16} />} isEditing={isEditing} onChange={handleChange} />
                <EditableItem label="Roll Number" name="roll_number" value={profile.roll_number} icon={<FileText size={16} />} isEditing={isEditing} onChange={handleChange} />
                <EditableItem label="Student Contact" name="student_contact" value={profile.student_contact} icon={<Phone size={16} />} isEditing={isEditing} onChange={handleChange} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ---------- HELPER COMPONENT FOR EDITABLE FIELDS ----------
function EditableItem({ label, name, value, icon, isEditing, onChange, type="text", isSelect=false, options=[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg border border-slate-100">
          {icon}
        </div>
        {isEditing ? (
          isSelect ? (
            <select
              name={name}
              value={value}
              onChange={onChange}
              className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all"
            >
              {options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            </select>
          ) : (
            <input
              type={type}
              name={name}
              value={value || ""}
              onChange={onChange}
              className="w-full border border-indigo-100 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          )
        ) : (
          <p className="font-bold text-sm text-slate-700">{value || "Not Provided"}</p>
        )}
      </div>
    </div>
  );
}