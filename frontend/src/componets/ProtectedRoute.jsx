import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const rawData = localStorage.getItem('user'); 
  const userData = JSON.parse(rawData);// check if logged in
  console.log(userData)
  if (userData && userData.user_type !== 'superadmin') {
    return <Navigate to="/" replace />; // redirect to login
  }
  return children;
}
