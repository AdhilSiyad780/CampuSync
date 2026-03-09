import { useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("superadmin/login/", { email, password });
      const userData = res.data?.user;
      console.log(userData.user_type)
      console.log(userData)
      if (!userData) {
        setError("Invalid response from server.");
        return;
      }

      // 1. Check if the user is actually a superadmin
      if (userData.user_type) {
        // Save non-sensitive info for the UI
      localStorage.setItem("user", JSON.stringify(userData));
      
        
        // ✅ KEY FIX: Update AuthContext by calling checkAuth
        // This ensures that RoleProtectedRoute sees the authenticated user
        await checkAuth();
        
        console.log("✅ Login successful, navigating to /superadmin");
        
        // Navigate to superadmin dashboard
        navigate("/superadmin");
      } else {
        // 2. Security: If they aren't a superadmin, don't let them in!
        // We should also ideally call a logout endpoint here to clear the cookie
        setError("Access Denied: You do not have Super Admin privileges.");
        
        // Cleanup local storage just in case
        localStorage.removeItem("user");
      }

    } catch (err) {
      console.error("LOGIN ERROR:", err.response?.data || err.message);
      console.log(err.response)
      setError(err.response?.data?.detail || "Invalid email or password.");
    }
  };;   

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-slate-900 dark:text-slate-100">
        <h1 className="mb-4 text-xl font-semibold text-center">Super Admin Login</h1>

        {error && (
          <div className="mb-3 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900 dark:text-red-100">
            {error}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
