import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Mail, Phone, Calendar, Briefcase, 
  Users, Plus, Edit, Eye, Save, X, ChevronRight, 
  PhoneCall, GraduationCap, ShieldCheck, Heart, Trash2
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
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    init();
  }, [navigate]);

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
      setError("Failed to synchronize directory data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); setSuccess("");
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
    setIsFormOpen(true);
    setSelectedParent(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");

    try {
      const payload = { ...form, DOB: form.DOB || null };
      if (form.id) {
        await api.put(`parents/${form.id}/`, payload);
        setSuccess("Parent record updated successfully.");
      } else {
        await api.post("parents/", payload);
        setSuccess("New parent registered and credentials sent.");
      }
      const res = await api.get("parents/");
      setParents(res.data);
      setIsFormOpen(false);
      resetLocalForm();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.email ? "Email already exists." : "Validation failed. Please check required fields.");
    } finally {
      setSaving(false);
    }
  };

  const resetLocalForm = () => {
    setForm({ id: null, fullname: "", email: "", phone: "", contact_number: "", whatsapp_number: "", occupation: "", DOB: '', relations: [] });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Parent Directory</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              Academic Admin <ChevronRight size={14} /> <span className="text-blue-600 font-bold">Parents Management</span>
            </p>
          </div>
          <button 
            onClick={() => { resetLocalForm(); setIsFormOpen(!isFormOpen); }}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            {isFormOpen ? <X size={20}/> : <Plus size={20}/>}
            {isFormOpen ? "Close Form" : "Register Parent"}
          </button>
        </div>

        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">{success}</div>}
        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">{error}</div>}

        {/* REGISTRATION FORM (EXPANDABLE) */}
        {isFormOpen && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-500">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center px-8">
              <h3 className="text-white font-black text-xl flex items-center gap-3">
                <Plus className="bg-white/20 p-1.5 rounded-lg" />
                {form.id ? "Edit Parent Profile" : "Parent Registration"}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Full Name" name="fullname" value={form.fullname} onChange={handleChange} icon={<User size={18}/>} placeholder="John Doe" />
                <InputGroup label="Email Address" name="email" value={form.email} onChange={handleChange} icon={<Mail size={18}/>} type="email" placeholder="john@example.com" />
                <InputGroup label="Date of Birth" name="DOB" value={form.DOB} onChange={handleChange} icon={<Calendar size={18}/>} type="date" />
                <InputGroup label="Phone (Login)" name="phone" value={form.phone} onChange={handleChange} icon={<Phone size={18}/>} />
                <InputGroup label="Primary Contact" name="contact_number" value={form.contact_number} onChange={handleChange} icon={<PhoneCall size={18}/>} />
                <InputGroup label="WhatsApp" name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange} icon={<Heart size={18}/>} />
                <InputGroup label="Occupation" name="occupation" value={form.occupation} onChange={handleChange} icon={<Briefcase size={18}/>} className="md:col-span-2" />
              </div>

              {/* SIDEBAR LINKING */}
              <div className="lg:col-span-4 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Link Students</label>
                <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-4 max-h-[400px] overflow-y-auto space-y-2">
                  {students.map(s => {
                    const rel = form.relations.find(r => r.student_id === s.id);
                    return (
                      <div key={s.id} className={`p-4 rounded-2xl border transition-all ${rel ? 'bg-white border-blue-200 shadow-sm' : 'border-transparent'}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={!!rel} onChange={() => handleToggleStudent(s.id)} className="w-5 h-5 rounded-lg text-blue-600 border-slate-300" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{s.fullname}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase">{s.admission_number}</p>
                          </div>
                        </label>
                        {rel && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <select value={rel.relation_type} onChange={e => handleRelationChange(s.id, 'relation_type', e.target.value)} className="text-[10px] font-bold uppercase bg-slate-100 border-none rounded-lg px-2 py-1 outline-none">
                              {RELATION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <label className="flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase">
                              <input type="radio" checked={rel.is_primary} onChange={() => handleRelationChange(s.id, 'is_primary', true)} /> Primary
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <button type="submit" disabled={saving} className="w-full bg-[#1E293B] text-white py-4 rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 hover:bg-slate-800">
                   {saving ? "Saving..." : <><Save size={18}/> {form.id ? "Update Record" : "Save Parent"}</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST SECTION - GRID STYLE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parents.map((p) => (
            <div key={p.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
               <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black">
                    {p.fullname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedParent(p)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Eye size={18}/></button>
                    <button onClick={() => handleEdit(p)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit size={18}/></button>
                    <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                  </div>
               </div>
               
               <h4 className="text-xl font-black text-slate-800 tracking-tight">{p.fullname}</h4>
               <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1 truncate"><Mail size={14} className="text-slate-300"/> {p.email}</p>
               
               <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Children</span>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase">{p.relations?.length || 0} Students</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.relations?.map(r => (
                      <div key={r.id} className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                        <span className="text-[10px] font-bold text-slate-600">{r.student_name}</span>
                        {r.is_primary && <ShieldCheck size={10} className="text-emerald-500"/>}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL MODAL (MODERN VIEW) */}
      {selectedParent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setSelectedParent(null)}>
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 right-0 p-10 opacity-5"><Users size={120}/></div>
            <button onClick={() => setSelectedParent(null)} className="absolute top-8 right-8 text-slate-400 hover:text-red-500"><X size={24}/></button>
            
            <h2 className="text-3xl font-black text-slate-800 mb-8">Parent Profile</h2>
            <div className="grid grid-cols-2 gap-8 mb-10">
              <DetailItem label="Full Name" value={selectedParent.fullname} icon={<User size={18}/>} />
              <DetailItem label="Email" value={selectedParent.email} icon={<Mail size={18}/>} />
              <DetailItem label="Contact" value={selectedParent.contact_number} icon={<PhoneCall size={18}/>} />
              <DetailItem label="WhatsApp" value={selectedParent.whatsapp_number} icon={<Phone size={18}/>} />
              <DetailItem label="Occupation" value={selectedParent.occupation} icon={<Briefcase size={18}/>} />
              <DetailItem label="DOB" value={selectedParent.DOB} icon={<Calendar size={18}/>} />
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><GraduationCap size={14}/> Academic Relations</h4>
               <div className="space-y-3">
                  {selectedParent.relations?.map(rel => (
                    <div key={rel.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
                      <span className="text-sm font-bold text-slate-800">{rel.student_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-lg">{rel.relation_type}</span>
                        {rel.is_primary && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Primary</span>}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, icon, className, ...props }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-300 transition-colors group-focus-within:text-blue-500">{icon}</div>
        <input {...props} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
      </div>
    </div>
  );
}

function DetailItem({ label, value, icon }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-800">{value || "—"}</p>
      </div>
    </div>
  );
}