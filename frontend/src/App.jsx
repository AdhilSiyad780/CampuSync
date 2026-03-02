import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";

import RoleProtectedRoute from "./componets/ProtectedRoute.jsx";
import Layout from "./componets/Layout.jsx"; // Assuming this is your sidebar/nav layout

// ---------- PUBLIC ----------
import LandingPage from "./pages/LandingPage.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";

// ---------- ADMIN ----------
import AdminSignupEmailStep from "./pages/school/AdminSignupEmailStep";
import AdminSignupComplete from "./pages/school/AdminSignupComplete";
import AdminLoginPage from "./pages/school/AdminLoginPage";
import AdminDashboard from "./pages/school/AdminDashboard";
import StudentsPage from "./pages/school/StudentsPage";
import TeachersPage from "./pages/school/TeacherPage";
import ParentsPage from "./pages/school/ParentPage";
import AdminProfile from "./pages/school/AdminProfile.jsx";
import ClassesPage from "./pages/school/ClassesPage.jsx";
import AnnouncementsPage from "./pages/school/AnnouncementsPage.jsx";
import TimetablePage from "./pages/school/TimetablePage.jsx";
import AdminFinancePage from "./pages/school/AdminFinancePage.jsx";

// ---------- SUPERADMIN ----------
import SuperAdminLogin from "./pages/superadmin/SuperAdminLogin";
import SuperAdminProfile from "./pages/superadmin/SuperAdminProfile";
import SubscriptionPlans from "./pages/superadmin/SubscriptionPlans";
import SuperAdminTenants from "./pages/superadmin/SuperAdminTenants.jsx";

// ---------- STUDENT ----------
import StudentLoginPage from "./pages/students/StudentLogin.jsx";
import StudentDashboard from "./pages/students/StudentDashboard.jsx";
import StudentProfile from "./pages/students/StudentProfile.jsx";
import StudentAssignmentsPage from "./pages/students/StudentAssignmentsPage.jsx";
import StudentAttendancePage from "./pages/students/StudentAttendencePage.jsx";
import StudentExamsPage from "./pages/students/StudentExamPage.jsx";
import StudentTimetablePage from "./pages/students/StudentTimetablePage.jsx";

// ---------- TEACHER ----------
import TeacherLogin from "./pages/teacher/TeacherLogin.jsx";
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import TeacherProfile from "./pages/teacher/TeacherProfile.jsx";
import TeacherAssignmentsPage from "./pages/teacher/TeacherAssignmentsPage.jsx";
import TeacherAttendancePage from "./pages/teacher/TeacherAttendencePage.jsx";
import TeacherExamsPage from "./pages/teacher/TeacherExamsPage.jsx";

// ---------- PARENT ----------
import ParentLogin from "./pages/parents/ParentLogin.jsx";
import ParentDashboard from "./pages/parents/ParentDashboard.jsx";
import ParentProfile from "./pages/parents/ParentProfile.jsx";
import ParentFinancePage from "./pages/parents/ParentFinacePage.jsx";
import ParentAttendancePage from "./pages/parents/ParentAttendencePage.jsx";
import ParentTimetablePage from "./pages/parents/ParentTimetablePage.jsx";

// ---------- FORGOT PASSWORD ----------
import ForgotPasswordPage from "./pages/forgotpassword/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/forgotpassword/ResetPasswordPage.jsx";

// ---------- ANNOUNCEMENTS ----------
import AnnouncementList from "./componets/AnnouncementList.jsx";

// ---------- CHAT ----------
import ChatPage from "./pages/ChatPage.jsx";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

          {/* ================= LOGIN/SIGNUP ROUTES ================= */}
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/signup" element={<AdminSignupEmailStep />} />
          
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />

          {/* ================= ADMIN ROUTES ================= */}
          <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/signup/complete" element={<AdminSignupComplete />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/profile" element={<AdminProfile />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/parents" element={<ParentsPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/finance" element={<AdminFinancePage />} />
          </Route>

          {/* ================= STUDENT ROUTES ================= */}
          <Route element={<RoleProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/assignment" element={<StudentAssignmentsPage />} />
            <Route path="/student/attendence" element={<StudentAttendancePage />} />
            <Route path="/student/exams" element={<StudentExamsPage />} />
            <Route path="/student/announcement" element={<AnnouncementList />} />
             <Route path="/student/timetable" element={<StudentTimetablePage />} />
          </Route>

          {/* ================= TEACHER ROUTES ================= */}
          <Route element={<RoleProtectedRoute allowedRoles={["teacher"]} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/profile" element={<TeacherProfile />} />
            <Route path="/teacher/assignment" element={<TeacherAssignmentsPage />} />
            <Route path="/teacher/attendence" element={<TeacherAttendancePage />} />
            <Route path="/teacher/exam" element={<TeacherExamsPage />} />
            <Route path="/teacher/announcement" element={<AnnouncementList />} />
          </Route>

          {/* ================= PARENT ROUTES ================= */}
          <Route element={<RoleProtectedRoute allowedRoles={["parent"]} />}>
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/profile" element={<ParentProfile />} />
            <Route path="/parent/finance" element={<ParentFinancePage />} />
            <Route path="/parent/announcement" element={<AnnouncementList />} />
            <Route path="/parent/attendance" element={<ParentAttendancePage />} />
            <Route path="/parent/timetable" element={<ParentTimetablePage />} />

          </Route>

          {/* ================= SUPERADMIN ROUTES ================= */}
          <Route 
            path="/superadmin" 
            element={
              <RoleProtectedRoute allowedRoles={["superadmin"]}>
                <Layout />
              </RoleProtectedRoute>
            }
          >
            <Route index element={<SuperAdminProfile />} />
            <Route path="profile" element={<SuperAdminProfile />} />
            <Route path="tenants" element={<SuperAdminTenants />} />
            <Route path="subscriptions/plans" element={<SubscriptionPlans />} />
            <Route path="dashboard" element={<div>Dashboard coming soon</div>} />
          </Route>

          {/* ================= CHAT (STANDALONE) ================= */}
          <Route
            path="/chat"
            element={
              <ChatProvider>
                <ChatPage />
              </ChatProvider>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}