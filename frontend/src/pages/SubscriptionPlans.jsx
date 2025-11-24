import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const initialFormData = {
  plan_name: "",
  description: "",
  duration_days: "",
  price: "",
  features: "",
  max_students: "",
  max_teachers: "",
  max_admins: "",
};

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingPlanId, setEditingPlanId] = useState(null); // null => create mode

  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);

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
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingPlanId(null);
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

        max_students:
          formData.max_students !== "" ? Number(formData.max_students) : null,
        max_teachers:
          formData.max_teachers !== "" ? Number(formData.max_teachers) : null,
        max_admins:
          formData.max_admins !== "" ? Number(formData.max_admins) : null,
      };

      if (editingPlanId) {
        // 🔁 UPDATE PLAN
        // If your endpoint is /subscriptions/plans/<id>/, change the URL below accordingly:
        await api.put(`subscriptions/plans/${editingPlanId}/update/`, payload);
        setSuccess("Plan updated successfully!");
      } else {
        // ➕ CREATE PLAN
        await api.post("subscriptions/plans/create/", payload);
        setSuccess("Plan created successfully!");
      }

      resetForm();
      loadPlans();
    } catch (err) {
        console.error("CREATE/UPDATE ERROR:", err.response?.data || err.message);

      if (err.response?.status === 401) {
        
        // localStorage.removeItem("access");
        // navigate("/");
      }
      setError(editingPlanId ? "Failed to update plan" : "Failed to create plan");
    }
  };

  const handleEditClick = (plan) => {
    setError("");
    setSuccess("");

    setEditingPlanId(plan.id);

    setFormData({
      plan_name: plan.plan_name,
      description: plan.description ?? "",
      duration_days: String(plan.duration_days ?? ""),
      price: String(plan.price ?? ""),
      features: Array.isArray(plan.features)
        ? plan.features.join(", ")
        : String(plan.features ?? ""),

      max_students:
        plan.max_students === null || plan.max_students === undefined
          ? ""
          : String(plan.max_students),
      max_teachers:
        plan.max_teachers === null || plan.max_teachers === undefined
          ? ""
          : String(plan.max_teachers),
      max_admins:
        plan.max_admins === null || plan.max_admins === undefined
          ? ""
          : String(plan.max_admins),
    });

    // Optional: scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
    setSuccess("");
    setError("");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Subscription Plans</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {/* ---- CREATE / EDIT PLAN FORM ---- */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
        <h3>{editingPlanId ? "Edit Plan" : "Create New Plan"}</h3>
        <input
          type="text"
          name="plan_name"
          placeholder="Plan Name"
          value={formData.plan_name}
          onChange={handleChange}
          required
          style={{
            display: "block",
            marginBottom: "10px",
            padding: "8px",
            width: "300px",
          }}
        />
        

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
          style={{
            display: "block",
            marginBottom: "10px",
            padding: "8px",
            width: "300px",
          }}
        />

        <input
          type="number"
          name="duration_days"
          placeholder="Duration in days"
          value={formData.duration_days}
          onChange={handleChange}
          required
          style={{
            display: "block",
            marginBottom: "10px",
            padding: "8px",
            width: "300px",
          }}
        />

        <input
          type="number"
          name="price"
          placeholder="Price ₹"
          value={formData.price}
          onChange={handleChange}
          required
          style={{
            display: "block",
            marginBottom: "10px",
            padding: "8px",
            width: "300px",
          }}
        />

        <input
          type="text"
          name="features"
          placeholder="Feature 1, Feature 2"
          value={formData.features}
          onChange={handleChange}
          required
          style={{
            display: "block",
            marginBottom: "10px",
            padding: "8px",
            width: "300px",
          }}
        />

        <input
          type="number"
          name="max_students"
          placeholder="Max Students (optional)"
          value={formData.max_students}
          onChange={handleChange}
          style={{
            display: "block",
            marginBottom: "10px",
            padding: "8px",
            width: "300px",
          }}
        />

        <input
          type="number"
          name="max_teachers"
          placeholder="Max Teachers (optional)"
          value={formData.max_teachers}
          onChange={handleChange}
          style={{
            display: "block",
            marginBottom: "10px",
            padding: "8px",
            width: "300px",
          }}
        />

        <input
          type="number"
          name="max_admins"
          placeholder="Max Admins (optional)"
          value={formData.max_admins}
          onChange={handleChange}
          style={{
            display: "block",
            marginBottom: "10px",
            padding: "8px",
            width: "300px",
          }}
        />

        <div style={{ marginTop: "5px" }}>
          <button
            type="submit"
            style={{ padding: "10px 20px", cursor: "pointer", marginRight: "10px" }}
          >
            {editingPlanId ? "Update Plan" : "Create Plan"}
          </button>

          {editingPlanId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{ padding: "10px 20px", cursor: "pointer" }}
            >
              Cancel Edit
            </button>
          )}
        </div>
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
              width: "260px",
            }}
          >
            <h4>{plan.plan_name.toUpperCase()}</h4>
            <p>{plan.description}</p>
            <p>Duration: {plan.duration_days} days</p>
            <p>Price: ₹{plan.price}</p>
            <p>
              <strong>Features:</strong>{" "}
              {Array.isArray(plan.features)
                ? plan.features.join(", ")
                : String(plan.features ?? "")}
            </p>
            <p>
              <strong>Max Students:</strong>{" "}
              {plan.max_students ?? "Unlimited"}
            </p>
            <p>
              <strong>Max Teachers:</strong>{" "}
              {plan.max_teachers ?? "Unlimited"}
            </p>
            <p>
              <strong>Max Admins:</strong> {plan.max_admins ?? "Unlimited"}
            </p>

            <button
              onClick={() => handleEditClick(plan)}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
