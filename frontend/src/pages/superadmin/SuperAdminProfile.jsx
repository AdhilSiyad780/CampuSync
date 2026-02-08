import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { User, Camera, Mail, Save, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SuperAdminProfile() {
  const [profile, setProfile] = useState(null);
  const [fullname, setFullname] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Dynamically get the base URL for images
  const backendBase = api.defaults.baseURL.replace('/api', '');

  useEffect(() => {
    loadProfile();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("superadmin/profile/");
      setProfile(res.data);
      setFullname(res.data.fullname || "");
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access Denied: Redirecting...");
        setTimeout(() => navigate("/"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setProfilePic(file);
    setSuccess("");
    setError("");

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullname.trim()) {
      setError("Full name is required.");
      return;
    }

    const form = new FormData();
    form.append("fullname", fullname.trim());
    if (profilePic) form.append("profile_picture", profilePic);

    setSaving(true);
    try {
      const res = await api.patch("superadmin/profile/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(res.data);
      setSuccess("Profile updated successfully!");
      setProfilePic(null);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  const backendImageSrc = profile?.profile_picture 
    ? (profile.profile_picture.startsWith('http') ? profile.profile_picture : `${backendBase}${profile.profile_picture}`)
    : null;

  const currentImageSrc = previewUrl || backendImageSrc;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Decorative Header */}
          <div className="h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 flex items-end p-8">
            <h2 className="text-white text-3xl font-extrabold tracking-tight">System Administrator</h2>
          </div>

          <div className="px-6 lg:px-12 pb-12">
            <div className="relative -mt-20 mb-10 flex flex-col items-center sm:flex-row sm:items-end sm:gap-8">
              {/* Profile Avatar Container */}
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl border-8 border-white bg-slate-100 overflow-hidden shadow-2xl relative">
                  {currentImageSrc ? (
                    <img src={currentImageSrc} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <User size={64} />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 rounded-2xl shadow-xl cursor-pointer hover:bg-indigo-700 transition-all border-4 border-white text-white group-hover:scale-110">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>

              <div className="mt-6 text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                   <h1 className="text-3xl font-black text-slate-900 leading-none">{profile.fullname || "Administrator"}</h1>
                   <ShieldCheck className="text-indigo-500" size={24} />
                </div>
                <p className="text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                  <Mail size={18} className="text-slate-400" /> {profile.email}
                </p>
              </div>
            </div>

            {/* Notification Toasts */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg flex items-center gap-3 animate-pulse">
                <AlertCircle size={20} /> <span className="font-semibold">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-8 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 rounded-lg flex items-center gap-3">
                <CheckCircle2 size={20} /> <span className="font-semibold">{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Primary Settings */}
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Full Identity Name</label>
                  <input
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 text-slate-900 font-semibold rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Primary Email</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile.email}
                      disabled
                      className="w-full px-5 py-4 bg-slate-100 text-slate-400 font-medium rounded-2xl border border-slate-200 cursor-not-allowed italic"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                       <ShieldCheck size={18} />
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-slate-400 font-medium bg-slate-50 p-2 rounded-lg">Email addresses are globally unique and cannot be modified.</p>
                </div>
              </div>

              {/* Status & Stats Card */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl shadow-indigo-200">
                <div>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Security Overview
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <span className="text-slate-400 text-sm font-medium">Account Access</span>
                      <span className="text-emerald-400 font-bold tracking-wide uppercase text-xs px-2 py-1 bg-emerald-400/10 rounded-md border border-emerald-400/20">Active</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <span className="text-slate-400 text-sm font-medium">Last Session</span>
                      <span className="text-slate-200 text-sm font-bold">{profile.last_login ? new Date(profile.last_login).toLocaleDateString() : "New Account"}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <span className="text-slate-400 text-sm font-medium">Privilege Tier</span>
                      <span className="text-indigo-300 font-black italic text-sm">{profile.user_type?.toUpperCase() || 'SUPER_USER'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-10 w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-4 px-6 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait"
                >
                  {saving ? (
                    <div className="h-6 w-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save size={22} /> Push Account Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}