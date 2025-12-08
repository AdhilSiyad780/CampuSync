// frontend/src/pages/SuperAdminTenants.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTenants = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("superadmin/tenants/");
        setTenants(res.data || []);
      } catch (err) {
        console.error(
          "LOAD TENANTS ERROR:",
          err.response?.data || err.message
        );
        const status = err.response?.status;
        if (status === 401) {
          setError("You are not authenticated.");
        } else if (status === 403) {
          setError("You do not have permission to view tenants.");
        } else {
          setError("Failed to load tenants.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-600">Loading tenants...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-slate-800">Tenants</h2>
        <p className="text-xs text-slate-500">
          Total: {tenants.length}
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {tenants.length === 0 ? (
        <p className="text-sm text-slate-500">No tenants found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-3 py-2">Tenant</th>
                <th className="text-left px-3 py-2">Contact</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Current Plan</th>
                <th className="text-left px-3 py-2">Plan Status</th>
                <th className="text-left px-3 py-2">Expires / Days Left</th>
                <th className="text-left px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => {
                const cp = t.current_plan;
                return (
                  <tr key={t.id} className="border-b last:border-b-0">
                    {/* Tenant name + email */}
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-800">
                        {t.instance_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        ID: {t.tenant_id}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-3 py-2">
                      <div className="text-xs text-slate-600">
                        {t.email || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {t.phone || ""}
                      </div>
                    </td>

                    {/* Tenant status */}
                    <td className="px-3 py-2">
                      <span className="text-xs font-medium uppercase tracking-wide">
                        {t.status || "-"}
                      </span>
                    </td>

                    {/* Current plan */}
                    <td className="px-3 py-2">
                      {cp ? (
                        <>
                          <div className="font-medium">
                            {cp.plan_name || "Unknown"}
                          </div>
                          <div className="text-xs text-slate-500">
                            ₹{cp.price ?? "-"}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500">
                          No active plan
                        </span>
                      )}
                    </td>

                    {/* Plan status */}
                    <td className="px-3 py-2">
                      {cp ? (
                        <span className="text-xs">
                          {cp.status} {cp.is_active ? "(active)" : "(inactive)"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Expiry / days left */}
                    <td className="px-3 py-2">
                      {cp ? (
                        <>
                          <div className="text-xs text-slate-600">
                            {cp.expiry_date
                              ? new Date(cp.expiry_date).toLocaleDateString()
                              : "-"}
                          </div>
                          {typeof cp.days_left === "number" && (
                            <div className="text-xs text-slate-500">
                              {cp.days_left > 0
                                ? `${cp.days_left} day${
                                    cp.days_left === 1 ? "" : "s"
                                  } left`
                                : "Expired / expires today"}
                            </div>
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Created at */}
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {t.created_at
                        ? new Date(t.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
