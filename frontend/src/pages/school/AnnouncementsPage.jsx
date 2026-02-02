// pages/AnnouncementsPage.jsx

import { useEffect, useState, useCallback } from "react";
import { 
  Megaphone, Plus, Edit, Trash2, Eye, 
  Save, X, Calendar, Upload, Search, User, Link as LinkIcon,
  Wifi, WifiOff, RefreshCw
} from "lucide-react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useAnnouncementWebSocket } from "../../hooks/useAnnouncementWebSocket";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState("idle"); // idle, view, edit, create
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "", description: "", target_audience: "all", expiry_date: "", attachment: null
  });

  useEffect(() => { 
    fetchAnnouncements();
    requestNotificationPermission();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("announcements/");
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally { 
      setLoading(false); 
    }
  };

  // Request browser notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Show browser notification
  const showBrowserNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { 
        body,
        icon: '/logo.png', // Add your school logo
        badge: '/badge.png'
      });
    }
  };

  // Show in-app notification
  const showInAppNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // Handle real-time WebSocket updates
  const handleAnnouncementUpdate = useCallback((data) => {
    const { action, data: announcement } = data;

    console.log('📢 Real-time update received:', action, announcement);

    switch (action) {
      case 'created':
        // Add new announcement to the top of the list
        setAnnouncements(prev => {
          // Check if announcement already exists (prevent duplicates)
          const exists = prev.some(item => item.id === announcement.id);
          if (exists) return prev;
          return [announcement, ...prev];
        });
        
        // Show notifications
        showBrowserNotification(
          '📢 New Announcement!', 
          announcement.title
        );
        showInAppNotification(`New announcement: ${announcement.title}`);
        
        // Play sound (optional)
        playNotificationSound();
        break;

      case 'updated':
        // Update existing announcement
        setAnnouncements(prev => 
          prev.map(item => 
            item.id === announcement.id ? announcement : item
          )
        );
        
        // Update selected item if it's currently being viewed
        if (selectedItem?.id === announcement.id) {
          setSelectedItem(announcement);
        }
        
        showInAppNotification(`Announcement updated: ${announcement.title}`);
        break;

      case 'deleted':
        // Remove announcement from list
        setAnnouncements(prev => 
          prev.filter(item => item.id !== announcement.id)
        );
        
        // Close view if deleted item was selected
        if (selectedItem?.id === announcement.id) {
          setViewMode('idle');
          setSelectedItem(null);
        }
        
        showInAppNotification('An announcement was deleted');
        break;

      default:
        break;
    }
  }, [selectedItem]);

  // Connect to WebSocket
  const { isConnected, reconnect } = useAnnouncementWebSocket(handleAnnouncementUpdate);

  // Optional: Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3'); // Add a notification sound file
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play sound:', e));
    } catch (err) {
      console.log('Sound playback failed:', err);
    }
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
      attachment: null
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
      if (viewMode === "create") {
        const res = await api.post("announcements/", data);
        // No need to manually update state - WebSocket will handle it
      } else {
        const res = await api.put(`announcements/${selectedItem.id}/`, data);
        // WebSocket will update the announcement
      }
      setViewMode("idle");
      showInAppNotification(
        viewMode === "create" 
          ? "Announcement created successfully!" 
          : "Announcement updated successfully!"
      );
    } catch (err) { 
      console.error("Action failed:", err);
      alert("Action failed. Please try again."); 
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      try {
        await api.delete(`announcements/${id}/`);
        // WebSocket will handle removal from list
        setViewMode("idle");
        showInAppNotification("Announcement deleted successfully!");
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Delete failed. Please try again.");
      }
    }
  };

  const filtered = announcements.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden relative">
      
      {/* IN-APP NOTIFICATION */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-md">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Megaphone className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">{notificationMessage}</p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* LEFT: THE LIST (Sidebar List) */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-800">Broadcasts</h2>
              {/* WebSocket Status Indicator */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full" title="Connected">
                    <Wifi size={12} className="text-emerald-600" />
                    <span className="text-[9px] font-black text-emerald-600 uppercase">Live</span>
                  </div>
                ) : (
                  <button 
                    onClick={reconnect}
                    className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full hover:bg-red-100 transition-colors" 
                    title="Disconnected - Click to reconnect"
                  >
                    <WifiOff size={12} className="text-red-600" />
                    <RefreshCw size={10} className="text-red-600" />
                  </button>
                )}
              </div>
            </div>
            <button 
              onClick={handleCreateNew} 
              className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:scale-110 transition-transform"
            >
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
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Megaphone className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-400 font-bold text-sm">
                {searchTerm ? "No matching announcements" : "No announcements yet"}
              </p>
            </div>
          ) : (
            filtered.map(item => (
              <div 
                key={item.id}
                onClick={() => { setSelectedItem(item); setViewMode("view"); }}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  selectedItem?.id === item.id 
                    ? 'bg-blue-50 border-blue-100' 
                    : 'bg-white border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">
                    {item.target_audience}
                  </span>
                  {item.is_active && (
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" title="Active"></span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-800 truncate">{item.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  <span className="text-[10px] text-slate-300">•</span>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {item.author_name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: THE WORKSPACE (View/Edit/Create) */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {viewMode === "idle" && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="p-6 bg-slate-100 rounded-[2.5rem]">
              <Megaphone size={48}/>
            </div>
            <p className="font-bold">Select an announcement to view details</p>
            {!isConnected && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <WifiOff size={16} className="text-amber-600" />
                <p className="text-xs font-bold text-amber-700">
                  Real-time updates disconnected
                </p>
                <button 
                  onClick={reconnect}
                  className="ml-2 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                >
                  Reconnect
                </button>
              </div>
            )}
          </div>
        )}

        {(viewMode === "view" && selectedItem) && (
          <div className="max-w-3xl mx-auto p-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase">
                  {selectedItem.target_audience}
                </span>
                {selectedItem.is_active ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-black uppercase">
                    Expired
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(selectedItem)} 
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-blue-600 transition-all"
                >
                  <Edit size={20}/>
                </button>
                <button 
                  onClick={() => handleDelete(selectedItem.id)} 
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-red-600 transition-all"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-800 mb-6">{selectedItem.title}</h1>
            <div className="flex gap-6 text-slate-400 text-xs font-bold mb-10 pb-6 border-b border-slate-100">
              <span className="flex items-center gap-2">
                <User size={14}/> {selectedItem.author_name}
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={14}/> Created: {new Date(selectedItem.created_at).toLocaleDateString()}
              </span>
              {selectedItem.expiry_date && (
                <span className="flex items-center gap-2">
                  <Calendar size={14}/> Expires: {new Date(selectedItem.expiry_date).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedItem.description}</p>
            {selectedItem.attachment && (
              <div className="mt-10 p-4 bg-white border border-slate-200 rounded-3xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <LinkIcon size={20}/>
                  </div>
                  <span className="text-sm font-bold text-slate-700">Attachment Included</span>
                </div>
                <a 
                  href={selectedItem.attachment} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  Download
                </a>
              </div>
            )}
          </div>
        )}

        {(viewMode === "edit" || viewMode === "create") && (
          <div className="max-w-2xl mx-auto p-12 animate-in zoom-in-95">
            <div className="flex items-center gap-4 mb-10">
              <button 
                onClick={() => setViewMode(selectedItem ? "view" : "idle")} 
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600"
              >
                <X size={20}/>
              </button>
              <h2 className="text-2xl font-black text-slate-800">
                {viewMode === "edit" ? "Edit Broadcast" : "New Broadcast"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Target Audience
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['all', 'teachers', 'students', 'parents'].map(role => (
                    <button 
                      key={role} 
                      type="button" 
                      onClick={() => setForm({...form, target_audience: role})}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        form.target_audience === role 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              <Input 
                label="Title" 
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                required
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Description
                </label>
                <textarea 
                  rows="6" 
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  required
                />
              </div>
              <Input 
                label="Expiry Date" 
                type="datetime-local" 
                value={form.expiry_date} 
                onChange={e => setForm({...form, expiry_date: e.target.value})}
                required
              />
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-center space-y-2">
                <Upload className="mx-auto text-slate-300" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  Attach File (Optional)
                </p>
                <input 
                  type="file" 
                  onChange={e => setForm({...form, attachment: e.target.files[0]})} 
                  className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18}/> 
                {viewMode === "edit" ? "Update Broadcast" : "Post Announcement"}
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
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      <input 
        {...props} 
        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
      />
    </div>
  );
}