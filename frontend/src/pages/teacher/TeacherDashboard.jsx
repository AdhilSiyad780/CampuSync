// frontend/src/pages/student/StudentDashboard.jsx
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white shadow-md rounded-2xl px-8 py-10 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">
          Teacher Dashboard
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Your Teacher dashboard is coming soon.
        </p>

        <div className="inline-flex items-center justify-center rounded-full bg-blue-50 px-4 py-2 mb-4">
          <span className="text-xs font-medium text-blue-700 tracking-wide">
            COMING SOON
          </span>
        </div>

        <p className="text-xs text-slate-400">
          You&apos;ll be able to view your classes, attendance, and more from
          here once it&apos;s ready.
        </p>

        <button
          onClick={() => navigate("/student/login")}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-700 transition"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
