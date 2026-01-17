// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage.jsx";

// ---------- SCHOOL / ADMIN PAGES ----------
import AdminSignupEmailStep from "./pages/school/AdminSignupEmailStep";
import AdminSignupComplete from "./pages/school/AdminSignupComplete";
import AdminLoginPage from "./pages/school/AdminLoginPage";
import AdminDashboard from "./pages/school/AdminDashboard";
import StudentsPage from "./pages/school/StudentsPage"; // <-- make sure this exists
import TeachersPage from "./pages/school/TeacherPage";
import ParentsPage from "./pages/school/ParentPage";
import AdminProfile from './pages/school/AdminProfile.jsx'
import ClassesPage from "./pages/school/ClassesPage.jsx";
import AnnouncementsPage from "./pages/school/AnnouncementsPage.jsx";
import TimetablePage from "./pages/school/TimetablePage.jsx";
// ---------- SUPERADMIN PAGES ----------
import LoginPage from "./pages/SuperAdminLogin";
import Layout from "./componets/Layout";
import ProtectedRoute from "./componets/ProtectedRoute";
import SuperAdminProfile from "./pages/SuperAdminProfile";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SuperAdminTenants  from "./pages/SuperAdminTenants.jsx";

// ---------- STUDENT PAGES ----------
import StudentLoginPage from "./pages/students/StudentLogin.jsx";
import StudentDashboard from "./pages/students/StudentDashboard.jsx";
import StudentProfile from "./pages/students/StudentProfile.jsx";
//.............TEACHER PAGEs...............
import TeacherLogin from "./pages/teacher/TeacherLogin.jsx";
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx'
import TeacherProfile from "./pages/teacher/TeacherProfile.jsx";


//============Parent Login==============================
import ParentLogin from "./pages/parents/ParentLogin.jsx";
import ParentDashboard from './pages/parents/ParentDashboard.jsx'
import ParentProfile from "./pages/parents/ParentProfile.jsx";


//============FORGOT PASSWORD ==============================
import ForgotPasswordPage from "./pages/forgotpassword/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/forgotpassword/ResetPasswordPage.jsx";


export default function App() {
  return (
    <Router>
      <Routes>
         <Route path="/" element={<LandingPage  />} />
        {/* ===================== PUBLIC SCHOOL / ADMIN AUTH ROUTES ===================== */}
        <Route path="/signup" element={<AdminSignupEmailStep />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/signup/complete" element={<AdminSignupComplete />} />

        {/* ===================== SCHOOL / ADMIN APP ROUTES ===================== */}
        {/* (You can wrap these with an AdminProtectedRoute later if you want) */}
        <Route path="/profile" element={ <AdminProfile/>}/>
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/teachers"  element={<TeachersPage/>}/>
        <Route path="/parents"  element={<ParentsPage/>}/>
        <Route path="/classes"  element={<ClassesPage/>}/>
        <Route path="/announcements"  element={<AnnouncementsPage/>}/>
        <Route path="/timetable"  element={<TimetablePage/>}/>



        {/* ===================== SUPERADMIN AUTH ROUTE ===================== */}
        <Route path="/superadmin/login" element={<LoginPage />} />

        {/* ===================== STUDENT AUTH ROUTE ===================== */}
        <Route path="/student/login" element={<StudentLoginPage />} />
         <Route path="/student/Dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />

        {/* ===================== TEACHER AUTH ROUTE ===================== */}
        <Route path="/teacher/login" element={<TeacherLogin />} />
         <Route path="/teacher/Dashboard" element={<TeacherDashboard />} /> 
          <Route path="/teacher/profile" element={<TeacherProfile />} /> 
         {/* ===================== PARENT AUTH ROUTE ===================== */}
        <Route path="/parent/login" element={<ParentLogin />} />
        <Route path="/parent/dashboard" element={<  ParentDashboard />} />
        <Route path="/parent/profile" element={<  ParentProfile />} />
        {/* //============FORGOT PASSWORD ============================== */}
        <Route path="/forgotpassword" element={<  ForgotPasswordPage />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

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

          {/* /superadmin/tenants */}
          <Route path="tenants" element={<SuperAdminTenants/>} />


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
