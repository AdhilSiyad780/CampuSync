// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ---------- SCHOOL / ADMIN PAGES ----------
import AdminSignupEmailStep from "./pages/school/AdminSignupEmailStep";
import AdminSignupComplete from "./pages/school/AdminSignupComplete";
import AdminLoginPage from "./pages/school/AdminLoginPage";
import AdminDashboard from "./pages/school/AdminDashboard";
import StudentsPage from "./pages/school/StudentsPage"; // <-- make sure this exists
import TeachersPage from "./pages/school/TeacherPage";
import ParentsPage from "./pages/school/ParentPage";

// ---------- SUPERADMIN PAGES ----------
import LoginPage from "./pages/SuperAdminLogin";
import Layout from "./componets/Layout";
import ProtectedRoute from "./componets/ProtectedRoute";
import SuperAdminProfile from "./pages/SuperAdminProfile";
import SubscriptionPlans from "./pages/SubscriptionPlans";
 

export default function App() {
  return (
    <Router>
      <Routes>
        {/* ===================== PUBLIC SCHOOL / ADMIN AUTH ROUTES ===================== */}
        <Route path="/" element={<AdminSignupEmailStep />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/signup/complete" element={<AdminSignupComplete />} />

        {/* ===================== SCHOOL / ADMIN APP ROUTES ===================== */}
        {/* (You can wrap these with an AdminProtectedRoute later if you want) */}
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/teachers"  element={<TeachersPage/>}/>
        <Route path="/parents"  element={<ParentsPage/>}/>

        {/* ===================== SUPERADMIN AUTH ROUTE ===================== */}
        <Route path="/superadmin/login" element={<LoginPage />} />

        {/* ===================== PROTECTED SUPERADMIN AREA ===================== */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* /superadmin -> profile by default */}
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
    </Router>
  );
}
