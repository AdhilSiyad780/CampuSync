import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { 
  Mail, Lock, LogIn, ChevronRight, 
  AlertCircle, ShieldCheck, ArrowRight 
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const {checkAuth} = useAuth()
  const navigate = useNavigate();

  // ---------------- GOOGLE LOGIN ----------------
  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg("");
    try {
      setLoading(true);
      const res = await api.post("/auth/google-login/", {
        credential: credentialResponse.credential,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      const user = res.data.user || {};
      const needsSetup = res.data.needs_setup ?? !user.is_setup_complete;

      if (needsSetup) {
        navigate("/signup/complete", {
          state: { fromGoogle: true, email: user.email, fullname: user.fullname },
        });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setErrorMsg("Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EMAIL + PASSWORD LOGIN ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      console.log('reached admin login')
      const res = await api.post("/login/", { email: email.trim(), password });
      const userData = res.data?.user;
      console.log(userData.user_type)
      await checkAuth()
      if (!userData) {
        setError("Invalid response from server.");
        return;
      }
     
      localStorage.setItem("is_setup_complete", String(res.data.user.is_setup_complete));
      localStorage.setItem("admin_fullname", res.data.user.fullname);

      if (res.data.needs_setup) {
        navigate("/signup/complete", {
          state: { fromLogin: true, email: res.data.user.email, fullname: res.data.user.fullname },
        });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const data = err.response?.data;
      console.log(err.response?.data)
      setErrorMsg(data?.detail || data?.non_field_errors?.[0] || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md bg-white shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden border border-slate-100">
        
        {/* BRAND BANNER */}
        <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <ShieldCheck size={120} />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Admin Portal</h2>
          <p className="text-blue-100 text-[10px] font-black mt-2 uppercase tracking-widest flex items-center gap-2">
            CampuSync <ChevronRight size={12} /> Secure Login
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-slate-300" size={18} />
                <input
                  type="email"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <Link to="/forgot-password" size={10} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Forgot?</Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-slate-300" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={14}/> {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>

          {/* SOCIAL LOGIN */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Single Sign-on</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setErrorMsg("Google Login Failed")}
              theme="outline"
              shape="pill"
            />
          </div>

          <p className="mt-8 text-center text-xs font-bold text-slate-400">
            Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Register School</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;