import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
  try {
    // 1. Hit the backend to clear HttpOnly cookies
    await api.get('logout/'); 
  } catch (err) {
    console.error("Logout failed on server, but clearing local state anyway.");
  } finally {
    // 2. Clear the non-sensitive user data from local storage
    localStorage.removeItem("user");
    
    // 3. Navigate back to the landing or login page
    navigate("/"); 
  }
};

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h1>🎉 Super Admin Dashboard</h1>
      <p>You are successfully logged in as Super Admin!</p>

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
