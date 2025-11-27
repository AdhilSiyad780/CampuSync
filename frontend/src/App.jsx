// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./componets/Layout";
import SuperAdminProfile from "./pages/SuperAdminProfile";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import ProtectedRoute from "./componets/ProtectedRoute";
import LoginPage from "./pages/SuperAdminLogin";
import AdminSignupEmailStep from "./pages/school/AdminSignupEmailStep";
import AdminSignupComplete from "./pages/school/AdminSignupComplete";
import AdminDashboard from "./pages/school/AdminDashboard";
import AdminLoginPage from "./pages/school/AdminLoginPage";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC LOGIN ROUTE */}
        <Route path="/" element={<AdminSignupEmailStep />} />
        <Route path="/signup/complete" element={<AdminSignupComplete />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/login" element={<AdminLoginPage />} />
   



        <Route path="/superadmin/login" element={<LoginPage />} />

        {/* PROTECTED SUPERADMIN AREA */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* /superadmin  -> profile by default */}
          <Route index element={<SuperAdminProfile />} />

          {/* /superadmin/profile */}
          <Route path="profile" element={<SuperAdminProfile />} />

          {/* /superadmin/subscriptions/plans */}
          <Route path="subscriptions/plans" element={<SubscriptionPlans />} />

          {/* /superadmin/dashboard */}
          <Route path="dashboard" element={<div>Dashboard coming soon</div>} />

          {/* /superadmin/tenants */}
          <Route path="tenants" element={<div>Tenants coming soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
