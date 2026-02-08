// frontend/src/pages/school/StudentLoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function StudentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ FIX: Destructure checkAuth from the hook
  const { checkAuth, user: contextUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    console.log("🚀 [Login] Starting student login for:", email.trim());

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/student/login/", {
        email: trimmedEmail,
        password,
      });

      console.log("📡 [Server] Response received:", res.data);

      if (!res.data.user) {
        console.error("⚠️ [Logic] Login successful but no user data found in response!");
      }

      // 1. Sync LocalStorage
      console.log("💾 [Storage] Saving student data to localStorage...");
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("student_fullname", res.data.user.fullname);

      // 2. Sync Context
      console.log("🔄 [Context] Triggering checkAuth() to update global state...");
      await checkAuth();
      
      // 3. Verify before navigating
      console.log("🛡️ [Verify] Current Context User:", contextUser);

      console.log("✅ [Navigation] Success. Moving to /student/dashboard");
      navigate("/student/dashboard");

    } catch (err) {
      // LOG THE FULL ERROR OBJECT
      console.group("❌ [Login Error]");
      console.error("Status:", err.response?.status);
      console.error("Data:", err.response?.data);
      console.error("Message:", err.message);
      console.groupEnd();

      const data = err.response?.data;
      if (typeof data === "string") {
        setErrorMsg(data);
      } else if (data?.detail) {
        setErrorMsg(data.detail);
      } else {
        setErrorMsg("Login failed. Check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of your return JSX stays the same)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-center text-slate-800 mb-2">
          Student Login
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Sign in with your registered email and password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="student@school.com"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 mt-2 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Link back to main admin/student portal */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <span>Are you an admin? </span>
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Go to Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
