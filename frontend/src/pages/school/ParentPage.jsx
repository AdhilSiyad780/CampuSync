import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, Calendar, Briefcase, 
  Users, Plus, Edit, Eye, Save, X, ChevronRight, 
  PhoneCall, GraduationCap 
} from "lucide-react";
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
    DOB: '',
    relations: [], 
  });

  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [studRes, parRes] = await Promise.all([
          api.get("students/"),
          api.get("parents/")
        ]);
        setStudents(studRes.data || []);
        setParents(parRes.data || []);
      } catch (err) {
        if (err.response?.status === 401) navigate("/login");
        setError("Failed to synchronize data.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); 
    setSuccess("");
  };

  const handleToggleStudent = (studentId) => {
    setForm((prev) => {
      const exists = prev.relations.find((r) => r.student_id === studentId);
      if (exists) {
        return { ...prev, relations: prev.relations.filter((r) => r.student_id !== studentId) };
      } else {
        return {
          ...prev,
          relations: [...prev.relations, {
            student_id: studentId,
            relation_type: "other",
            is_primary: prev.relations.length === 0,
          }],
        };
      }
    });
  };

  const handleRelationChange = (studentId, field, value) => {
    setForm((prev) => {
      let updated = prev.relations.map((r) => {
        if (r.student_id !== studentId) return r;
        return { ...r, [field]: value };
      });
      if (field === "is_primary" && value === true) {
        updated = updated.map(r => r.student_id === studentId ? r : { ...r, is_primary: false });
      }
      return { ...prev, relations: updated };
    });
  };

  const handleEdit = (parent) => {
    setForm({
      id: parent.id,
      fullname: parent.fullname || "",
      email: parent.email || "",
      phone: parent.phone || "",
      DOB: parent.DOB || "",
      contact_number: parent.contact_number || "",
      whatsapp_number: parent.whatsapp_number || "",
      occupation: parent.occupation || "",
      relations: parent.relations?.map(rel => ({
        student_id: rel.student_id,
        relation_type: rel.relation_type,
        is_primary: rel.is_primary,
      })) || [],
    });
    setSelectedParent(null);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setForm({
      id: null, 
      fullname: "", 
      email: "", 
      phone: "", 
      contact_number: "", 
      whatsapp_number: "", 
      occupation: "", 
      DOB: '', 
      relations: []
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Frontend validation
    if (!form.DOB) {
      setError("Date of birth is required");
      return;
    }

    if (!form.fullname.trim()) {
      setError("Full name is required");
      return;
    }

    if (!form.email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!form.contact_number.trim()) {
      setError("Contact number is required");
      return;
    }

    setSaving(true); 
    setError(""); 
    setSuccess("");

    try {
      const payload = { 
        ...form, 
        DOB: form.DOB || null
      };
      
      if (form.id) {
        await api.put(`parents/${form.id}/`, payload);
        setSuccess("Information updated successfully.");
      } else {
        await api.post("parents/", payload);
        setSuccess("New parent registered successfully.");
      }
      
      const res = await api.get("parents/");
      setParents(res.data);
      handleCancel();
      
      // Scroll to success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Save error:", err.response?.data);
      const data = err.response?.data;
      
      // Better error handling with specific field errors
      if (data?.DOB) {
        setError(`Date of Birth: ${Array.isArray(data.DOB) ? data.DOB[0] : data.DOB}`);
      } else if (data?.email) {
        setError(`Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`);
      } else if (data?.fullname) {
        setError(`Full Name: ${Array.isArray(data.fullname) ? data.fullname[0] : data.fullname}`);
      } else if (data?.contact_number) {
        setError(`Contact Number: ${Array.isArray(data.contact_number) ? data.contact_number[0] : data.contact_number}`);
      } else if (data?.relations) {
        setError(`Relations: ${Array.isArray(data.relations) ? data.relations[0] : data.relations}`);
      } else if (data?.non_field_errors) {
        setError(data.non_field_errors[0]);
      } else if (data?.detail) {
        setError(data.detail);
      } else {
        setError("Failed to save parent details. Please check all required fields.");
      }
      
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Parent Directory</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              School Management <ChevronRight size={14} /> <span className="text-blue-600 font-bold">Parents</span>
            </p>
          </div>
          <button 
            onClick={() => navigate("/dashboard")} 
            className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
            {success}
          </div>
        )}

        {/* REGISTRATION FORM */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 overflow-hidden">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
             <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
               <Plus size={24}/>
             </div>
             <h3 className="text-xl font-black text-slate-800">
               {form.id ? "Update Parent Record" : "Register New Parent"}
             </h3>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FormInput 
              label="Full Name" 
              name="fullname" 
              value={form.fullname} 
              onChange={handleChange} 
              icon={<User size={18}/>} 
              required 
            />
            <FormInput 
              label="Email Address" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              icon={<Mail size={18}/>} 
              type="email" 
              required 
            />
            <FormInput 
              label="Date of Birth" 
              name="DOB" 
              value={form.DOB} 
              onChange={handleChange} 
              icon={<Calendar size={18}/>} 
              type="date" 
              required 
            />
            <FormInput 
              label="Contact Number" 
              name="contact_number" 
              value={form.contact_number} 
              onChange={handleChange} 
              icon={<PhoneCall size={18}/>} 
              required 
            />
            <FormInput 
              label="WhatsApp Number" 
              name="whatsapp_number" 
              value={form.whatsapp_number} 
              onChange={handleChange} 
              icon={<Phone size={18}/>} 
            />
            <FormInput 
              label="Occupation" 
              name="occupation" 
              value={form.occupation} 
              onChange={handleChange} 
              icon={<Briefcase size={18}/>} 
            />

            <div className="md:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                Linked Students
              </label>
              {students.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Users size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No students available</p>
                  <p className="text-xs text-slate-400 mt-1">Add students first to link them with parents</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                  {students.map((s) => {
                    const rel = form.relations.find(r => r.student_id === s.id);
                    return (
                      <div 
                        key={s.id} 
                        className={`p-4 rounded-[1.5rem] border transition-all ${
                          rel ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!!rel} 
                            onChange={() => handleToggleStudent(s.id)} 
                            className="w-5 h-5 rounded-lg text-blue-600 border-slate-300 focus:ring-0" 
                          />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 leading-none">
                              {s.fullname}
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">
                              {s.admission_number}
                            </p>
                          </div>
                        </label>
                        {rel && (
                          <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between gap-2">
                             <select 
                               name="relation_type" 
                               value={rel.relation_type} 
                               onChange={(e) => handleRelationChange(s.id, "relation_type", e.target.value)} 
                               className="text-[10px] font-bold uppercase bg-white border border-blue-200 rounded-lg px-2 py-1 outline-none"
                             >
                                {RELATION_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                             </select>
                             <label className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase cursor-pointer">
                                <input 
                                  type="radio" 
                                  checked={rel.is_primary} 
                                  onChange={() => handleRelationChange(s.id, "is_primary", true)} 
                                /> 
                                Primary
                             </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-3 flex gap-4 pt-6 border-t border-slate-50">
              <button 
                type="submit" 
                disabled={saving} 
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18}/> 
                    {form.id ? "Update Record" : "Register Parent"}
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

        {/* LIST SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parents.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 p-12 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-600 mb-2">No Parents Yet</h3>
              <p className="text-sm text-slate-400">Register your first parent using the form above</p>
            </div>
          ) : (
            parents.map((p) => (
              <div 
                key={p.id} 
                className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl">
                      {p.fullname.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedParent(p)} 
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="View Details"
                      >
                        <Eye size={18}/>
                      </button>
                      <button 
                        onClick={() => handleEdit(p)} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Edit Parent"
                      >
                        <Edit size={18}/>
                      </button>
                    </div>
                 </div>
                 <h4 className="text-lg font-black text-slate-800 mb-1">{p.fullname}</h4>
                 <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1">
                   <Mail size={12}/> {p.email}
                 </p>
                 
                 <div className="space-y-3 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Children
                      </span>
                      <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                        {p.relations?.length || 0}
                      </span>
                    </div>
                    {p.relations && p.relations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {p.relations.map(r => (
                          <span 
                            key={r.id} 
                            className="text-[9px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase"
                          >
                            {r.student_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No children linked</p>
                    )}
                 </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PARENT DETAILS MODAL */}
      {selectedParent && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedParent(null)}
        >
          <div 
            className="bg-white rounded-[2.5rem] max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-slate-800">Parent Details</h2>
              <button 
                onClick={() => setSelectedParent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              <DetailRow label="Full Name" value={selectedParent.fullname} icon={<User size={16}/>} />
              <DetailRow label="Email" value={selectedParent.email} icon={<Mail size={16}/>} />
              <DetailRow label="Date of Birth" value={selectedParent.DOB || "Not provided"} icon={<Calendar size={16}/>} />
              <DetailRow label="Contact Number" value={selectedParent.contact_number} icon={<PhoneCall size={16}/>} />
              <DetailRow label="WhatsApp Number" value={selectedParent.whatsapp_number || "Not provided"} icon={<Phone size={16}/>} />
              <DetailRow label="Occupation" value={selectedParent.occupation || "Not provided"} icon={<Briefcase size={16}/>} />
              
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Linked Students
                </p>
                {selectedParent.relations && selectedParent.relations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedParent.relations.map(rel => (
                      <div 
                        key={rel.id} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{rel.student_name}</p>
                          <p className="text-xs text-slate-500">Relation: {rel.relation_type}</p>
                        </div>
                        {rel.is_primary && (
                          <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No students linked</p>
                )}
              </div>
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
          className="w-full bg-slate-50 border border-slate-100 rounded-[1.2rem] pl-11 pr-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
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