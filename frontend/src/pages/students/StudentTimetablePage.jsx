// frontend/src/pages/students/StudentTimetablePage.jsx

import { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, User, Loader2, ChevronRight } from "lucide-react";
import api from "../../api/axios";
import { Backarrow } from "../../componets/Backarrow";

const DAYS = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
];

export default function StudentTimetablePage() {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Fixed the toLocaleDateString error as well
  const [selectedDay, setSelectedDay] = useState(
    DAYS.find(d => 
      d.value === new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    )?.value || 'monday'
  );

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      const res = await api.get('/timetable/my-timetable/');
      setTimetableData(res.data);
    } catch (err) {
      console.error("Load error:", err);
      setError(err.response?.data?.error || "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* CHANGED: Text color to violet-600 */}
        <Loader2 className="animate-spin text-violet-600" size={48} />
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
         <Backarrow/>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            My Timetable
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            Student Portal <ChevronRight size={14} /> 
            {/* CHANGED: Text color to violet-600 */}
            <span className="text-violet-600 font-bold">Class Schedule</span>
          </p>
        </div>

        {/* Student Info Card */}
        {/* CHANGED: Gradient from violet-500 to violet-600 */}
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-violet-200/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-black mb-2">{timetableData.student.name}</h2>
              {/* CHANGED: Text color to violet-100 */}
              <p className="text-violet-100 font-bold">
                {timetableData.class.name}
              </p>
              <div className="flex gap-4 mt-4 text-sm">
                <div>
                  {/* CHANGED: Text color to violet-200 */}
                  <span className="text-violet-200 font-medium">Roll No:</span>{" "}
                  <span className="font-black">{timetableData.student.roll_number}</span>
                </div>
                <div>
                  {/* CHANGED: Text color to violet-200 */}
                  <span className="text-violet-200 font-medium">Admission No:</span>{" "}
                  <span className="font-black">{timetableData.student.admission_number}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white/20 rounded-2xl">
              <Calendar size={32} />
            </div>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day) => {
            const daySchedule = timetableData.timetable[day.value] || [];
            const hasClasses = daySchedule.length > 0;
            
            return (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
            
                className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all ${
                  selectedDay === day.value
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-200/50'
                    : hasClasses
                    ? 'bg-white text-slate-700 border-2 border-slate-200 hover:border-violet-300'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <div className="text-xs uppercase tracking-wider">{day.short}</div>
                <div className="text-[10px] opacity-75">{hasClasses ? `${daySchedule.length} periods` : 'No classes'}</div>
              </button>
            );
          })}
        </div>

        {/* Schedule for Selected Day */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <h3 className="text-xl font-black text-slate-800 mb-6">
            {DAYS.find(d => d.value === selectedDay)?.label}'s Schedule
          </h3>

          {timetableData.timetable[selectedDay]?.length > 0 ? (
            <div className="space-y-4">
              {timetableData.timetable[selectedDay].map((period) => (
                <div
                  key={period.id}
                  className={`p-6 rounded-2xl border-2 ${
                    period.is_break
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-6">
                    {/* Time */}
                    <div className="flex-shrink-0 text-center">
                      <div className="w-20 p-3 bg-white rounded-xl border-2 border-slate-200">
                        <Clock size={20} className="mx-auto text-slate-400 mb-1" />
                        <p className="text-xs font-black text-slate-700">
                          {period.start_time}
                        </p>
                        <p className="text-[10px] text-slate-400">to</p>
                        <p className="text-xs font-black text-slate-700">
                          {period.end_time}
                        </p>
                      </div>
                    </div>

                    {/* Period Details */}
                    {period.is_break ? (
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-amber-600 mb-1">
                          {period.time_slot_name}
                        </h4>
                        <p className="text-sm text-amber-600 font-bold">Break Time</p>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-slate-800 mb-2">
                          {period.subject_name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            <span className="font-bold text-slate-700">
                              {period.teacher_name}
                            </span>
                          </div>
                          {period.room_number && (
                            <div className="flex items-center gap-2">
                              <BookOpen size={16} className="text-slate-400" />
                              <span className="font-bold text-slate-700">
                                {period.room_number}
                              </span>
                            </div>
                          )}
                          {/* CHANGED: Badge bg to violet-100 and text to violet-700 */}
                          <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg text-xs font-black uppercase">
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
      </div>
    </div>
  );
}