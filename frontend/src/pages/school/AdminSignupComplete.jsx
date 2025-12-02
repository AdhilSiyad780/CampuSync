// frontend/src/pages/school/AdminSignupComplete.jsx
import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";

function AdminSignupComplete() {
  const location = useLocation();
  const navigate = useNavigate();

  // Incoming state
  const verifiedEmail = location.state?.email || "";
  const signupToken = location.state?.signupToken || null;
  const fromGoogle = !!location.state?.fromGoogle;
  const fromLogin = !!location.state?.fromLogin;
  console.log(fromLogin)

  // Passwords might have been collected on the previous page (optional)
  const initialPassword = location.state?.password || "";
  const initialConfirmPassword = location.state?.confirmPassword || "";
  const initialFullname = location.state?.fullname || "";

  // allow OTP, Google or Login flows
  const hasValidEntry =
    Boolean(verifiedEmail) && (Boolean(signupToken) || fromGoogle || fromLogin);

  // If flow is invalid show friendly message
  if (!hasValidEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Invalid signup flow
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            You reached this page without a valid signup session. Please start
            again.
          </p>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 hover:bg-blue-700 transition"
            >
              Go to Signup
            </Link>
            <Link
              to="/login"
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-800 text-sm font-medium py-2.5 hover:bg-slate-300 transition"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form data (we keep password in form too so user can set/change if needed)
  const [formData, setFormData] = useState({
    email: verifiedEmail,
    fullname: initialFullname,
    phone: "",
    instance_name: "",
    tenant_email: "",
    tenant_phone: "",
    tenant_address: "",
    password: initialPassword,
    confirm_password: initialConfirmPassword,
  });

  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const showPasswordInputs = Boolean(signupToken) && !initialPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedInstance = formData.instance_name.trim();
    if (!trimmedInstance) {
      setErrorMsg("School / Institute name is required.");
      return;
    }

   

    try {
      setLoading(true);

      let res;
      if (signupToken) {
        // OTP SIGNUP: complete signup using signup_token (backend already expects this)
        res = await api.post("/signup/", {
          email: formData.email.trim(),
          signup_token: signupToken,
          fullname: formData.fullname.trim(),
          phone: formData.phone.trim(),
          instance_name: formData.instance_name.trim(),
          tenant_email: formData.tenant_email.trim() || formData.email.trim(),
          tenant_phone: formData.tenant_phone.trim(),
          tenant_address: formData.tenant_address.trim(),
        });

        // store tokens returned by full signup
        if (res?.data?.access) localStorage.setItem("access", res.data.access);
        if (res?.data?.refresh)
          localStorage.setItem("refresh", res.data.refresh);
      } else {
        // Existing user (Google or Login) -> only setup tenant & profile
        // Backend must accept this route and attach tenant to current user (authenticated)
        // For Google, tokens should already be set at Google login step.
        // For Login flow, tokens are set in login response.
        res = await api.post("/signup/", {
          fullname: formData.fullname.trim(),
          email:formData.email.trim(),
          phone: formData.phone.trim(),
          instance_name: formData.instance_name.trim(),
          tenant_email: formData.tenant_email.trim() || formData.email.trim(),
          tenant_phone: formData.tenant_phone.trim(),
          tenant_address: formData.tenant_address.trim(),
        });

        // backend should mark user.is_setup_complete true and return success
      }

      setSuccessMsg("Registration completed successfully.");
      // small delay if you want user to read message; otherwise direct redirect
      navigate("/dashboard");
    } catch (err) {
      console.error("SIGNUP COMPLETE ERROR:", err.response?.data || err.message);
      console.log(err)
      const data = err.response?.data;
      if (data?.non_field_errors) {
        setErrorMsg(data.non_field_errors[0]);
      } else if (data?.detail) {
        setErrorMsg(data.detail);
      } else if (typeof data === "string") {
        setErrorMsg(data);
      } else if (data && typeof data === "object") {
        // prefer the first array message
        const firstKey = Object.keys(data)[0];
        if (firstKey && Array.isArray(data[firstKey])) {
          setErrorMsg(data[firstKey][0]);
        } else {
          setErrorMsg("Registration failed. Check details and try again.");
        }
      } else {
        setErrorMsg("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

    

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-2xl bg-white shadow-md rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-center text-slate-800 mb-2">
          Admin Registration – Details
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">
          Enter your personal and school details to complete registration.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT COLUMN */}
          <div className="space-y-3">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-100 cursor-not-allowed"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                name="fullname"
                placeholder="Admin Full Name"
                value={formData.fullname}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                placeholder="Admin phone (optional)"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

           
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-3">
            {/* School / Institute Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">School / Institute Name</label>
              <input
                type="text"
                name="instance_name"
                placeholder="Green Valley Public School"
                value={formData.instance_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* School Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">School Email</label>
              <input
                type="email"
                name="tenant_email"
                placeholder="contact@school.com"
                value={formData.tenant_email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* School Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">School Phone</label>
              <input
                type="text"
                name="tenant_phone"
                placeholder="School phone"
                value={formData.tenant_phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* School Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">School Address</label>
              <textarea
                name="tenant_address"
                placeholder="Address (optional)"
                value={formData.tenant_address}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>

          {/* ERRORS + BUTTON */}
          <div className="md:col-span-2">
            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-2">
                {errorMsg}
              </p>
            )}
            {successMsg && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2 mb-2">
                {successMsg}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-700 transition"
              >
                {loading ? "Completing registration..." : "Complete Registration"}
              </button>

              {/* Show skip only for existing accounts (fromGoogle or fromLogin) */}
              {(fromGoogle || fromLogin || signupToken)  && (
                <button
                  type="button"
                  onClick={()=>navigate('/dashboard')}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-800 text-sm font-medium px-4 py-2.5 hover:bg-slate-300 transition"
                >
                  {skipLoading ? "Skipping..." : "Skip for now"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminSignupComplete;
