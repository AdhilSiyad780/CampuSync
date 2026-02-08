import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>🎉 Super Admin Dashboard</h1>
      <p>You are successfully logged in as Super Admin!</p>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
