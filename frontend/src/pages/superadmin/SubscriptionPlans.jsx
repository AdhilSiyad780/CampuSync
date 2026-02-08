import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Edit3, XCircle, Check, Info, Users, CreditCard, Calendar, Trash2, Search } from "lucide-react";

const initialFormData = {
  plan_name: "",
  description: "",
  duration_days: "",
  price: "",
  features: "",
  max_students: "",
  max_teachers: "",
  max_admins: "",
};

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get("subscriptions/plans/");
      setPlans(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/superadmin/login");
      setError("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingPlanId(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...formData,
        duration_days: Number(formData.duration_days),
        price: Number(formData.price),
        is_active: true,
        features: formData.features.split(",").map((f) => f.trim()).filter((f) => f.length > 0),
        max_students: formData.max_students ? Number(formData.max_students) : null,
        max_teachers: formData.max_teachers ? Number(formData.max_teachers) : null,
        max_admins: formData.max_admins ? Number(formData.max_admins) : null,
      };

      if (editingPlanId) {
        await api.put(`subscriptions/plans/${editingPlanId}/update/`, payload);
        setSuccess("Plan updated successfully!");
      } else {
        await api.post("subscriptions/plans/create/", payload);
        setSuccess("Plan created successfully!");
      }

      resetForm();
      loadPlans();
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred while saving the plan.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this plan? This cannot be undone.")) return;
    try {
      await api.delete(`subscriptions/plans/${id}/delete/`);
      setSuccess("Plan deleted successfully");
      loadPlans();
    } catch (err) {
      setError("Failed to delete plan");
    }
  };

  const handleEditClick = (plan) => {
    setEditingPlanId(plan.id);
    setFormData({
      plan_name: plan.plan_name,
      description: plan.description || "",
      duration_days: String(plan.duration_days || ""),
      price: String(plan.price || ""),
      features: Array.isArray(plan.features) ? plan.features.join(", ") : String(plan.features || ""),
      max_students: plan.max_students ?? "",
      max_teachers: plan.max_teachers ?? "",
      max_admins: plan.max_admins ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredPlans = plans.filter(p => 
    p.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Subscription Tiers</h1>
            <p className="text-slate-500 mt-1 font-medium">Configure pricing, duration, and capacity limits.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search plans..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 text-slate-900 shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 rounded-xl animate-in fade-in duration-300">
            <XCircle size={20} /> <span className="font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-3 rounded-xl animate-in fade-in duration-300">
            <Check size={20} /> <span className="font-medium">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ---- FORM PANEL ---- */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                {editingPlanId ? <Edit3 className="text-indigo-600" /> : <PlusCircle className="text-indigo-600" />}
                <h3 className="text-xl font-bold text-slate-800">{editingPlanId ? "Edit Plan Details" : "Create New Tier"}</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Plan Name</label>
                  <input type="text" name="plan_name" value={formData.plan_name} onChange={handleChange} required className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" placeholder="e.g. Pro Monthly" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 shadow-sm" placeholder="Target audience and value prop..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1 font-sans">Price (₹)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1">Days</label>
                    <input type="number" name="duration_days" value={formData.duration_days} onChange={handleChange} required className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" placeholder="30" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 ml-1 flex items-center gap-1">
                    Key Features <Info size={12} className="text-indigo-400" />
                  </label>
                  <input type="text" name="features" value={formData.features} onChange={handleChange} required className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" placeholder="Comma separated list" />
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4">
                  <p className="text-[10px] font-black text-slate-400 mb-3 flex items-center gap-1 uppercase tracking-widest"><Users size={12}/> Capacity Constraints</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" name="max_students" value={formData.max_students} onChange={handleChange} placeholder="Studs" className="w-full px-2 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-400 outline-none shadow-sm" />
                    <input type="number" name="max_teachers" value={formData.max_teachers} onChange={handleChange} placeholder="Teachs" className="w-full px-2 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-400 outline-none shadow-sm" />
                    <input type="number" name="max_admins" value={formData.max_admins} onChange={handleChange} placeholder="Adms" className="w-full px-2 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-400 outline-none shadow-sm" />
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-95">
                    {editingPlanId ? "Update Plan" : "Create Plan"}
                  </button>
                  {editingPlanId && (
                    <button type="button" onClick={resetForm} className="px-4 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ---- LIST PANEL ---- */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-slate-800">Active Offerings</h3>
               <span className="text-xs font-bold text-slate-400">{filteredPlans.length} Total</span>
            </div>

            {loading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
                  {[1,2].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />)}
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPlans.map((plan) => (
                  <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                          <CreditCard size={28} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Starting at</p>
                          <span className="text-3xl font-black text-slate-900">₹{plan.price}</span>
                        </div>
                      </div>
                      
                      <h4 className="text-xl font-bold text-slate-800 mb-2 capitalize group-hover:text-indigo-600 transition-colors">{plan.plan_name}</h4>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed line-clamp-2 italic">"{plan.description}"</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <Calendar size={14} className="text-indigo-400"/> {plan.duration_days} Days
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <Users size={14} className="text-indigo-400"/> {plan.max_students || '∞'} Students
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Included Features</p>
                        {(Array.isArray(plan.features) ? plan.features : []).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-700 font-medium list-none">
                            <Check size={14} className="text-emerald-500" strokeWidth={3} /> {feature}
                          </li>
                        ))}
                      </div>
                    </div>

                    <div className="flex border-t border-slate-100">
                      <button 
                        onClick={() => handleEditClick(plan)} 
                        className="flex-1 py-4 bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 border-r border-slate-100"
                      >
                        <Edit3 size={16} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(plan.id)}
                        className="px-6 py-4 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center"
                        title="Delete Plan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredPlans.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No plans found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}