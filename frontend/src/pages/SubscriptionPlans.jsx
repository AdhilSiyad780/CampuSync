import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    plan_name: "",
    description: "",
    duration_days: "",
    price: "",
    features: "",
  });

  // Load plans on page load
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.get("subscriptions/plans/");
      setPlans(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        navigate("/");
      }
      setError("Failed to load plans");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        plan_name: formData.plan_name,
        description: formData.description,
        duration_days: Number(formData.duration_days),
        price: Number(formData.price),
        is_active: true,
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f.length > 0),
      };

      await api.post("subscriptions/plans/create/", payload);

      setSuccess("Plan created successfully!");
      setFormData({
        plan_name: "",
        description: "",
        duration_days: "",
        price: "",
        features: "",
      });

      loadPlans();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        navigate("/");
      }
      setError("Failed to create plan");
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Subscription Plans</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {/* ---- CREATE PLAN FORM ---- */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <h3>Create New Plan</h3>

        <select
          name="plan_name"
          value={formData.plan_name}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        >
          <option value="">Select Plan</option>
          <option value="trial">Trial (20 Days)</option>
          <option value="monthly">Monthly</option>
          <option value="half_yearly">6 Months</option>
          <option value="yearly">Yearly</option>
        </select>

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        />

        <input
          type="number"
          name="duration_days"
          placeholder="Duration in days"
          value={formData.duration_days}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        />

        <input
          type="number"
          name="price"
          placeholder="Price ₹"
          value={formData.price}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        />

        <input
          type="text"
          name="features"
          placeholder="Feature 1, Feature 2"
          value={formData.features}
          onChange={handleChange}
          required
          style={{ display: "block", marginBottom: "10px", padding: "8px", width: "300px" }}
        />

        <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
          Create Plan
        </button>
      </form>

      {/* ---- DISPLAY PLANS ---- */}
      <h3>Available Plans</h3>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: "1px solid gray",
              borderRadius: "8px",
              padding: "1rem",
              width: "230px",
            }}
          >
            <h4>{plan.plan_name.toUpperCase()}</h4>
            <p>{plan.description}</p>
            <p>Duration: {plan.duration_days} days</p>
            <p>Price: ₹{plan.price}</p>
            <p>
              <strong>Features:</strong> {plan.features.join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
