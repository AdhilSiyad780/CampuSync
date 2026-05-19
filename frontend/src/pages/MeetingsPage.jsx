// pages/MeetingsPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Plus, Calendar, Users, X, Save } from "lucide-react";
import api from "../api/axios";
import { Backarrow } from '../componets/Backarrow'

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ title: "", scheduled_at: "", participant_ids: [] });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [meetRes, stuRes, teachRes] = await Promise.all([
        api.get("meetings/"),
        api.get("students/"),
        api.get("teachers/"),
      ]);
      setMeetings(meetRes.data);
      setStudents(stuRes.data?.results || stuRes.data || []);
      setTeachers(teachRes.data?.results || teachRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("meetings/", form);
      await fetchAll();
      setIsFormOpen(false);
      setForm({ title: "", scheduled_at: "", participant_ids: [] });
    } catch (err) {
      alert("Failed to create meeting");
    }
  };

  const toggleParticipant = (id) => {
    setForm(prev => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(id)
        ? prev.participant_ids.filter(p => p !== id)
        : [...prev.participant_ids, id]
    }));
  };

  const joinMeeting = (roomName) => {
    navigate(`/meeting/${roomName}`);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Backarrow />
            <div>
              <h1 className="text-3xl font-black text-slate-800">Meetings</h1>
              <p className="text-sm text-slate-500">Schedule and join video calls</p>
            </div>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            {isFormOpen ? <X size={18}/> : <Plus size={18}/>}
            {isFormOpen ? "Cancel" : "New Meeting"}
          </button>
        </div>

        {/* Create Form */}
        {isFormOpen && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 space-y-6">
            <h3 className="text-xl font-black text-slate-800">Schedule Meeting</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                placeholder="Meeting title"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => setForm({...form, scheduled_at: e.target.value})}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Participants */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Add Participants
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-50 rounded-2xl p-3">
                  {[...students, ...teachers].map(u => (
                    <label key={u.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-white transition-all">
                      <input
                        type="checkbox"
                        checked={form.participant_ids.includes(u.id)}
                        onChange={() => toggleParticipant(u.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-bold text-slate-700">{u.fullname}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black ml-auto">
                        {u.user_type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
              >
                <Save size={18}/> Create Meeting
              </button>
            </form>
          </div>
        )}

        {/* Meetings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.length === 0 ? (
            <div className="col-span-2 text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <Video size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="font-bold text-slate-500">No meetings scheduled yet</p>
            </div>
          ) : (
            meetings.map(m => (
              <div key={m.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Video size={20} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                    m.status === 'ongoing' ? 'bg-emerald-50 text-emerald-600' :
                    m.status === 'ended' ? 'bg-slate-100 text-slate-500' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">{m.title}</h3>
                <div className="space-y-1 mb-6">
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Calendar size={12} /> {new Date(m.scheduled_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Users size={12} /> {m.participant_count} participants · Host: {m.host_name}
                  </p>
                </div>
                <button
                  onClick={() => joinMeeting(m.room_name)}
                  disabled={m.status === 'ended'}
                  className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {m.status === 'ended' ? 'Meeting Ended' : 'Join Meeting'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}