// frontend/src/pages/school/TeachersPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    id: null,

    // User fields
    fullname: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",

    // Teacher profile fields
    department_id: "",
    employee_id: "",
    joining_date: "", // datetime-local
    qualification: "",
    salary: "",
    specialization: "",
    years_of_experience: "",
    id_proof_url: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({
      id: null,
      fullname: "",
      email: "",
      phone: "",
      DOB: "",
      gender: "",
      department_id: "",
      employee_id: "",
      joining_date: "",
      qualification: "",
      salary: "",
      specialization: "",
      years_of_experience: "",
      id_proof_url: "",
    });
    setError("");
    setSuccess("");
    setSelectedTeacher(null);
  };

  const loadTeachers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("teachers/");
      setTeachers(res.data || []);
    } catch (err) {
      console.error("LOAD TEACHERS ERROR:", err.response?.data || err.message);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
        return;
      }
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (teacher) => {
    setError("");
    setSuccess("");

    let joiningDateValue = "";
    if (teacher.joining_date) {
      const d = new Date(teacher.joining_date);
      const pad = (n) => String(n).padStart(2, "0");
      joiningDateValue = `${d.getFullYear()}-${pad(
        d.getMonth() + 1
      )}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    setForm({
      id: teacher.id,
      fullname: teacher.fullname || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      DOB: teacher.DOB || "",
      gender: teacher.gender || "",
      department_id: teacher.department_id ?? "",
      employee_id: teacher.employee_id ?? "",
      joining_date: joiningDateValue,
      qualification: teacher.qualification || "",
      salary: teacher.salary ?? "",
      specialization: teacher.specialization || "",
      years_of_experience: teacher.years_of_experience ?? "",
      id_proof_url: teacher.id_proof_url || "",
    });

    setSelectedTeacher(teacher);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleView = (teacher) => {
    setSelectedTeacher(teacher);
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
    if (!form.employee_id) {
      setError("Employee ID is required.");
      return;
    }
    if (!form.joining_date) {
      setError("Joining date is required.");
      return;
    }
    if (!form.qualification.trim()) {
      setError("Qualification is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullname: form.fullname.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        DOB: form.DOB || null,
        gender: form.gender || "",

        department_id: form.department_id ? Number(form.department_id) : null,
        employee_id: form.employee_id ? Number(form.employee_id) : null,
        joining_date: form.joining_date || null,
        qualification: form.qualification.trim(),
        salary: form.salary ? Number(form.salary) : null,
        specialization: form.specialization.trim(),
        years_of_experience: form.years_of_experience
          ? Number(form.years_of_experience)
          : null,
        id_proof_url: form.id_proof_url.trim(),
      };

      if (form.id) {
        await api.put(`teachers/${form.id}/`, payload);
        setSuccess("Teacher updated successfully.");
      } else {
        await api.post("teachers/", payload);
        setSuccess("Teacher added successfully.");
      }

      await loadTeachers();
      resetForm();
    } catch (err) {
      console.error("SAVE TEACHER ERROR:", err.response?.data || err.message);
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
          else setError("Failed to save teacher. Check details and try again.");
        }
      } else {
        setError("Failed to save teacher. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600 text-sm">Loading teachers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-slate-800">Teachers</h2>
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* OPTIONAL SELECTED TEACHER DETAILS */}
        {selectedTeacher && (
          <div className="mb-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Teacher Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-700">
                  {selectedTeacher.fullname}
                </p>
                <p className="text-slate-500">{selectedTeacher.email}</p>
              </div>
              <div>
                <p className="text-slate-500">
                  Dept ID:{" "}
                  <span className="font-medium">
                    {selectedTeacher.department_id ?? "-"}
                  </span>
                </p>
                <p className="text-slate-500">
                  Employee ID:{" "}
                  <span className="font-medium">
                    {selectedTeacher.employee_id ?? "-"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  Qualification:{" "}
                  <span className="font-medium">
                    {selectedTeacher.qualification || "-"}
                  </span>
                </p>
                <p className="text-slate-500">
                  Experience:{" "}
                  <span className="font-medium">
                    {selectedTeacher.years_of_experience ?? 0} years
                  </span>
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  Joining Date:{" "}
                  <span className="font-medium">
                    {selectedTeacher.joining_date
                      ? new Date(
                          selectedTeacher.joining_date
                        ).toLocaleDateString()
                      : "-"}
                  </span>
                </p>
                <p className="text-slate-500">
                  Salary:{" "}
                  <span className="font-medium">
                    {selectedTeacher.salary != null
                      ? `₹${selectedTeacher.salary}`
                      : "-"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  Specialization:{" "}
                  <span className="font-medium">
                    {selectedTeacher.specialization || "-"}
                  </span>
                </p>
                <p className="text-slate-500">
                  Phone:{" "}
                  <span className="font-medium">
                    {selectedTeacher.phone || "-"}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-slate-500">
                  ID Proof URL:{" "}
                  <a
                    href={selectedTeacher.id_proof_url}
                    className="text-blue-600 underline break-all"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedTeacher.id_proof_url || "-"}
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FORM */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            {form.id ? "Edit Teacher" : "Add Teacher"}
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

            {/* DOB */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="DOB"
                value={form.DOB || ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* GENDER */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* DEPARTMENT ID */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department ID
              </label>
              <input
                type="number"
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* EMPLOYEE ID */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Employee ID *
              </label>
              <input
                type="number"
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* JOINING DATE */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Joining Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                name="joining_date"
                value={form.joining_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* QUALIFICATION */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Qualification *
              </label>
              <input
                type="text"
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* SALARY */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Salary
              </label>
              <input
                type="number"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* YEARS OF EXPERIENCE */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                name="years_of_experience"
                value={form.years_of_experience}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* SPECIALIZATION */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Specialization
              </label>
              <input
                type="text"
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ID PROOF URL */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ID Proof URL
              </label>
              <input
                type="text"
                name="id_proof_url"
                value={form.id_proof_url}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            {/* BUTTONS */}
            <div className="md:col-span-3 flex gap-3 mt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2.5 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-700 transition"
              >
                {saving
                  ? "Saving..."
                  : form.id
                  ? "Update Teacher"
                  : "Add Teacher"}
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
            Teacher List
          </h3>
          {teachers.length === 0 ? (
            <p className="text-sm text-slate-500">No teachers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Department</th>
                    <th className="text-left px-3 py-2">Employee ID</th>
                    <th className="text-left px-3 py-2">Qualification</th>
                    <th className="text-left px-3 py-2">Contact</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">
                        {t.fullname} <br />
                        <span className="text-xs text-slate-500">
                          {t.email}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {t.department_id != null ? t.department_id : "-"}
                      </td>
                      <td className="px-3 py-2">
                        {t.employee_id != null ? t.employee_id : "-"}
                      </td>
                      <td className="px-3 py-2">
                        {t.qualification || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {t.phone || "-"}
                      </td>
                      <td className="px-3 py-2 space-x-2">
                        <button
                          onClick={() => handleView(t)}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(t)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        {/* Delete button can be added later */}
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
