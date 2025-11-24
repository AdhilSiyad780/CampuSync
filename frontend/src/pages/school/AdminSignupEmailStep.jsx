// frontend/src/pages/school/AdminSignupEmailStep.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function AdminSignupEmailStep() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Enter a valid email");
      return;
    }

    try {
      setLoading(true);

      await api.post("/signup/send-otp/", {
        email: email.trim(),
      });

      setIsOtpSent(true);
      setSuccessMsg("OTP has been sent to your email (valid for few minutes).");
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim() || !otp.trim()) {
      setErrorMsg("Email and OTP are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/signup/verify-otp/", {
        email: email.trim(),
        otp: otp.trim(),
        
      });

      const { signup_token } = res.data;

      setSuccessMsg("OTP verified successfully.");

      // Go to details page, pass email + signupToken
      navigate("signup/complete", {
        state: { email: email.trim(), signupToken: signup_token },
      });
    } catch (err) {
      console.error(err);
      if (err.response?.data?.non_field_errors) {
        setErrorMsg(err.response.data.non_field_errors[0]);
      } else if (typeof err.response?.data === "string") {
        setErrorMsg(err.response.data);
      } else {
        const firstKey = err.response && Object.keys(err.response.data)[0];
        if (firstKey && Array.isArray(err.response.data[firstKey])) {
          setErrorMsg(err.response.data[firstKey][0]);
        } else {
          setErrorMsg("OTP verification failed. Check email/OTP.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-center text-slate-800 mb-2">
          Admin Signup
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Enter your email to receive an OTP, then verify it to continue.
        </p>

        <form
          onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp}
          className="space-y-4"
        >
          {/* Email input */}
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
              disabled={isOtpSent} // lock after OTP sent
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
              <p className="text-xs text-slate-400 mt-1">
                Haven&apos;t received it? Check spam or resend after some time (you can add resend later).
              </p>
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
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            {loading
              ? isOtpSent
                ? "Verifying OTP..."
                : "Sending OTP..."
              : isOtpSent
              ? "Verify OTP"
              : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminSignupEmailStep;
