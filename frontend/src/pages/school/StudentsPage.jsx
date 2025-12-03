import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // for view-details modal
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [form, setForm] = useState({
    id: null,

    // User fields
    fullname: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",

    // Profile fields
    admission_number: "",
    admission_date: "", // datetime-local
    blood_group: "",
    class_id: "",
    section: "",
    guardian_name: "",
    guardian_number: "",
    roll_number: "",
    student_contact: "",
    id_proof_url: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
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
      admission_number: "",
      admission_date: "",
      blood_group: "",
      class_id: "",
      section: "",
      guardian_name: "",
      guardian_number: "",
      roll_number: "",
      student_contact: "",
      id_proof_url: "",
    });
    setError("");
    setSuccess("");
  };

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("students/");
      setStudents(res.data || []);
    } catch (err) {
      console.error("LOAD STUDENTS ERROR:", err.response?.data || err.message);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("access");
        navigate("/login");
        return;
      }
      setError("Failed to load students.");
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

  const handleEdit = (student) => {
    setError("");
    setSuccess("");

    // admission_date is a DateTime string; convert to datetime-local format
    let admissionDateValue = "";
    if (student.admission_date) {
      const d = new Date(student.admission_date);
      const pad = (n) => String(n).padStart(2, "0");
      admissionDateValue = `${d.getFullYear()}-${pad(
        d.getMonth() + 1
      )}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    setForm({
      id: student.id,
      fullname: student.fullname || "",
      email: student.email || "",
      phone: student.phone || "",
      DOB: student.DOB || "",
      gender: student.gender || "",
      admission_number: student.admission_number || "",
      admission_date: admissionDateValue,
      blood_group: student.blood_group || "",
      class_id: student.class_id ?? "",
      section: student.section || "",
      guardian_name: student.guardian_name || "",
      guardian_number: student.guardian_number || "",
      roll_number: student.roll_number ?? "",
      student_contact: student.student_contact || "",
      id_proof_url: student.id_proof_url || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedStudent(null);
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
    if (!form.admission_number.trim()) {
      setError("Admission number is required.");
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

        admission_number: form.admission_number.trim(),
        admission_date: form.admission_date || null,
        blood_group: form.blood_group.trim(),
        class_id: form.class_id ? Number(form.class_id) : null,
        section: form.section.trim(),
        guardian_name: form.guardian_name.trim(),
        guardian_number: form.guardian_number.trim(),
        roll_number: form.roll_number ? Number(form.roll_number) : null,
        student_contact: form.student_contact.trim(),
        id_proof_url: form.id_proof_url.trim(),
      };

      if (form.id) {
        await api.put(`students/${form.id}/`, payload);
        setSuccess("Student updated successfully.");
      } else {
        await api.post("students/", payload);
        setSuccess("Student added successfully.");
      }

      resetForm();
      await loadStudents();
    } catch (err) {
      console.error("SAVE STUDENT ERROR:", err.response?.data || err.message);
      const data = err.response?.data;
      if (typeof data === "string") {
        setError(data);
      } else if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey])) {
          setError(data[firstKey][0]);
        } else {
          setError("Failed to save student. Check the details and try again.");
        }
      } else {
        setError("Failed to save student. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600 text-sm">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-slate-800">Students</h2>
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* FORM */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            {form.id ? "Edit Student" : "Add Student"}
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

            {/* ADMISSION NUMBER */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Admission Number *
              </label>
              <input
                type="text"
                name="admission_number"
                value={form.admission_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ADMISSION DATE */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Admission Date &amp; Time
              </label>
              <input
                type="datetime-local"
                name="admission_date"
                value={form.admission_date}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* BLOOD GROUP */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Blood Group
              </label>
              <input
                type="text"
                name="blood_group"
                value={form.blood_group}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* CLASS ID */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Class ID
              </label>
              <input
                type="number"
                name="class_id"
                value={form.class_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 7"
              />
            </div>

            {/* SECTION */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Section
              </label>
              <input
                type="text"
                name="section"
                value={form.section}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., A"
              />
            </div>

            {/* ROLL NUMBER */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Roll Number
              </label>
              <input
                type="number"
                name="roll_number"
                value={form.roll_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* GUARDIAN NAME */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Guardian Name
              </label>
              <input
                type="text"
                name="guardian_name"
                value={form.guardian_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* GUARDIAN NUMBER */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Guardian Number
              </label>
              <input
                type="text"
                name="guardian_number"
                value={form.guardian_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* STUDENT CONTACT */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Student Contact
              </label>
              <input
                type="text"
                name="student_contact"
                value={form.student_contact}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ID PROOF URL */}
            <div className="md:col-span-2">
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
                  ? "Update Student"
                  : "Add Student"}
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
            Student List
          </h3>
          {students.length === 0 ? (
            <p className="text-sm text-slate-500">No students found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Class</th>
                    <th className="text-left px-3 py-2">Roll</th>
                    <th className="text-left px-3 py-2">Admission No</th>
                    <th className="text-left px-3 py-2">Guardian</th>
                    <th className="text-left px-3 py-2">Contact</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">
                        {s.fullname} <br />
                        <span className="text-xs text-slate-500">
                          {s.email}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {s.class_id || "-"}
                        {s.section ? `-${s.section}` : ""}
                      </td>
                      <td className="px-3 py-2">{s.roll_number ?? "-"}</td>
                      <td className="px-3 py-2">{s.admission_number}</td>
                      <td className="px-3 py-2">{s.guardian_name || "-"}</td>
                      <td className="px-3 py-2">
                        {s.guardian_number || s.student_contact || "-"}
                      </td>
                      <td className="px-3 py-2 space-x-3">
                        <button
                          onClick={() => handleView(s)}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(s)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        {/* Add delete later if you want */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {showDetails && selectedStudent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-5 relative">
            <button
              onClick={closeDetails}
              className="absolute top-2 right-3 text-slate-400 hover:text-slate-700 text-xl leading-none"
            >
              &times;
            </button>

            <h3 className="text-lg font-semibold text-slate-800 mb-3">
              Student Details
            </h3>

            <div className="space-y-2 text-sm text-slate-700">
              <div>
                <p className="font-semibold">Basic Info</p>
                <p>
                  {selectedStudent.fullname} (
                  <span className="text-xs text-slate-500">
                    {selectedStudent.email}
                  </span>
                  )
                </p>
                {selectedStudent.phone && <p>Phone: {selectedStudent.phone}</p>}
                {selectedStudent.DOB && <p>DOB: {selectedStudent.DOB}</p>}
                {selectedStudent.gender && (
                  <p>Gender: {selectedStudent.gender}</p>
                )}
              </div>

              <div>
                <p className="font-semibold mt-2">Academic</p>
                <p>Admission No: {selectedStudent.admission_number}</p>
                {selectedStudent.admission_date && (
                  <p>
                    Admission Date:{" "}
                    {new Date(
                      selectedStudent.admission_date
                    ).toLocaleString()}
                  </p>
                )}
                <p>
                  Class: {selectedStudent.class_id || "-"}
                  {selectedStudent.section
                    ? `-${selectedStudent.section}`
                    : ""}
                </p>
                <p>Roll: {selectedStudent.roll_number ?? "-"}</p>
                {selectedStudent.blood_group && (
                  <p>Blood Group: {selectedStudent.blood_group}</p>
                )}
              </div>

              <div>
                <p className="font-semibold mt-2">Guardian & Contact</p>
                <p>
                  Guardian: {selectedStudent.guardian_name || "-"}{" "}
                  {selectedStudent.guardian_number
                    ? `(${selectedStudent.guardian_number})`
                    : ""}
                </p>
                {selectedStudent.student_contact && (
                  <p>Student Contact: {selectedStudent.student_contact}</p>
                )}
              </div>

              {selectedStudent.id_proof_url && (
                <div>
                  <p className="font-semibold mt-2">ID Proof</p>
                  <a
                    href={selectedStudent.id_proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 underline break-all"
                  >
                    {selectedStudent.id_proof_url}
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  handleEdit(selectedStudent);
                  closeDetails();
                }}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-blue-700 transition"
              >
                Edit this student
              </button>
              <button
                onClick={closeDetails}
                className="inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-800 text-xs font-medium px-3 py-1.5 hover:bg-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
