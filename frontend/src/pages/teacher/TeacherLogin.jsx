// frontend/src/pages/teacher/TeacherLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function TeacherLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/teacher/login/", {
        email: email.trim(),
        password,
      });

      // store tokens and user info
      localStorage.setItem("teacher_access", res.data.access);
      localStorage.setItem("teacher_refresh", res.data.refresh);
      localStorage.setItem("teacher_fullname", res.data.user.fullname);
      localStorage.setItem("teacher_email", res.data.user.email);

      // if you want, you can also keep a generic auth token:
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      navigate("/teacher/dashboard");
    } catch (err) {
      console.error("TEACHER LOGIN ERROR:", err.response?.data || err.message);
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
          Teacher Login
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Sign in with your teacher email and password.
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
              placeholder="teacher@school.com"
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
      </div>
    </div>
  );
}
