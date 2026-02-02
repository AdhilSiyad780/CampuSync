import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  User, Mail, Phone, MapPin, School, 
  ArrowRight, ChevronRight, AlertCircle, Building2, Save
} from "lucide-react";
import api from "../../api/axios";

function AdminSignupComplete() {
  const location = useLocation();
  const navigate = useNavigate();
  

  // Incoming state from previous step
  const verifiedEmail = location.state?.email || "";
  const initialFullname = location.state?.fullname || "";
  const hasValidEntry = Boolean(localStorage.getItem("access"));

  const [formData, setFormData] = useState({
    email: verifiedEmail,
    fullname: initialFullname,
    phone: "",
    instance_name: "",
    tenant_email: "",
    tenant_phone: "",
    tenant_address: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!hasValidEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-[2.5rem] p-10 text-center border border-slate-100">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Invalid Session</h2>
          <p className="text-sm text-slate-500 mb-8 font-medium">Your signup session has expired or is invalid. Please verify your email again.</p>
          <div className="flex flex-col gap-3">
            <Link to="/signup" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Restart Signup</Link>
            <Link to="/login" className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!formData.instance_name.trim()) {
      setErrorMsg("Institute name is required to create your workspace.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/signup/", {
        fullname: formData.fullname.trim(),
        phone: formData.phone.trim(),
        instance_name: formData.instance_name.trim(),
        tenant_email: formData.tenant_email.trim() || formData.email.trim(),
        tenant_phone: formData.tenant_phone.trim(),
        tenant_address: formData.tenant_address.trim(),
      });
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      setErrorMsg(data?.detail || (data && data[Object.keys(data)[0]][0]) || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden border border-slate-100 flex flex-col md:flex-row">
        
        {/* LEFT DECORATIVE PANEL */}
        <div className="w-full md:w-1/3 bg-[#1E293B] p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 p-12 opacity-10"><Building2 size={200} /></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black leading-tight">Complete Your Setup</h2>
            <p className="text-slate-400 text-sm mt-4 font-medium">Finalize your profile and define your institution's identity to launch your CampuSync workspace.</p>
          </div>
          <div className="relative z-10 space-y-4">
            <StepIndicator step="1" title="Email Verified" completed />
            <StepIndicator step="2" title="Account Details" active />
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="flex-1 p-8 md:p-12">
          <div className="mb-10">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Registration Details</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Provide your credentials and institute information.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* ADMIN DETAILS SECTION */}
              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Admin Profile</h4>
                <InputGroup label="Personal Email" value={formData.email} disabled icon={<Mail size={18}/>} />
                <InputGroup label="Full Name" name="fullname" value={formData.fullname} onChange={handleChange} icon={<User size={18}/>} placeholder="Full legal name" />
                <InputGroup label="Mobile Phone" name="phone" value={formData.phone} onChange={handleChange} icon={<Phone size={18}/>} placeholder="+1 (555) 000-0000" />
              </div>

              {/* INSTITUTE DETAILS SECTION */}
              <div className="space-y-5">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Institute Profile</h4>
                <InputGroup label="Institute Name" name="instance_name" value={formData.instance_name} onChange={handleChange} icon={<School size={18}/>} placeholder="Green Valley Academy" />
                <InputGroup label="Office Email" name="tenant_email" value={formData.tenant_email} onChange={handleChange} icon={<Mail size={18}/>} placeholder="office@school.com" />
                <InputGroup label="Office Phone" name="tenant_phone" value={formData.tenant_phone} onChange={handleChange} icon={<Phone size={18}/>} placeholder="Institutional contact" />
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Office Address</label>
                  <div className="relative flex items-start">
                    <MapPin className="absolute left-4 top-4 text-slate-300" size={18} />
                    <textarea name="tenant_address" value={formData.tenant_address} onChange={handleChange} rows="2" className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="Full mailing address"/>
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {loading ? "Finalizing..." : <><Save size={18}/> Complete Setup</>}
              </button>
              <button type="button" onClick={() => navigate("/dashboard")} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all">
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function InputGroup({ label, icon, disabled, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-300">{icon}</div>
        <input {...props} disabled={disabled} className={`w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none transition-all ${disabled ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-100 text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'}`} />
      </div>
    </div>
  );
}

function StepIndicator({ step, title, active, completed }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${completed ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'bg-slate-800 text-slate-500'}`}>{step}</div>
      <span className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-500'}`}>{title}</span>
    </div>
  );
}

export default AdminSignupComplete;