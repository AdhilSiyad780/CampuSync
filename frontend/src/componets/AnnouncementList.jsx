import { useEffect, useState, useCallback } from "react";
import { 
  Megaphone, Clock, User, Calendar, 
  Link as LinkIcon, Wifi, WifiOff, Loader2 ,Search
} from "lucide-react";
import api from '../api/axios';
import { useAnnouncementWebSocket } from "../hooks/useAnnouncementWebSocket";

export default function AnnouncementsList() {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Role Detection for Theming
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.user_type; 
  const theme = {
    admin: { color: "indigo", label: "Admin Board" },
    teacher: { color: "blue", label: "Staff Notices" },
    student: { color: "emerald", label: "Student Feed" },
    parent: { color: "purple", label: "Parent Updates" }
  }[role] || { color: "slate", label: "Broadcasts" };

  // 🔌 WebSocket Logic: Keeps the list updated in real-time
  const onAnnouncementUpdate = useCallback((payload) => {
    const { action, data, announcement_id } = payload;
    setAnnouncements(prev => {
      if (action === "created") return [data, ...prev.filter(a => a.id !== data.id)];
      if (action === "updated") return prev.map(a => a.id === data.id ? data : a);
      if (action === "deleted") return prev.filter(a => a.id !== announcement_id);
      return prev;
    });
    
    // Auto-update selected item if it changes while being viewed
    if (selectedItem?.id === (data?.id || announcement_id)) {
      if (action === "deleted") setSelectedItem(null);
      else setSelectedItem(data);
    }
  }, [selectedItem]);

  const { isConnected } = useAnnouncementWebSocket(onAnnouncementUpdate);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("announcements/");
      setAnnouncements(res.data);
    } finally { setLoading(false); }
  };

  const filtered = announcements.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner color={theme.color} />;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      
      {/* SIDEBAR LIST */}
      <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col shadow-sm">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{theme.label}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {isConnected ? 'Live Sync' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold outline-none" 
              placeholder="Search announcements..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map(item => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className={`p-4 rounded-3xl cursor-pointer transition-all border-2 ${
                selectedItem?.id === item.id 
                ? `bg-${theme.color}-50 border-${theme.color}-200` 
                : 'bg-white border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                 <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter bg-${theme.color}-100 text-${theme.color}-700`}>
                   {item.target_audience}
                 </span>
                 <p className="text-[9px] text-slate-400 font-bold">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <h4 className="text-sm font-black text-slate-800 truncate leading-tight">{item.title}</h4>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-xs font-bold text-slate-400">No broadcasts to show.</div>
          )}
        </div>
      </div>

      {/* READING WORKSPACE */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {!selectedItem ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <div className={`p-8 bg-white rounded-[2.5rem] shadow-sm mb-4 text-${theme.color}-100`}>
              <Megaphone size={48} />
            </div>
            <p className="font-black text-[10px] uppercase tracking-[0.2em]">Select an announcement to read</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-16 px-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="mb-10">
              <span className={`px-4 py-1.5 bg-${theme.color}-50 text-${theme.color}-700 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                Official Notice
              </span>
            </div>
            
            <h1 className="text-5xl font-black text-slate-800 mb-8 leading-[1.1] tracking-tight">
              {selectedItem.title}
            </h1>
            
            <div className="flex items-center gap-6 text-slate-400 text-[10px] font-black uppercase border-b border-slate-100 pb-8 mb-8">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600">
                 <User size={12}/> {selectedItem.author_name}
               </div>
               <div className="flex items-center gap-2">
                 <Clock size={12}/> {new Date(selectedItem.created_at).toLocaleDateString()}
               </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap font-medium">
              {selectedItem.description}
            </p>
            
            {selectedItem.attachment && (
              <a 
                href={selectedItem.attachment} 
                target="_blank" 
                rel="noreferrer" 
                className={`mt-12 flex items-center justify-between p-5 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-${theme.color}-100 transition-all group`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-${theme.color}-50 rounded-2xl text-${theme.color}-600`}>
                    <LinkIcon size={20}/>
                  </div>
                  <span className="text-sm font-black text-slate-700">View Attachment</span>
                </div>
                <span className={`text-[10px] font-black text-${theme.color}-600 px-4 py-2 bg-${theme.color}-50 rounded-xl group-hover:bg-${theme.color}-600 group-hover:text-white transition-all uppercase`}>
                  Open
                </span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner({ color }) {
  return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className={`animate-spin text-${color}-600`} size={48} />
    </div>
  );
}