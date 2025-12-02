// frontend/src/pages/school/AdminLoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../api/axios";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  // ---------------- GOOGLE LOGIN ----------------
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
      const needsSetup = res.data.needs_setup ?? !user.is_setup_complete;

      if (needsSetup) {
        // new / incomplete Google user -> go to registration page
        navigate("/signup/complete", {
          state: {
            fromGoogle: true,
            email: emailFromGoogle,
            fullname: fullnameFromGoogle,
          },
        });
      } else {
        // existing fully-setup user -> go straight to dashboard
        navigate("/dashboard");
      }
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

  // ---------------- EMAIL + PASSWORD LOGIN ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/login/", {
        email: trimmedEmail,
        password,
      });

      // store tokens + basic user state
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      console.log(res.data.access,'==========================================')
      localStorage.setItem(
        "is_setup_complete",
        String(res.data.user.is_setup_complete)
      );

      // optional: store user/tenant in localStorage or Redux
      localStorage.setItem("admin_email", res.data.user.email);
      localStorage.setItem("admin_fullname", res.data.user.fullname);

      if (res.data.needs_setup) {
        // user exists but hasn't finished setup
        navigate("/signup/complete", {
          state: {
            fromGoogle: false,
            fromLogin: true,
            email: res.data.user.email,
            fullname: res.data.user.fullname,
          },
        });
      } else {
        // normal case → go to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      const data = err.response?.data;

      if (typeof data === "string") {
        setErrorMsg(data);
      } else if (data?.non_field_errors) {
        setErrorMsg(data.non_field_errors[0]);
      } else if (data?.detail) {
        setErrorMsg(data.detail);
      } else {
        setErrorMsg("Login failed. Check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-center text-slate-800 mb-2">
          Admin Login
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Sign in with your admin email and password, or use Google.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

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
            {loading ? "Logging in..." : "Login"}
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

        {/* Small footer */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <span>Don&apos;t have an account? </span>
          <Link
            to="/"
            className="text-blue-600 hover:underline font-medium"
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
