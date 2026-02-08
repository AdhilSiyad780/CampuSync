// src/components/RoleProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
        <div className="relative flex items-center justify-center">
          {/* Subtle background glow */}
          <div className="absolute h-24 w-24 animate-pulse rounded-full bg-indigo-100"></div>
          
          {/* Main Spinning Ring */}
          <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-slate-100 border-t-indigo-600 shadow-sm"></div>
          
          {/* Center Dot */}
          <div className="absolute h-2 w-2 rounded-full bg-indigo-600"></div>
        </div>

        {/* Branding & Status */}
        <div className="mt-8 flex flex-col items-center">
          <h1 className="text-xl font-black tracking-tight text-slate-800">
            Campu<span className="text-indigo-600">Sync</span>
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
            <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
            <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400"></span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Verifying Access
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.user_type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
}