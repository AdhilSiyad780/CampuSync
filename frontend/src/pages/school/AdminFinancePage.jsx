import { useEffect, useState } from "react";
import {
  DollarSign, Plus, Users, TrendingUp, AlertCircle,
  Calendar, CheckCircle, Clock, X, Loader2, Filter,
  Download, Search, IndianRupee, LayoutGrid, Save
} from "lucide-react";
import api from "../../api/axios";

export default function AdminFinancePage() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [classes, setClasses] = useState([]); // State for school classes
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState("structures");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create Fee Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFee, setNewFee] = useState({
    name: "",
    description: "",
    fee_type: "tuition",
    amount: "",
    academic_year: "2025-2026",
    frequency: "one_time",
    due_date: "",
    class_ids: [], // Holds selected class primary keys
    late_fee_applicable: false,
    late_fee_amount: 0,
    late_fee_days: 0
  });

  // View Students Modal
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedFeeStudents, setSelectedFeeStudents] = useState([]);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Classes (Needed for the Create Modal)
      const classesRes = await api.get("classes/");
      // Assuming your backend returns { results: [...] } or just [...]
      setClasses(classesRes.data.results || classesRes.data || []);

      // 2. Fetch Tab Content
      if (activeTab === "structures") {
        const res = await api.get("admin/fee-structures/");
        setFeeStructures(res.data);
      } else if (activeTab === "payments") {
        const res = await api.get("admin/parent-fees/");
        setStudentFees(res.data);
      } else if (activeTab === "statistics") {
        const res = await api.get("admin/statistics/");
        setStatistics(res.data);
      }
    } catch (err) {
      setError("Failed to load finance data.");
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (classId) => {
    setNewFee(prev => {
      const isSelected = prev.class_ids.includes(classId);
      const newIds = isSelected 
        ? prev.class_ids.filter(id => id !== classId)
        : [...prev.class_ids, classId];
      return { ...prev, class_ids: newIds };
    });
  };

  const handleSelectAllClasses = () => {
    if (newFee.class_ids.length === classes.length) {
      setNewFee({ ...newFee, class_ids: [] });
    } else {
      setNewFee({ ...newFee, class_ids: classes.map(c => c.id) });
    }
  };

  const handleCreateFee = async () => {
    if (newFee.class_ids.length === 0) {
      alert("Please select at least one class.");
      return;
    }
    try {
      await api.post("admin/fee-structures/", newFee);
      setSuccess("Fee structure created successfully!");
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create fee structure");
    }
  };

  const resetForm = () => {
    setNewFee({
      name: "", description: "", fee_type: "tuition", amount: "",
      academic_year: "2025-2026", frequency: "one_time", due_date: "",
      class_ids: [], late_fee_applicable: false, late_fee_amount: 0, late_fee_days: 0
    });
  };

  const handleAssignFees = async (feeStructureId) => {
    if (!confirm("Assign this fee to all students in selected classes?")) return;
    try {
      await api.post(`admin/fee-structures/${feeStructureId}/assign/`);
      setSuccess("Fees assigned to students successfully!");
      fetchData();
    } catch (err) {
      alert("Failed to assign fees");
    }
  };

  const handleViewStudents = async (feeStructure) => {
    setSelectedFeeStructure(feeStructure);
    try {
      const res = await api.get(`admin/fee-structures/${feeStructure.id}/fees/`);
      setSelectedFeeStudents(res.data);
      setShowStudentsModal(true);
    } catch (err) {
      alert("Failed to load students");
    }
  };

  if (loading && !statistics && feeStructures.length === 0) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Finance Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage fees, payments, and collections for CampuSync</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Plus size={20}/> Create Fee Structure
          </button>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle size={18}/> {success}
          </div>
        )}

        {/* TABS */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <TabButton active={activeTab === "structures"} onClick={() => setActiveTab("structures")} icon={<DollarSign size={16}/>} label="Fee Structures" />
          <TabButton active={activeTab === "payments"} onClick={() => setActiveTab("payments")} icon={<Users size={16}/>} label="Student Fees" />
          <TabButton active={activeTab === "statistics"} onClick={() => setActiveTab("statistics")} icon={<TrendingUp size={16}/>} label="Statistics" />
        </div>

        {/* CONTENT */}
        <div className="mt-8">
          {activeTab === "structures" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feeStructures.map(fee => (
                <FeeStructureCard key={fee.id} fee={fee} onAssign={handleAssignFees} onViewStudents={handleViewStudents} />
              ))}
              {feeStructures.length === 0 && <EmptyState message="No fee structures created yet" />}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {studentFees.map(sf => (
                    <tr key={sf.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6">
                        <p className="font-black text-slate-800">{sf.student_name}</p>
                        <p className="text-xs text-slate-500">Roll: {sf.student_roll}</p>
                      </td>
                      <td className="p-6 font-bold text-slate-700">{sf.fee_name}</td>
                      <td className="p-6">
                        <p className="font-black text-slate-800">₹{sf.paid_amount} / ₹{sf.total_amount}</p>
                        <p className="text-xs text-amber-600 font-bold">Remaining: ₹{sf.remaining_amount}</p>
                      </td>
                      <td className="p-6">
                        <StatusBadge status={sf.status} />
                      </td>
                      <td className="p-6 text-sm font-bold text-slate-600">{new Date(sf.due_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {studentFees.length === 0 && <EmptyState message="No student fees found" />}
            </div>
          )}

          {activeTab === "statistics" && statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard icon={<DollarSign className="text-indigo-600"/>} title="Total Revenue" value={`₹${statistics.total_amount.toLocaleString()}`} />
              <StatCard icon={<CheckCircle className="text-emerald-600"/>} title="Collected" value={`₹${statistics.collected_amount.toLocaleString()}`} />
              <StatCard icon={<Clock className="text-amber-600"/>} title="Pending" value={`₹${statistics.pending_amount.toLocaleString()}`} />
              <StatCard icon={<TrendingUp className="text-blue-600"/>} title="Collection Rate" value={`${statistics.collection_percentage}%`} />
            </div>
          )}
        </div>
      </div>

      {/* CREATE FEE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Create Fee Structure</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input label="Fee Name" value={newFee.name} onChange={(e) => setNewFee({...newFee, name: e.target.value})} placeholder="e.g., Q1 Tuition Fee" />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Description" value={newFee.description} onChange={(e) => setNewFee({...newFee, description: e.target.value})} placeholder="Optional fee details..." />
              </div>
              <Input label="Amount (₹)" type="number" value={newFee.amount} onChange={(e) => setNewFee({...newFee, amount: e.target.value})} />
              <Input label="Due Date" type="date" value={newFee.due_date} onChange={(e) => setNewFee({...newFee, due_date: e.target.value})} />
              
              <Select label="Frequency" value={newFee.frequency} onChange={(e) => setNewFee({...newFee, frequency: e.target.value})}>
                <option value="one_time">One Time</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </Select>

              <Select label="Fee Type" value={newFee.fee_type} onChange={(e) => setNewFee({...newFee, fee_type: e.target.value})}>
                <option value="tuition">Tuition Fee</option>
                <option value="transport">Transport Fee</option>
                <option value="exam">Examination Fee</option>
                <option value="sports">Sports Fee</option>
                <option value="other">Other</option>
              </Select>

              {/* CLASS SELECTION SECTION */}
              <div className="md:col-span-2 mt-4">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicable Classes *</label>
                    <button 
                      type="button"
                      onClick={handleSelectAllClasses} 
                      className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                    >
                      {newFee.class_ids.length === classes.length ? "Deselect All" : "Select All"}
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {classes.map(cls => (
                        <label 
                          key={cls.id} 
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            newFee.class_ids.includes(cls.id) 
                              ? "bg-indigo-50 border-indigo-400" 
                              : "bg-slate-50 border-slate-100"
                          }`}
                        >
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={newFee.class_ids.includes(cls.id)} 
                              onChange={() => handleClassToggle(cls.id)} 
                            />
                            <LayoutGrid size={14} className={newFee.class_ids.includes(cls.id) ? "text-indigo-600" : "text-slate-300"}/>
                            <span className="text-xs font-black text-slate-700">{cls.class_name} - {cls.division}</span>
                        </label>
                    ))}
                </div>
              </div>
            </div>

            <button onClick={handleCreateFee} className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              <Save size={18}/> Save Fee Structure
            </button>
          </div>
        </div>
      )}

      {/* VIEW STUDENTS MODAL */}
      {showStudentsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{selectedFeeStructure?.name}</h3>
                <p className="text-sm font-bold text-slate-400">Enrolled Student Status</p>
              </div>
              <button onClick={() => setShowStudentsModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedFeeStudents.map(sf => (
                <div key={sf.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <div>
                    <p className="font-black text-slate-800 leading-tight">{sf.student_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Roll No: {sf.student_roll}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800 text-sm">₹{sf.paid_amount} / ₹{sf.total_amount}</p>
                    <StatusBadge status={sf.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
      {icon} {label}
    </button>
  );
}

function FeeStructureCard({ fee, onAssign, onViewStudents }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">{fee.fee_type}</span>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black">₹{fee.amount}</span>
      </div>
      
      <h3 className="text-xl font-black text-slate-800 mb-2">{fee.name}</h3>
      <p className="text-xs text-slate-400 font-bold mb-4 h-8 line-clamp-2">{fee.description || 'No description provided.'}</p>
      
      <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
          <span className="flex items-center gap-1"><Calendar size={12}/> Due Date</span>
          <span className="text-slate-700 font-black">{new Date(fee.due_date).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
          <span className="flex items-center gap-1"><Users size={12}/> Coverage</span>
          <span className="text-slate-700 font-black">{fee.total_students || 0} Students</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button onClick={() => onAssign(fee.id)} className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl text-xs font-black hover:bg-indigo-700 shadow-md">
          Assign
        </button>
        <button onClick={() => onViewStudents(fee)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl text-xs font-black hover:bg-slate-200">
          Details
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    partial: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
    waived: 'bg-slate-100 text-slate-700'
  };
  return <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${colors[status]}`}>{status}</span>;
}

function Input({ label, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" {...props} />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <textarea className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" {...props} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <select className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" {...props}>
        {children}
      </select>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
      <DollarSign className="mx-auto text-slate-200 mb-4" size={48}/>
      <p className="text-slate-400 font-black tracking-tight">{message}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );
}