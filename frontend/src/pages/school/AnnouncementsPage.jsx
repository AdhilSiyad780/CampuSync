import { useEffect, useState } from "react";
import { 
  Megaphone, Plus, Edit, Trash2, Eye, 
  Save, X, Calendar, Upload, Search, User, Link as LinkIcon 
} from "lucide-react";
import api from "../../api/axios";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState("idle"); // idle, view, edit, create
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", target_audience: "all", expiry_date: "", attachment: null
  });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("announcements/");
      setAnnouncements(res.data);
    } finally { setLoading(false); }
  };

  const handleCreateNew = () => {
    setForm({ title: "", description: "", target_audience: "all", expiry_date: "", attachment: null });
    setSelectedItem(null);
    setViewMode("create");
  };

  const handleEdit = (item) => {
    setForm({
      title: item.title,
      description: item.description,
      target_audience: item.target_audience,
      expiry_date: item.expiry_date ? item.expiry_date.slice(0, 16) : "",
      attachment: null // Reset attachment for edit
    });
    setSelectedItem(item);
    setViewMode("edit");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key]) data.append(key, form[key]);
    });

    try {
      if (viewMode === "create") await api.post("announcements/", data);
      else await api.put(`announcements/${selectedItem.id}/`, data);
      fetchAnnouncements();
      setViewMode("idle");
    } catch (err) { alert("Action failed."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      await api.delete(`announcements/${id}/`);
      fetchAnnouncements();
      setViewMode("idle");
    }
  };

  const filtered = announcements.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      
      {/* LEFT: THE LIST (Sidebar List) */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800">Broadcasts</h2>
            <button onClick={handleCreateNew} className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:scale-110 transition-transform">
              <Plus size={20}/>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm font-bold outline-none"
              placeholder="Search title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.map(item => (
            <div 
              key={item.id}
              onClick={() => { setSelectedItem(item); setViewMode("view"); }}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedItem?.id === item.id ? 'bg-blue-50 border-blue-100' : 'bg-white border-transparent hover:bg-slate-50'}`}
            >
              <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">{item.target_audience}</span>
              <h4 className="text-sm font-bold text-slate-800 truncate">{item.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: THE WORKSPACE (View/Edit/Create) */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {viewMode === "idle" && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="p-6 bg-slate-100 rounded-[2.5rem]"><Megaphone size={48}/></div>
            <p className="font-bold">Select an announcement to view details</p>
          </div>
        )}

        {(viewMode === "view" && selectedItem) && (
          <div className="max-w-3xl mx-auto p-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-10">
              <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase">{selectedItem.target_audience}</span>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(selectedItem)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-blue-600 transition-all"><Edit size={20}/></button>
                <button onClick={() => handleDelete(selectedItem.id)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-red-600 transition-all"><Trash2 size={20}/></button>
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-800 mb-6">{selectedItem.title}</h1>
            <div className="flex gap-6 text-slate-400 text-xs font-bold mb-10 pb-6 border-b border-slate-100">
              <span className="flex items-center gap-2"><User size={14}/> {selectedItem.author_name}</span>
              <span className="flex items-center gap-2"><Calendar size={14}/> Created: {new Date(selectedItem.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedItem.description}</p>
            {selectedItem.attachment && (
              <div className="mt-10 p-4 bg-white border border-slate-200 rounded-3xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><LinkIcon size={20}/></div>
                  <span className="text-sm font-bold text-slate-700">Attachment Included</span>
                </div>
                <a href={selectedItem.attachment} target="_blank" className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Download</a>
              </div>
            )}
          </div>
        )}

        {(viewMode === "edit" || viewMode === "create") && (
          <div className="max-w-2xl mx-auto p-12 animate-in zoom-in-95">
            <div className="flex items-center gap-4 mb-10">
              <button onClick={() => setViewMode(selectedItem ? "view" : "idle")} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600"><X size={20}/></button>
              <h2 className="text-2xl font-black text-slate-800">{viewMode === "edit" ? "Edit Broadcast" : "New Broadcast"}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Audience</label>
                <div className="grid grid-cols-4 gap-2">
                  {['all', 'teachers', 'students', 'parents'].map(role => (
                    <button key={role} type="button" onClick={() => setForm({...form, target_audience: role})}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${form.target_audience === role ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100'}`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                <textarea rows="6" className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <Input label="Expiry Date" type="datetime-local" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} />
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-center space-y-2">
                <Upload className="mx-auto text-slate-300" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase">Attach File (Optional)</p>
                <input type="file" onChange={e => setForm({...form, attachment: e.target.files[0]})} className="text-xs text-slate-500" />
              </div>
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Save size={18}/> {viewMode === "edit" ? "Update Broadcast" : "Post Announcement"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input {...props} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" />
    </div>
  );
}