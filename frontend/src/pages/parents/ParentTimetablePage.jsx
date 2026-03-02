// frontend/src/pages/parents/ParentTimetablePage.jsx

import { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, User, Loader2, ChevronRight, Users } from "lucide-react";
import api from "../../api/axios";

const DAYS = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
];

export default function ParentTimetablePage() {
  const [timetableData, setTimetableData] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTimetables();
  }, []);

  const loadTimetables = async () => {
    try {
      const res = await api.get('/timetable/children/');
      setTimetableData(res.data);
      
      // Select first child by default
      if (res.data.children && res.data.children.length > 0) {
        setSelectedChild(res.data.children[0]);
      }
    } catch (err) {
      console.error("Load error:", err);
      setError(err.response?.data?.error || "Failed to load timetables");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
          <p className="text-red-700 font-bold text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Children's Timetables
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            Parent Portal <ChevronRight size={14} /> 
            <span className="text-purple-600 font-bold">Class Schedules</span>
          </p>
        </div>

        {/* Children Selector */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Users size={20} />
            Select Child ({timetableData.children_count})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timetableData.children.map((child) => (
              <button
                key={child.student.id}
                onClick={() => setSelectedChild(child)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  selectedChild?.student.id === child.student.id
                    ? 'bg-purple-50 border-purple-500'
                    : 'bg-slate-50 border-slate-200 hover:border-purple-300'
                }`}
              >
                <h4 className="font-black text-slate-800 mb-1">
                  {child.student.name}
                </h4>
                {child.class ? (
                  <>
                    <p className="text-sm text-purple-600 font-bold">
                      {child.class.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Roll No: {child.student.roll_number}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-amber-600 font-bold">{child.message}</p>
                )}
                <span className="inline-block mt-2 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase">
                  {child.student.relation}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Timetable Display */}
        {selectedChild && selectedChild.timetable && (
          <>
            {/* Day Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {DAYS.map((day) => {
                const daySchedule = selectedChild.timetable[day.value] || [];
                const hasClasses = daySchedule.length > 0;
                
                return (
                  <button
                    key={day.value}
                    onClick={() => setSelectedDay(day.value)}
                    className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all ${
                      selectedDay === day.value
                        ? 'bg-purple-600 text-white shadow-lg'
                        : hasClasses
                        ? 'bg-white text-slate-700 border-2 border-slate-200 hover:border-purple-300'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wider">{day.short}</div>
                    <div className="text-[10px] opacity-75">{hasClasses ? `${daySchedule.length} periods` : 'No classes'}</div>
                  </button>
                );
              })}
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <h3 className="text-xl font-black text-slate-800 mb-6">
                {selectedChild.student.name}'s {DAYS.find(d => d.value === selectedDay)?.label} Schedule
              </h3>

              {selectedChild.timetable[selectedDay]?.length > 0 ? (
                <div className="space-y-4">
                  {selectedChild.timetable[selectedDay].map((period) => (
                    <div
                      key={period.id}
                      className={`p-6 rounded-2xl border-2 ${
                        period.is_break
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 text-center">
                          <div className="w-20 p-3 bg-white rounded-xl border-2 border-slate-200">
                            <Clock size={20} className="mx-auto text-slate-400 mb-1" />
                            <p className="text-xs font-black text-slate-700">{period.start_time}</p>
                            <p className="text-[10px] text-slate-400">to</p>
                            <p className="text-xs font-black text-slate-700">{period.end_time}</p>
                          </div>
                        </div>

                        {period.is_break ? (
                          <div className="flex-1">
                            <h4 className="text-xl font-black text-amber-600 mb-1">{period.time_slot_name}</h4>
                            <p className="text-sm text-amber-600 font-bold">Break Time</p>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <h4 className="text-xl font-black text-slate-800 mb-2">{period.subject_name}</h4>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User size={16} className="text-slate-400" />
                                <span className="font-bold text-slate-700">{period.teacher_name}</span>
                              </div>
                              {period.room_number && (
                                <div className="flex items-center gap-2">
                                  <BookOpen size={16} className="text-slate-400" />
                                  <span className="font-bold text-slate-700">{period.room_number}</span>
                                </div>
                              )}
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-black uppercase">
                                {period.subject_code}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-bold">No classes scheduled for this day</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}