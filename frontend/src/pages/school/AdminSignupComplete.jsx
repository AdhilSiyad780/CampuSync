// frontend/src/pages/school/AdminSignupComplete.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";

function AdminSignupComplete() {
  const location = useLocation();
  const navigate = useNavigate();

  const verifiedEmail = location.state?.email || "";
  const signupToken = location.state?.signupToken || null;
  const fromGoogle = location.state?.fromGoogle || false;

  const initialPassword = location.state?.password || "";
  const initialConfirmPassword = location.state?.confirmPassword || "";
  const initialFullname = location.state?.fullname || "";

  const [formData, setFormData] = useState({
    email: verifiedEmail,
    fullname: initialFullname,
    phone: "",
    instance_name: "",
    tenant_email: "",
    tenant_phone: "",
    tenant_address: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // If neither OTP context nor Google context exists → invalid flow
  if (!fromGoogle && !signupToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Invalid signup flow
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            You reached this page without a valid signup session.  
            Please start again.
          </p>
          <button
            onClick={() => navigate("/signup")}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 hover:bg-blue-700 transition"
          >
            Go to Signup
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = formData.email.trim();
    const trimmedInstance = formData.instance_name.trim();

    if (!trimmedEmail) {
      setErrorMsg("Email is required.");
      return;
    }

    if (!trimmedInstance) {
      setErrorMsg("School / Institute name is required.");
      return;
    }

    // OTP MODE: ensure we still have a valid password in state
    if (!fromGoogle) {
      if (!signupToken) {
        setErrorMsg("OTP not verified. Please go back and verify your email.");
        return;
      }

      if (!initialPassword || initialPassword.length < 6) {
        setErrorMsg("Password is missing or invalid. Please restart signup.");
        return;
      }

      if (initialPassword !== initialConfirmPassword) {
        setErrorMsg("Passwords do not match. Please restart signup.");
        return;
      }
    }

    try {
      setLoading(true);

      let res;

      if (fromGoogle) {
        // GOOGLE MODE: tenant + profile setup only
        res = await api.post("/auth/google-initial-setup/", {
          fullname: formData.fullname.trim(),
          phone: formData.phone.trim(),
          instance_name: formData.instance_name.trim(),
          tenant_email: formData.tenant_email.trim(),
          tenant_phone: formData.tenant_phone.trim(),
          tenant_address: formData.tenant_address.trim(),
        });
        // tokens are already stored at Google login step
      } else {
        // OTP MODE: full signup + password + tenant
        res = await api.post("/signup/", {
          email: trimmedEmail,
          signup_token: signupToken,
          fullname: formData.fullname.trim(),
          password: initialPassword,
          confirm_password: initialConfirmPassword,
          phone: formData.phone.trim(),
          instance_name: formData.instance_name.trim(),
          tenant_email: formData.tenant_email.trim(),
          tenant_phone: formData.tenant_phone.trim(),
          tenant_address: formData.tenant_address.trim(),
        });

        // store tokens for OTP signup flow
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
      }

      console.log("Signup / setup success:", res.data);
      setSuccessMsg("Registration completed successfully.");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      console.log("SIGNUP COMPLETE ERROR:", data);

      if (data?.non_field_errors) {
        setErrorMsg(data.non_field_errors[0]);
      } else if (typeof data === "string") {
        setErrorMsg(data);
      } else if (data) {
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

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* LEFT COLUMN */}
          <div className="space-y-3">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                School / Institute Name
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                School Email
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                School Phone
              </label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                School Address
              </label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-medium py-2.5 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-blue-700 transition"
            >
              {loading ? "Completing registration..." : "Complete Registration"}
            </button>
          </div>
        </form>
         <button
      type="button"
      onClick={() => navigate("/dashboard")}
      className="w-full mt-3 inline-flex items-center justify-center rounded-lg bg-slate-200 text-slate-800 text-sm font-medium py-2.5 hover:bg-slate-300 transition"
    >
      Skip for now
    </button>
      </div>
    </div>
  );
}

export default AdminSignupComplete;
