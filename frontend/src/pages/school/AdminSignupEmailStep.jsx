import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { 
  Mail, Lock, ShieldCheck, ArrowRight, 
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2 
} from "lucide-react";
import api from "../../api/axios";

function AdminSignupEmailStep() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [otpExpiresIn, setOtpExpiresIn] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const navigate = useNavigate();

  // STEP 1: EMAIL + PASSWORD -> SEND OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/signup/send-otp/", { email: email.trim() });
      setIsOtpSent(true);
      setSuccessMsg("Verification code sent to your email.");
      const expires = res.data?.expires_in ?? 300;
      setOtpExpiresIn(expires);
      setTimeLeft(expires);
    } catch (err) {
      setErrorMsg(err.response?.data?.email?.[0] || err.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: VERIFY OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");

    try {
      setLoading(true);
      const res = await api.post("/signup/verify-otp/", {
        email: email.trim(),
        password: password,
        confirm_password: confirmPassword,
        otp: otp.trim(),
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/signup/complete", { state: { email: email.trim(), fromGoogle: false } });
    } catch (err) {
      setErrorMsg("Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE HANDLER
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await api.post("/auth/google-login/", { credential: credentialResponse.credential });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/signup/complete", { 
        state: { fromGoogle: true, email: res.data.user.email, fullname: res.data.user.fullname } 
      });
    } catch (err) {
      setErrorMsg("Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  // COUNTDOWN EFFECT
  useEffect(() => {
    if (!isOtpSent || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [isOtpSent, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-md bg-white shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden border border-slate-100">
        
        {/* TOP BANNER */}
        <div className="bg-blue-600 p-8 text-white">
          <h2 className="text-2xl font-black tracking-tight">Create Admin Account</h2>
          <p className="text-blue-100 text-xs font-bold mt-2 flex items-center gap-2 uppercase tracking-widest">
            Step 01 <ChevronRight size={14} /> Email Verification
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-5">
            
            {/* EMAIL INPUT */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-slate-300" size={18} />
                <input
                  disabled={isOtpSent}
                  type="email"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                />
              </div>
            </div>

            {/* PASSWORD INPUTS (Hidden if OTP is sent to focus on OTP) */}
            {!isOtpSent && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 text-slate-300" size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 text-slate-300" size={18} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* OTP INPUT */}
            {isOtpSent && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verification Code</label>
                <div className="relative flex items-center">
                  <ShieldCheck className="absolute left-4 text-blue-500" size={18} />
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-black text-blue-600 tracking-[0.5em] outline-none"
                  />
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className={`text-[10px] font-bold ${timeLeft > 0 ? 'text-slate-400' : 'text-red-500'}`}>
                    {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : "Code expired"}
                  </span>
                  <button type="button" onClick={handleSendOtp} className="text-[10px] font-black text-blue-600 uppercase hover:underline flex items-center gap-1">
                    <RefreshCw size={10} /> Resend
                  </button>
                </div>
              </div>
            )}

            {errorMsg && <p className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-xl border border-red-100"><AlertCircle size={14}/> {errorMsg}</p>}
            {successMsg && <p className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-xl border border-emerald-100"><CheckCircle2 size={14}/> {successMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : isOtpSent ? "Verify & Continue" : "Send Verification Code"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* GOOGLE DIVIDER */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Social Signup</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setErrorMsg("Google Signup Failed")} />
          </div>

          <p className="mt-8 text-center text-xs font-bold text-slate-400">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminSignupEmailStep;