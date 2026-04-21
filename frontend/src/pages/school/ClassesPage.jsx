import { useEffect, useState } from "react";
import { 
  GraduationCap, Users, Plus, Edit, Eye, Trash2, 
  Save, X, ChevronRight, Search, Calendar, User
} from "lucide-react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { Backarrow } from "../../componets/Backarrow";


export default function ClassesPage() {
  const [classes, setClasses] = useState({ results: [], count: 0, next: null, previous: null });
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);



  

  const [form, setForm] = useState({
    id: null,
    class_name: "",
    division: "",
    academic_year: new Date().getFullYear().toString(),
    capacity: "",
    class_teacher_id: "",
  });

  useEffect(() => {
    loadData(1);
  }, []);

  
const loadData = async (page = 1) => {
  setLoading(true);
  try {
    const [classRes, teacherRes] = await Promise.all([
      api.get(`classes/?page=${page}`),
      api.get("teachers/available/")
    ]);
    setClasses(classRes.data || { results: [], count: 0, next: null, previous: null });
    setTeachers(teacherRes.data || []);
    setCurrentPage(page);
  } catch (err) {
    console.error("Load error:", err);
    setError("Failed to load data");
  } finally {
    setLoading(false);
  }
};
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
    setSuccess("");
  };

  const handleEdit = (classItem) => {
    setForm({
      id: classItem.id,
      class_name: classItem.class_name,
      division: classItem.division,
      academic_year: classItem.academic_year,
      capacity: classItem.capacity,
      class_teacher_id: classItem.class_teacher_details?.id || "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setForm({
      id: null,
      class_name: "",
      division: "",
      academic_year: new Date().getFullYear().toString(),
      capacity: "",
      class_teacher_id: "",
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.class_name.trim()) {
      setError("Class name is required");
      return;
    }
    if (!form.division.trim()) {
      setError("Division is required");
      return;
    }
    if (!form.academic_year.trim()) {
      setError("Academic year is required");
      return;
    }
    if (!form.capacity || form.capacity < 1) {
      setError("Valid capacity is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        class_name: form.class_name,
        division: form.division,
        academic_year: form.academic_year,
        capacity: parseInt(form.capacity),
        class_teacher_id: form.class_teacher_id || null,
      };

      if (form.id) {
        await api.put(`classes/${form.id}/`, payload);
        setSuccess("Class updated successfully!");
      } else {
        await api.post("classes/", payload);
        setSuccess("Class created successfully!");
      }

      await loadData();
      handleCancel();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Save error:", err.response?.data);
      const data = err.response?.data;
      
      if (data?.non_field_errors) {
        setError(data.non_field_errors[0]);
      } else if (typeof data === 'object') {
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError("Failed to save class. Please try again.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (classId) => {
    try {
      await api.delete(`classes/${classId}/`);
      setSuccess("Class deleted successfully!");
      setShowDeleteModal(null);
      await loadData();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete class. It may have students enrolled.");
      setShowDeleteModal(null);
    }
  };

  const filteredClasses = classes.results.filter(c =>
    c.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.academic_year.includes(searchTerm)
  );
  const handleNextPage = () => {
  if (classes.next) {
    loadData(currentPage + 1);
  }
};

const handlePrevPage = () => {
  if (classes.previous) {
    loadData(currentPage - 1);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        < Backarrow />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Class Management</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Academic Management <ChevronRight size={14} /> <span className="text-indigo-600 font-bold">Classes</span>
            </p>
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold animate-in fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold animate-in fade-in">
            {success}
          </div>
        )}

        {/* FORM */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Plus size={24}/>
            </div>
            <h3 className="text-xl font-black text-slate-800">
              {form.id ? "Update Class" : "Create New Class"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormInput
              label="Class Name"
              name="class_name"
              value={form.class_name}
              onChange={handleChange}
              placeholder="e.g., Grade 10, Class 5"
              icon={<GraduationCap size={18}/>}
              required
            />
            <FormInput
              label="Division"
              name="division"
              value={form.division}
              onChange={handleChange}
              placeholder="e.g., A, B, C"
              icon={<Users size={18}/>}
              required
            />
            <FormInput
              label="Academic Year"
              name="academic_year"
              value={form.academic_year}
              onChange={handleChange}
              placeholder="e.g., 2024-2025"
              icon={<Calendar size={18}/>}
              required
            />
            <FormInput
              label="Capacity"
              name="capacity"
              type="number"
              value={form.capacity}
              onChange={handleChange}
              placeholder="Maximum students"
              icon={<Users size={18}/>}
              required
              min="1"
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Class Teacher
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-4 text-slate-300">
                  <User size={18}/>
                </div>
                <select
                  name="class_teacher_id"
                  value={form.class_teacher_id}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-100 rounded-[1.2rem] pl-11 pr-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="">No class teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullname}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex gap-4 pt-6 border-t border-slate-50">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18}/>
                    {form.id ? "Update Class" : "Create Class"}
                  </>
                )}
              </button>
              {form.id && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-slate-100 text-slate-600 px-8 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <X size={18}/> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* SEARCH */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* CLASSES LIST */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <GraduationCap size={48} className="mx-auto text-slate-300 mb-4"/>
              <h3 className="text-lg font-bold text-slate-600 mb-2">No Classes Yet</h3>
              <p className="text-sm text-slate-400">Create your first class using the form above</p>
            </div>
          ) : (
            filteredClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-slate-800 mb-1">
                      {classItem.class_name} - {classItem.division}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Calendar size={12}/> {classItem.academic_year}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedClass(classItem)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="View Details"
                    >
                      <Eye size={18}/>
                    </button>
                    <button
                      onClick={() => handleEdit(classItem)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Edit Class"
                    >
                      <Edit size={18}/>
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(classItem)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Class"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students</span>
                    <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-lg">
                      {classItem.student_count || 0} / {classItem.capacity}
                    </span>
                  </div>
                  
                  {classItem.class_teacher_details ? (
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Class Teacher</p>
                      <p className="text-sm font-bold text-slate-800">{classItem.class_teacher_details.fullname}</p>
                      <p className="text-xs text-slate-500">{classItem.class_teacher_details.email}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-400 italic">No class teacher assigned</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {!searchTerm && classes.results.length > 0 && (
  <div className="flex justify-center items-center gap-4 mt-8">
    <button
      onClick={handlePrevPage}
      disabled={!classes.previous}
      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      Previous
    </button>
    
    <span className="text-sm font-bold text-slate-600">
      Page {currentPage} of {Math.ceil(classes.count / 3)}
    </span>
    
    <button
      onClick={handleNextPage}
      disabled={!classes.next}
      className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      Next
    </button>
  </div>
)}
      {/* VIEW MODAL */}
      {selectedClass && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedClass(null)}
        >
          <div
            className="bg-white rounded-[2.5rem] max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-slate-800">Class Details</h2>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              <DetailRow label="Class Name" value={selectedClass.class_name} icon={<GraduationCap size={16}/>}/>
              <DetailRow label="Division" value={selectedClass.division} icon={<Users size={16}/>}/>
              <DetailRow label="Academic Year" value={selectedClass.academic_year} icon={<Calendar size={16}/>}/>
              <DetailRow label="Capacity" value={`${selectedClass.student_count || 0} / ${selectedClass.capacity} students`} icon={<Users size={16}/>}/>
              
              {selectedClass.class_teacher_details ? (
                <>
                  <DetailRow label="Class Teacher" value={selectedClass.class_teacher_details.fullname} icon={<User size={16}/>}/>
                  <DetailRow label="Teacher Email" value={selectedClass.class_teacher_details.email} icon={<User size={16}/>}/>
                </>
              ) : (
                <DetailRow label="Class Teacher" value="Not assigned" icon={<User size={16}/>}/>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteModal(null)}
        >
          <div
            className="bg-white rounded-[2.5rem] max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-black text-slate-800 mb-4">Delete Class?</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete <strong>{showDeleteModal.class_name} - {showDeleteModal.division}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(showDeleteModal.id)}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 transition-all"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormInput({ label, icon, required, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-300">{icon}</div>
        <input
          {...props}
          required={required}
          className="w-full bg-slate-50 border border-slate-100 rounded-[1.2rem] pl-11 pr-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon }) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}