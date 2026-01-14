// frontend/src/pages/school/AdminSignupEmailStep.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
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

  // OTP timer
  const [otpExpiresIn, setOtpExpiresIn] = useState(null); // seconds from backend
  const [timeLeft, setTimeLeft] = useState(0);            // seconds counting down

  const navigate = useNavigate();

  // STEP 1: EMAIL + PASSWORD -> SEND OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMsg("Email is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg("Enter a valid email.");
      return;
    }

    if (!password.trim()) {
      setErrorMsg("Password is required.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/signup/send-otp/", {
        email: trimmedEmail,
      });

      setIsOtpSent(true);
      setSuccessMsg(
        "OTP has been sent to your email (valid for a few minutes)."
      );

      // backend should optionally send { expires_in: seconds }
      const expires = res.data?.expires_in ?? 300; // default 5 minutes
      setOtpExpiresIn(expires);
      setTimeLeft(expires);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.email) {
        setErrorMsg(err.response.data.email[0]);
      } else if (err.response?.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: EMAIL + OTP -> VERIFY OTP -> GO TO REGISTRATION PAGE
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = email.trim();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail || !trimmedOtp) {
      setErrorMsg("Email and OTP are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/signup/verify-otp/", {
        email: trimmedEmail,
        password: password,
        confirm_password: confirmPassword,
        otp: trimmedOtp,
      });

   

      setSuccessMsg("OTP verified successfully.");
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // Go to registration (complete) page
      navigate("/signup/complete", {
        state: {
          email: trimmedEmail,
          fromGoogle: false,
        },
      });
    } catch (err) {
      console.error(err);
      if (err.response?.data?.non_field_errors) {
        setErrorMsg(err.response.data.non_field_errors[0]);
      } else if (typeof err.response?.data === "string") {
        setErrorMsg(err.response.data);
      } else {
        const data = err.response?.data;
        const firstKey = data && Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey])) {
          setErrorMsg(data[firstKey][0]);
        } else {
          setErrorMsg("OTP verification failed. Check email/OTP.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE HANDLERS
  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      setLoading(true);

      const res = await api.post("/auth/google-login/", {
        credential: credentialResponse.credential,
      });

      // store JWTs
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      const user = res.data.user || {};
      const emailFromGoogle = user.email || "";
      const fullnameFromGoogle = user.fullname || "";

      // Go to registration page (no password needed for Google)
      navigate("/signup/complete", {
        state: {
          fromGoogle: true,
          email: emailFromGoogle,
          fullname: fullnameFromGoogle,
        },
      });
    } catch (err) {
      console.error(err);
      console.log("GOOGLE LOGIN ERROR DATA:", err.response?.data);
      setErrorMsg(
        err.response?.data?.detail || "Google login failed. Please try again."
      );
      
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg("Google login was cancelled or failed.");
  };

  // COUNTDOWN EFFECT
  useEffect(() => {
    if (!isOtpSent || otpExpiresIn == null) return;

    setTimeLeft(otpExpiresIn);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOtpSent, otpExpiresIn]);

  // RESEND OTP
  const handleResendOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Email is missing.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/signup/send-otp/", {
        email: trimmedEmail,
      });

      setSuccessMsg("A new OTP has been sent to your email.");
      const expires = res.data?.expires_in ?? 300;
      setOtpExpiresIn(expires);
      setTimeLeft(expires);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.email) {
        setErrorMsg(err.response.data.email[0]);
      } else if (err.response?.data?.detail) {
        setErrorMsg(err.response.data.detail);
      } else {
        setErrorMsg("Could not resend OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading;

  // helper: format seconds to mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-center text-slate-800 mb-2">
          Admin Signup
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Create your account with email + password or use Google. For email,
          verify with OTP before completing registration.
        </p>

        <form
          onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp}
          className="space-y-4"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isOtpSent}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isOtpSent}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirm_password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isOtpSent}
            />
          </div>

          {/* OTP input appears only after OTP is sent */}
          {isOtpSent && (
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                OTP
              </label>
              <input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />

              {/* Timer + Resend section */}
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-slate-500">
                  {timeLeft > 0
                    ? `OTP expires in ${formatTime(timeLeft)}`
                    : "OTP expired."}
                </span>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timeLeft > 0 || loading}
                  className={`text-blue-600 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            {isSubmitting
              ? isOtpSent
                ? "Verifying OTP..."
                : "Sending OTP..."
              : isOtpSent
              ? "Verify OTP"
              : "Send OTP"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 uppercase tracking-wide">
            Or
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Google Login */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminSignupEmailStep;
