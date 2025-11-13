import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access"); // check if logged in
  if (!token) {
    return <Navigate to="/" replace />; // redirect to login
  }
  return children;
}
