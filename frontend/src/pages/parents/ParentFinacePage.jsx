import { useEffect, useState } from "react";
import {
  DollarSign, CreditCard, Calendar, CheckCircle,
  AlertCircle, X, Loader2, Receipt, Clock, IndianRupee
} from "lucide-react";
import api from "../../api/axios";
import { Backarrow } from "../../componets/Backarrow";

export default function ParentFinancePage() {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState("all");
  const [activeTab, setActiveTab] = useState("fees");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // 1. Initial Load: Children and Data
  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedChild]);

  const fetchChildren = async () => {
    try {
      const res = await api.get("/parent/children/");
      setChildren(res.data);
    } catch (err) {
      console.error("Failed to load children", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "fees") {
        // Fix: Trailing slash must come BEFORE the query params
        const params = selectedChild !== "all" ? `?student=${selectedChild}` : "";
        const res = await api.get(`/parent/fees/${params}`);
        setFees(res.data);
      } else if (activeTab === "payments") {
        const res = await api.get("/parent/payments/");
        setPayments(res.data);
      }
    } catch (err) {
      setError("Failed to load fee information.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Razorpay Logic
  const handlePayNow = (fee) => {
    setSelectedFee(fee);
    setPaymentAmount(fee.remaining_amount);
    setShowPaymentModal(true);
  };

  const handleMakePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Step A: Create Order on Django Backend
      const orderRes = await api.post("/parent/payments/razorpay/create-order/", {
        parent_fee_id: selectedFee.id,
        amount: paymentAmount
      });

      const { 
        order_id, key_id, amount, currency, 
        student_name, parent_name, parent_email, parent_contact 
      } = orderRes.data;

      // Step B: Initialize Razorpay Checkout
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "CampuSync",
        description: `Fee: ${selectedFee.fee_name} for ${student_name}`,
        order_id: order_id,
        handler: async function (response) {
          // Step C: Verify Payment on Backend after popup success
          try {
            setProcessing(true);
            await api.post("/parent/payments/razorpay/verify/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              parent_fee_id: selectedFee.id,
              amount: paymentAmount,
              notes: paymentNotes
            });
            
            setSuccess("Payment successful! Your records have been updated.");
            setShowPaymentModal(false);
            fetchData();
          } catch (verifyErr) {
            setError("Payment verified by Razorpay but failed to update local records. Please contact admin.");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: parent_name,
          email: parent_email,
          contact: parent_contact,
        },
        theme: { color: "#4F46E5" }, // CampuSync Indigo
        modal: {
          ondismiss: function() { setProcessing(false); }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError(err.response?.data?.error || "Could not initialize payment.");
      setProcessing(false);
    }
  };

  if (loading && fees.length === 0) return <LoadingSpinner />;

  // Summary logic
  const totalDue = fees.reduce((sum, fee) => sum + parseFloat(fee.remaining_amount || 0), 0);
  const totalPaid = fees.reduce((sum, fee) => sum + parseFloat(fee.paid_amount || 0), 0);
  const pendingCount = fees.filter(f => f.status === 'pending' || f.status === 'partial').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <Backarrow/>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Fee Portal</h1>
            <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-widest">Financial Dashboard</p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Current Session</p>
            <p className="font-black text-slate-700">2025-2026</p>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-2"><AlertCircle size={18}/> {error}</div>}
        {success && <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-bold flex items-center gap-2"><CheckCircle size={18}/> {success}</div>}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard icon={<DollarSign/>} title="Paid to Date" value={`₹${totalPaid.toLocaleString()}`} color="emerald" />
          <SummaryCard icon={<Clock/>} title="Balance Due" value={`₹${totalDue.toLocaleString()}`} color="amber" />
          <SummaryCard icon={<AlertCircle/>} title="Pending Invoices" value={pendingCount} color="indigo" />
        </div>

        {/* CHILD FILTER & TABS */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <TabButton active={activeTab === "fees"} onClick={() => setActiveTab("fees")} label="Fees" />
            <TabButton active={activeTab === "payments"} onClick={() => setActiveTab("payments")} label="History" />
          </div>

          {children.length > 1 && (
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-black text-slate-700 outline-none"
            >
              <option value="all">All Children</option>
              {children.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
            </select>
          )}
        </div>

        {/* CONTENT */}
        <div className="mt-8">
          {activeTab === "fees" ? (
            <div className="grid grid-cols-1 gap-4">
              {fees.map(fee => <FeeCard key={fee.id} fee={fee} onPayNow={handlePayNow} />)}
              {fees.length === 0 && <EmptyState message="No active fee records found." />}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fee Name</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6"><p className="font-black text-slate-800 text-xs">{payment.transaction_id}</p></td>
                      <td className="p-6 font-bold text-slate-700">{payment.fee_name}</td>
                      <td className="p-6 font-black text-slate-800">₹{payment.amount}</td>
                      <td className="p-6 text-sm font-bold text-slate-500">{new Date(payment.payment_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedFee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">Payment Summary</h3>
              <button onClick={() => !processing && setShowPaymentModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
            </div>
            
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-6">
              <h4 className="text-xl font-black text-slate-800 leading-tight">{selectedFee.fee_name}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">For: {selectedFee.student_name}</p>
              <div className="mt-6 flex justify-between items-center">
                <span className="text-sm font-black text-slate-500 uppercase">Due Balance</span>
                <span className="text-3xl font-black text-indigo-600">₹{selectedFee.remaining_amount}</span>
              </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Notes</label>
                  <input 
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"
                    placeholder="Reference notes (Optional)"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    disabled={processing}
                  />
               </div>
            </div>

            <button
              onClick={handleMakePayment}
              disabled={processing}
              className="w-full mt-8 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {processing ? <Loader2 className="animate-spin" size={20}/> : <CreditCard size={20}/>}
              {processing ? "Connecting..." : `Secure Pay ₹${paymentAmount}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components
function TabButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`px-8 py-2 rounded-lg text-xs font-black transition-all ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
      {label}
    </button>
  );
}

function SummaryCard({ icon, title, value, color }) {
  const themes = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600"
  };
  return (
    <div className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-2xl ${themes[color]}`}>{icon}</div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
    </div>
  );
}

function FeeCard({ fee, onPayNow }) {
  const isOverdue = fee.is_overdue && fee.status !== 'paid';
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${fee.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {fee.status}
            </span>
            {isOverdue && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase">Overdue</span>}
          </div>
          <h3 className="text-2xl font-black text-slate-800">{fee.fee_name}</h3>
          <p className="text-sm font-bold text-slate-400 mt-1">Student: {fee.student_name} • Roll: {fee.student_roll}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <DataPoint label="Total Amount" value={`₹${fee.total_amount}`} />
            <DataPoint label="Paid" value={`₹${fee.paid_amount}`} color="text-emerald-600" />
            <DataPoint label="Due" value={`₹${fee.remaining_amount}`} color="text-indigo-600" />
            <DataPoint label="Deadline" value={new Date(fee.due_date).toLocaleDateString()} />
          </div>
        </div>

        <div className="flex items-center">
          {fee.status !== 'paid' && (
            <button onClick={() => onPayNow(fee)} className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <CreditCard size={18}/> Pay Now
            </button>
          )}
          {fee.status === 'paid' && <div className="flex items-center gap-2 text-emerald-600 font-black"><CheckCircle/> Full Payment Received</div>}
        </div>
      </div>
    </div>
  );
}

function DataPoint({ label, value, color = "text-slate-800" }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
      <Receipt className="mx-auto text-slate-300 mb-4" size={48}/>
      <p className="text-slate-400 font-black">{message}</p>
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