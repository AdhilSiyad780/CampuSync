import { useEffect, useState } from "react";
import { Menu, X, Users, School, UserCog, BookOpen, Info, LayoutDashboard, LogOut, ChevronRight, CreditCard } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [plans, setPlans] = useState([]);
  const [tenantSummary, setTenantSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("admin_fullname");
    localStorage.removeItem("admin_email");
    navigate("/login");
  };

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([loadPlans(), loadTenantSummary()]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get("subscriptions/plans/");
      setPlans(res.data || []);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
        return;
      }
      setError(status === 403 ? "Permission denied." : "Failed to load plans.");
    }
  };

  const loadTenantSummary = async () => {
    try {
      const res = await api.get("subscriptions/tenant-summary/");
      setTenantSummary(res.data || null);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
        return;
      }
      setError((prev) => prev || "Could not load subscription details.");
    }
  };

  const handleBuyPlan = async (plan) => {
    setError("");
    setPaymentLoading(true);
    if (!window.Razorpay) {
      alert("Payment system not loaded.");
      setPaymentLoading(false);
      return;
    }
    try {
      const res = await api.post("subscriptions/create-order/", { plan_id: plan.id });
      const { order_id, amount, currency, razorpay_key_id } = res.data;
      const options = {
        key: razorpay_key_id,
        amount,
        currency,
        name: "Campusync",
        description: `Subscription - ${plan.plan_name}`,
        order_id,
        prefill: {
          name: localStorage.getItem("admin_fullname") || "",
          email: localStorage.getItem("admin_email") || "",
        },
        theme: { color: "#4f46e5" },
        handler: async function (response) {
          try {
            await api.post("subscriptions/verify-payment/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id,
            });
            alert("Payment successful!");
            await loadTenantSummary();
          } catch (err) {
            alert("Verification failed.");
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError("Failed to initiate payment.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const currentPlan = tenantSummary?.current_plan || null;
  const counts = tenantSummary?.counts || { students: 0, teachers: 0, staff: 0 };
  const isTrial = !!currentPlan && (currentPlan.is_trial || (currentPlan.name || "").toLowerCase() === "trial");
  const planDetails = currentPlan && plans.length ? plans.find((p) => p.id === currentPlan.id) || null : null;

  let daysLeft = currentPlan?.days_left;
  if ((daysLeft === undefined || daysLeft === null) && currentPlan?.expires_at) {
    const exp = new Date(currentPlan.expires_at);
    daysLeft = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/dashboard" },
    { name: "Students", icon: <Users size={20} />, path: "/students" },
    { name: "Teachers", icon: <UserCog size={20} />, path: "/teachers" },
    { name: "Parents", icon: <Users size={20} />, path: "/parents" },
    { name: "School Details", icon: <School size={20} />, path: "/school" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-[#1E293B] transition-all duration-300 flex flex-col shadow-xl z-20`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-700/50">
          {sidebarOpen && <span className="text-xl font-bold text-white tracking-tight">Campusync</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                location.pathname === item.path ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              {item.icon}
              {sidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <button onClick={handleLogout} className="m-3 flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={20} />
          {sidebarOpen && <span className="font-medium text-sm">Logout</span>}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Dashboard Overview</h2>
          <Link to="/profile" className="flex items-center gap-3 group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-700 leading-none group-hover:text-indigo-600 transition-colors">{localStorage.getItem("admin_fullname") || "Admin"}</p>
              <p className="text-[11px] text-slate-500 mt-1 uppercase font-semibold tracking-wider">School Admin</p>
            </div>
            <img src="https://api.dicebear.com/7.x/initials/svg?seed=A" alt="avatar" className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200" />
          </Link>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 rounded shadow-sm">{error}</div>}

          {/* SUBSCRIPTION STATUS */}
          {currentPlan ? (
            <div className={`p-6 rounded-2xl border ${isTrial ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-indigo-50 border-indigo-200 text-indigo-900"} shadow-sm relative overflow-hidden`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{currentPlan.name} Plan</h3>
                    {isTrial && <span className="text-[10px] font-black uppercase tracking-widest bg-amber-200 px-2 py-0.5 rounded">Trial Mode</span>}
                  </div>
                  <p className="text-sm opacity-80 font-medium">
                    {daysLeft > 0 ? `Your subscription remains active for the next ${daysLeft} days.` : "Your plan expires today."}
                  </p>
                </div>
                <button onClick={() => setShowPlanDetails(!showPlanDetails)} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-bold border border-slate-200 hover:shadow-md transition-all">
                  <Info size={14} /> {showPlanDetails ? "Hide Details" : "View Plan Benefits"}
                </button>
              </div>

              {showPlanDetails && planDetails && (
                <div className="mt-5 pt-5 border-t border-indigo-200/50 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm relative z-10 animate-in fade-in slide-in-from-top-2">
                   <div className="space-y-1"><p className="text-xs uppercase font-bold opacity-50">Limits</p><p className="font-bold">{planDetails.max_students} Students • {planDetails.max_teachers} Teachers</p></div>
                   <div className="space-y-1"><p className="text-xs uppercase font-bold opacity-50">Billing</p><p className="font-bold">₹{planDetails.price} / {planDetails.duration_days} Days</p></div>
                   <div className="space-y-1"><p className="text-xs uppercase font-bold opacity-50">Features</p><p className="font-bold truncate">{Array.isArray(planDetails.features) ? planDetails.features.join(", ") : "Premium Modules"}</p></div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center"><p className="text-slate-500 text-sm">No active subscription found.</p></div>
          )}

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total Students", value: counts.students, icon: <Users className="text-blue-600" />, color: "bg-blue-50" },
              { label: "Total Teachers", value: counts.teachers, icon: <UserCog className="text-indigo-600" />, color: "bg-indigo-50" },
              { label: "Administrative Staff", value: counts.staff, icon: <School className="text-emerald-600" />, color: "bg-emerald-50" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">{stat.value || 0}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
              </div>
            ))}
          </div>

          {/* PLANS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Subscription Plans</h3>
              <p className="text-xs font-semibold text-indigo-600">Select a plan to upgrade</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col group hover:border-indigo-400 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-wide">{plan.plan_name}</h4>
                    <CreditCard size={18} className="text-slate-300" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 mb-1">₹{plan.price}</p>
                  <p className="text-[10px] text-slate-400 font-bold mb-4 italic uppercase">{plan.duration_days} Days Access</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1">{plan.description}</p>
                  <button
                    onClick={() => handleBuyPlan(plan)}
                    disabled={paymentLoading || (currentPlan && currentPlan.id === plan.id && !isTrial)}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
                      currentPlan?.id === plan.id && !isTrial 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
                    }`}
                  >
                    {paymentLoading ? "Processing..." : currentPlan?.id === plan.id && !isTrial ? "Current Plan" : "Choose Plan"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PLACEHOLDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            {["Recent Admissions", "Latest Staff"].map((title) => (
              <div key={title} className="bg-white p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-800">{title}</h3>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
                <div className="h-32 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-300 text-xs font-medium italic">
                  Data visualization placeholder
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}