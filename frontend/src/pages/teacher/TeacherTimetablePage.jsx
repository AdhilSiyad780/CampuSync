// frontend/src/pages/teacher/TeacherTimetablePage.jsx

import { useState, useEffect } from "react";
import { 
  Calendar, Clock, BookOpen, Users, Loader2, ChevronRight, 
  Award, TrendingUp, Briefcase
} from "lucide-react";
import api from "../../api/axios";

const DAYS = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
];

export default function TeacherTimetablePage() {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Get current day in lowercase format
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const [selectedDay, setSelectedDay] = useState(
    DAYS.find(d => d.value === currentDay)?.value || 'monday'
  );

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      const res = await api.get('/timetable/my-schedule/');
      setTimetableData(res.data);
    } catch (err) {
      console.error("Load error:", err);
      setError(err.response?.data?.error || "Failed to load timetable");
      console.log(err.response?.data)
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
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

  // Handle case where teacher has no classes
  if (!timetableData?.timetable) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-12 text-center">
            <Calendar size={64} className="mx-auto text-slate-300 mb-4" />
            <h2 className="text-2xl font-black text-slate-800 mb-2">No Classes Assigned</h2>
            <p className="text-slate-500">{timetableData?.message || "You don't have any classes assigned yet."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            My Teaching Schedule
          </h1>
          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
            Faculty Portal <ChevronRight size={14} /> 
            <span className="text-blue-600 font-bold">Weekly Timetable</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Briefcase size={20} />}
            label="Total Classes"
            value={timetableData.stats?.total_classes || 0}
            color="blue"
          />
          <StatCard
            icon={<BookOpen size={20} />}
            label="Subjects"
            value={timetableData.stats?.unique_subjects || 0}
            color="emerald"
          />
          <StatCard
            icon={<Users size={20} />}
            label="Classes"
            value={timetableData.stats?.classes_taught || 0}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Busiest Day"
            value={timetableData.stats?.busiest_day ? 
              DAYS.find(d => d.value === timetableData.stats.busiest_day)?.short || 'N/A' : 'N/A'
            }
            color="indigo"
            subtext={timetableData.stats?.busiest_day && timetableData.stats?.periods_per_day ? 
              `${timetableData.stats.periods_per_day[timetableData.stats.busiest_day] || 0} periods` : ''
            }
          />
        </div>

        {/* Day Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day) => {
            const daySchedule = timetableData.timetable?.[day.value] || [];
            const hasClasses = daySchedule.length > 0;
            
            return (
              <button
                key={day.value}
                onClick={() => setSelectedDay(day.value)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold transition-all ${
                  selectedDay === day.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : hasClasses
                    ? 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-300'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <div className="text-xs uppercase tracking-wider">{day.short}</div>
                <div className="text-[10px] opacity-75">
                  {hasClasses ? `${daySchedule.length} periods` : 'Free day'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Schedule for Selected Day */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-800">
              {DAYS.find(d => d.value === selectedDay)?.label}'s Schedule
            </h3>
            <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold">
              {timetableData.timetable?.[selectedDay]?.length || 0} Classes
            </span>
          </div>

          {timetableData.timetable?.[selectedDay]?.length > 0 ? (
            <div className="space-y-4">
              {timetableData.timetable[selectedDay].map((period) => (
                <div
                  key={period.id}
                  className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start gap-6">
                    {/* Time */}
                    <div className="flex-shrink-0 text-center">
                      <div className="w-24 p-3 bg-white rounded-xl border-2 border-slate-200">
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
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-xl font-black text-slate-800 mb-1">
                            {period.subject_name}
                          </h4>
                          <p className="text-sm text-blue-600 font-bold">
                            {period.class_name}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black uppercase">
                          {period.subject_code}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-slate-400" />
                          <span className="font-bold text-slate-700">
                            Class {period.class_name}
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
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" />
                          <span className="font-bold text-slate-700">
                            {period.time_slot_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">No classes scheduled for this day</p>
              <p className="text-sm text-slate-400 mt-2">Enjoy your free day!</p>
            </div>
          )}
        </div>

        {/* Weekly Overview */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <h3 className="text-xl font-black text-slate-800 mb-6">Weekly Overview</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {DAYS.map((day) => {
              const daySchedule = timetableData.timetable?.[day.value] || [];
              const periodCount = daySchedule.length;
              
              return (
                <div
                  key={day.value}
                  className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-center"
                >
                  <p className="text-xs font-black text-slate-500 uppercase mb-2">
                    {day.short}
                  </p>
                  <p className="text-2xl font-black text-slate-800 mb-1">
                    {periodCount}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {periodCount === 1 ? 'Period' : 'Periods'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <h3 className="text-xl font-black text-slate-800 mb-6">Classes by Subject</h3>
          
          <div className="space-y-3">
            {(() => {
              // Count classes per subject
              const subjectCount = {};
              if (timetableData.timetable) {
                Object.values(timetableData.timetable).flat().forEach(period => {
                  if (!subjectCount[period.subject_name]) {
                    subjectCount[period.subject_name] = {
                      count: 0,
                      code: period.subject_code,
                      classes: new Set()
                    };
                  }
                  subjectCount[period.subject_name].count++;
                  subjectCount[period.subject_name].classes.add(period.class_name);
                });
              }

              return Object.entries(subjectCount)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([subject, data]) => (
                  <div
                    key={subject}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">
                        {data.count}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{subject}</p>
                        <p className="text-xs text-slate-500 font-bold">
                          {data.classes.size} {data.classes.size === 1 ? 'class' : 'classes'}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase">
                      {data.code}
                    </span>
                  </div>
                ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, subtext }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
      {subtext && (
        <p className="text-xs text-slate-500 font-bold mt-1">{subtext}</p>
      )}
    </div>
  );
}