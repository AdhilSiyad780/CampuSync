// frontend/src/pages/school/ParentsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const RELATION_OPTIONS = [
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

export default function ParentsPage() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    id: null,
    fullname: "",
    email: "",
    phone: "",
    contact_number: "",
    whatsapp_number: "",
    occupation: "",
    relations: [], // [{ student_id, relation_type, is_primary }]
  });

  const navigate = useNavigate();

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStudents(), loadParents()]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.get("students/");
      setStudents(res.data || []);
    } catch (err) {
      console.error("LOAD STUDENTS FOR PARENTS ERROR:", err.response?.data || err.message);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
        return;
      }
    }
  };

  const loadParents = async () => {
    try {
      const res = await api.get("parents/");
      setParents(res.data || []);
    } catch (err) {
      console.error("LOAD PARENTS ERROR:", err.response?.data || err.message);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
        return;
      }
      setError("Failed to load parents.");
    }
  };

  const resetForm = () => {
    setForm({
      id: null,
      fullname: "",
      email: "",
      phone: "",
      contact_number: "",
      whatsapp_number: "",
      occupation: "",
      relations: [],
    });
    setSelectedParent(null);
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleStudent = (studentId) => {
    setForm((prev) => {
      const exists = prev.relations.find((r) => r.student_id === studentId);
      if (exists) {
        // remove
        return {
          ...prev,
          relations: prev.relations.filter((r) => r.student_id !== studentId),
        };
      } else {
        // add with default relation
        return {
          ...prev,
          relations: [
            ...prev.relations,
            {
              student_id: studentId,
              relation_type: "other",
              is_primary: prev.relations.length === 0, // first one as primary by default
            },
          ],
        };
      }
    });
  };

  const handleRelationChange = (studentId, field, value) => {
    setForm((prev) => {
      const updated = prev.relations.map((r) => {
        if (r.student_id !== studentId) return r;

        if (field === "is_primary" && value === true) {
          // make this primary, others false
          return { ...r, is_primary: true };
        }
        return { ...r, [field]: value };
      });

      if (field === "is_primary" && value === true) {
        // ensure others are not primary
        for (const r of updated) {
          if (r.student_id !== studentId) r.is_primary = false;
        }
      }

      return { ...prev, relations: [...updated] };
    });
  };

  const handleEdit = (parent) => {
    setError("");
    setSuccess("");

    setForm({
      id: parent.id,
      fullname: parent.fullname || "",
      email: parent.email || "",
      phone: parent.phone || "",
      contact_number: parent.contact_number || "",
      whatsapp_number: parent.whatsapp_number || "",
      occupation: parent.occupation || "",
      relations:
        parent.relations?.map((rel) => ({
          student_id: rel.student_id,
          relation_type: rel.relation_type,
          is_primary: rel.is_primary,
        })) || [],
    });

    setSelectedParent(parent);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleView = (parent) => {
    setSelectedParent(parent);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullname.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!form.contact_number.trim()) {
      setError("Contact number is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        contact_number: form.contact_number.trim(),
        whatsapp_number: form.whatsapp_number.trim(),
        occupation: form.occupation.trim(),
        relations: form.relations.map((r) => ({
          student_id: r.student_id,
          relation_type: r.relation_type,
          is_primary: !!r.is_primary,
        })),
      };

      if (form.id) {
        await api.put(`parents/${form.id}/`, payload);
        setSuccess("Parent updated successfully.");
      } else {
        await api.post("parents/", payload);
        setSuccess("Parent added successfully.");
      }

      await loadParents();
      resetForm();
    } catch (err) {
      console.error("SAVE PARENT ERROR:", err.response?.data || err.message);
      const data = err.response?.data;
      if (typeof data === "string") {
        setError(data);
      } else if (data && typeof data === "object") {
        if (data.detail) {
          setError(data.detail);
        } else {
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          if (Array.isArray(val)) setError(val[0]);
          else if (typeof val === "string") setError(val);
          else setError("Failed to save parent. Check details and try again.");
        }
      } else {
        setError("Failed to save parent. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600 text-sm">Loading parents...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-slate-800">Parents</h2>
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* SELECTED PARENT DETAILS */}
        {selectedParent && (
          <div className="mb-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Parent Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-700">
                  {selectedParent.fullname}
                </p>
                <p className="text-slate-500">{selectedParent.email}</p>
                <p className="text-slate-500">
                  Phone:{" "}
                  <span className="font-medium">
                    {selectedParent.phone || "-"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  Contact:{" "}
                  <span className="font-medium">
                    {selectedParent.contact_number}
                  </span>
                </p>
                <p className="text-slate-500">
                  WhatsApp:{" "}
                  <span className="font-medium">
                    {selectedParent.whatsapp_number}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  Occupation:{" "}
                  <span className="font-medium">
                    {selectedParent.occupation || "-"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-3">
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                Children
              </h4>
              {selectedParent.relations?.length ? (
                <ul className="list-disc list-inside text-sm text-slate-600">
                  {selectedParent.relations.map((rel) => (
                    <li key={rel.id}>
                      {rel.student_name} ({rel.class_id || "-"}
                      {rel.section ? `-${rel.section}` : ""}) –{" "}
                      <span className="font-medium">{rel.relation_type}</span>
                      {rel.is_primary && (
                        <span className="ml-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">
                  No linked students yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* FORM */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            {form.id ? "Edit Parent" : "Add Parent"}
          </h3>

          {error && (
            <p className="mb-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-2 text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2">
              {success}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* FULLNAME */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="fullname"
                value={form.fullname}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* CONTACT NUMBER */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contact Number *
              </label>
              <input
                type="text"
                name="contact_number"
                value={form.contact_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* WHATSAPP NUMBER */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                WhatsApp Number *
              </label>
              <input
                type="text"
                name="whatsapp_number"
                value={form.whatsapp_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* OCCUPATION */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Occupation
              </label>
              <input
                type="text"
                name="occupation"
                value={form.occupation}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* STUDENT SELECTION */}
            <div className="md:col-span-3 mt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Linked Students (multiple allowed)
              </label>
              {students.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No students available. Add students first.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {students.map((s) => {
                    const rel = form.relations.find(
                      (r) => r.student_id === s.id
                    );
                    const checked = !!rel;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-2 border-b last:border-b-0 py-1"
                      >
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleStudent(s.id)}
                          />
                          <span>
                            {s.fullname}{" "}
                            <span className="text-xs text-slate-500">
                              ({s.class_id || "-"}
                              {s.section ? `-${s.section}` : ""} –{" "}
                              {s.admission_number})
                            </span>
                          </span>
                        </label>

                        {checked && (
                          <div className="flex items-center gap-2 text-xs">
                            <select
                              value={rel.relation_type}
                              onChange={(e) =>
                                handleRelationChange(
                                  s.id,
                                  "relation_type",
                                  e.target.value
                                )
                              }
                              className="border rounded px-2 py-1"
                            >
                              {RELATION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            <label className="flex items-center gap-1">
                              <input
                                type="radio"
                                name="primary_student"
                                checked={rel.is_primary}
                                onChange={() =>
                                  handleRelationChange(
                                    s.id,
                                    "is_primary",
                                    true
                                  )
                                }
                              />
                              <span>Primary</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="md:col-span-3 flex gap-3 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2.5 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-700 transition"
              >
                {saving
                  ? "Saving..."
                  : form.id
                  ? "Update Parent"
                  : "Add Parent"}
              </button>

              {form.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-800 text-sm font-medium px-4 py-2.5 hover:bg-slate-300 transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            Parent List
          </h3>
          {parents.length === 0 ? (
            <p className="text-sm text-slate-500">No parents found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-3 py-2">Parent</th>
                    <th className="text-left px-3 py-2">Contact</th>
                    <th className="text-left px-3 py-2">Children</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">
                        {p.fullname}
                        <br />
                        <span className="text-xs text-slate-500">
                          {p.email}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div>{p.contact_number}</div>
                        <div className="text-xs text-slate-500">
                          WhatsApp: {p.whatsapp_number}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {p.relations?.length ? (
                          p.relations.map((r) => (
                            <div key={r.id}>
                              {r.student_name} ({r.relation_type}
                              {r.is_primary ? ", primary" : ""})
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400">
                            No children linked
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 space-x-2">
                        <button
                          onClick={() => handleView(p)}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        {/* Add delete later if needed */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
