import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Ban, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null); // Track which row is updating

  const loadTenants = async () => {
    try {
      const res = await api.get("superadmin/tenants/");
      setTenants(res.data || []);
    } catch (err) {
      setError("Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleToggleBlock = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`superadmin/tenants/${id}/toggle-block/`);
      // Refresh the list to show new status
      await loadTenants();
    } catch (err) {
      alert("Error updating tenant status");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Institutional Tenants</h2>
          <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase">
            Total: {tenants.length}
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">{error}</div>}

        <div className="overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Institution</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Plan Details</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => {
                const isSuspended = t.status === "suspended";
                return (
                  <tr key={t.id} className={`transition-colors ${isSuspended ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{t.instance_name}</div>
                      <div className="text-xs text-slate-500 font-medium">{t.tenant_id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-slate-700 font-semibold">{t.current_plan?.plan_name || "N/A"}</div>
                      <div className="text-xs text-slate-500 italic">Expires: {t.current_plan?.expiry_date || "Never"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(t.id)}
                        disabled={processingId === t.id}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSuspended 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200' 
                          : 'bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200'
                        } disabled:opacity-50`}
                      >
                        {processingId === t.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : isSuspended ? (
                          <><CheckCircle size={14} /> Unblock</>
                        ) : (
                          <><Ban size={14} /> Block</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}