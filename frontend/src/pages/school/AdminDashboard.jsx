// frontend/src/pages/school/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Menu, X, Users, School, UserCog, BookOpen, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [plans, setPlans] = useState([]);
  const [tenantSummary, setTenantSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPlanDetails, setShowPlanDetails] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        // load both plans and tenant summary in parallel
        await Promise.all([loadPlans(), loadTenantSummary()]);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get("subscriptions/plans/");
      setPlans(res.data || []);
    } catch (err) {
      console.error("LOAD PLANS ERROR:", err.response?.data || err.message);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
        return;
      }
      if (status === 403) {
        setError("You don't have permission to view subscription plans.");
        return;
      }
      setError("Failed to load subscription plans.");
    }
  };

  const loadTenantSummary = async () => {
    try {
      const res = await api.get("subscriptions/tenant-summary/");
      setTenantSummary(res.data || null);
    } catch (err) {
      console.error(
        "LOAD TENANT SUMMARY ERROR:",
        err.response?.data || err.message
      );
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
        return;
      }
      setError((prev) =>
        prev
          ? prev
          : "Could not load tenant subscription details. You may need to finish setup."
      );
    }
  };

  // derived values
  const currentPlan = tenantSummary?.current_plan || null;
  const counts = tenantSummary?.counts || { students: 0, teachers: 0, staff: 0 };

  const isTrial =
    !!currentPlan &&
    (currentPlan.is_trial || (currentPlan.name || "").toLowerCase() === "trial");

  // match the current plan against the full plans list to show detailed info
  const planDetails =
    currentPlan && plans.length
      ? plans.find((p) => p.id === currentPlan.id) || null
      : null;

  // fallback days-left calculation if backend didn't send days_left
  let daysLeft = currentPlan?.days_left;
  if (
    (daysLeft === undefined || daysLeft === null) &&
    currentPlan?.expires_at
  ) {
    const now = new Date();
    const exp = new Date(currentPlan.expires_at);
    const diffMs = exp - now;
    daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  // sidebar menu config
  const menuItems = [
    { name: "Dashboard", icon: <BookOpen size={18} />, path: "/dashboard" },
    { name: "Students", icon: <Users size={18} />, path: "/students" },
    { name: "Teachers", icon: <UserCog size={18} />, path: "/teachers" },
    { name: "Parents", icon: <UserCog size={18} />, path: "/parents" },
    { name: "School Details", icon: <School size={18} />, path: "/school" }, // future
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } bg-white shadow-md transition-all duration-300 overflow-hidden`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1
            className={`text-xl font-bold text-blue-600 transition-opacity duration-300 ${
              sidebarOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            Campusync
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 bg-slate-200 rounded-full"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="mt-4">
          {menuItems.map((item, i) => (
            <div
              key={i}
              onClick={() => item.path && navigate(item.path)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition"
            >
              {item.icon}
              {sidebarOpen && <span className="text-slate-700">{item.name}</span>}
            </div>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6">
        {/* TOPBAR */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>

          <div className="flex items-center gap-4">
            <p className="text-slate-600 text-sm">
              {localStorage.getItem("admin_fullname") || "Admin"}
            </p>
            <img
              src="https://api.dicebear.com/7.x/initials/svg?seed=A"
              alt="profile"
              className="w-10 h-10 rounded-full bg-slate-200"
            />
          </div>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {/* CURRENT PLAN + TRIAL INFO */}
        {currentPlan ? (
          <div
            className={`mb-6 rounded-xl border px-5 py-4 ${
              isTrial ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  Current Plan:{" "}
                  <span className="text-blue-700">
                    {currentPlan.name || "Unknown"}
                  </span>
                  {isTrial && (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Trial
                    </span>
                  )}
                </h3>

                {typeof daysLeft === "number" && (
                  <p className="text-sm text-slate-700 mt-1">
                    {daysLeft > 0
                      ? `Plan expires in ${daysLeft} day${
                          daysLeft === 1 ? "" : "s"
                        }.`
                      : "Plan has expired or expires today."}
                  </p>
                )}

                {currentPlan.expires_at && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Expires on:{" "}
                    <span className="font-medium">
                      {new Date(currentPlan.expires_at).toLocaleDateString()}
                    </span>
                  </p>
                )}

                {isTrial && (
                  <p className="text-xs text-amber-700 mt-2">
                    You are on a trial. Consider upgrading before it ends.
                  </p>
                )}
              </div>

              {/* Plan details toggle */}
              {planDetails && (
                <button
                  type="button"
                  onClick={() => setShowPlanDetails((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/70 text-blue-700 text-xs font-medium px-3 py-1 border border-blue-200 hover:bg-white transition"
                >
                  <Info size={14} />
                  {showPlanDetails ? "Hide details" : "View plan details"}
                </button>
              )}
            </div>

            {/* Detailed plan info */}
            {showPlanDetails && planDetails && (
              <div className="mt-4 text-xs text-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p>
                    <span className="font-semibold">Duration:</span>{" "}
                    {planDetails.duration_days} days
                  </p>
                  <p>
                    <span className="font-semibold">Price:</span> ₹
                    {planDetails.price}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-semibold">Max Students:</span>{" "}
                    {planDetails.max_students ?? "Unlimited"}
                  </p>
                  <p>
                    <span className="font-semibold">Max Teachers:</span>{" "}
                    {planDetails.max_teachers ?? "Unlimited"}
                  </p>
                  <p>
                    <span className="font-semibold">Max Admins:</span>{" "}
                    {planDetails.max_admins ?? "Unlimited"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Features:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {Array.isArray(planDetails.features)
                      ? planDetails.features.map((f, idx) => (
                          <li key={idx}>{String(f)}</li>
                        ))
                      : planDetails.features
                      ? [String(planDetails.features)].map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))
                      : "No extra features listed."}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 rounded-xl border px-5 py-4 bg-white">
            <p className="text-sm text-slate-600">
              No active plan found for this tenant.
            </p>
          </div>
        )}

        {/* IF TRIAL → SHOW ALL PLANS AT TOP */}
        {isTrial && plans.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Available Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-xl shadow p-4 border border-slate-100"
                >
                  <h4 className="font-semibold text-slate-800">
                    {plan.plan_name.toUpperCase()}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {plan.description}
                  </p>
                  <p className="text-sm text-slate-700 mt-2">
                    Duration:{" "}
                    <span className="font-medium">
                      {plan.duration_days} days
                    </span>
                  </p>
                  <p className="text-sm text-slate-700">
                    Price:{" "}
                    <span className="font-semibold">₹{plan.price}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Features:{" "}
                    {Array.isArray(plan.features)
                      ? plan.features.join(", ")
                      : String(plan.features ?? "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FALLBACK: show plans always if tenant is trial or if user wants to browse */}
        {!isTrial && plans.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              All Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-white rounded-xl shadow p-4 border border-slate-100"
                >
                  <h4 className="font-semibold text-slate-800">
                    {plan.plan_name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {plan.description}
                  </p>
                  <p className="text-sm text-slate-700 mt-2">
                    Price:{" "}
                    <span className="font-semibold">₹{plan.price}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STAT CARDS – USING REAL COUNTS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-slate-600">Total Students</h3>
            <p className="text-3xl font-bold mt-2">{counts.students ?? 0}</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-slate-600">Total Teachers</h3>
            <p className="text-3xl font-bold mt-2">{counts.teachers ?? 0}</p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">
            <h3 className="text-slate-600">Total Staff</h3>
            <p className="text-3xl font-bold mt-2">{counts.staff ?? 0}</p>
          </div>
        </div>

        {/* CHART + TABLE PLACEHOLDER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-slate-700">
              Recent Admissions
            </h3>
            <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
              (Chart Placeholder)
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow">
            <h3 className="text-lg font-semibold text-slate-700">
              Latest Staff Added
            </h3>
            <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
              (Table Placeholder)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
