import { BrowserRouter, Routes, Route } from "react-router-dom";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./componets/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<SuperAdminLogin />} />

        <Route
          path="/subscriptions/plans"
          element={
            <ProtectedRoute>
              <SubscriptionPlans />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
