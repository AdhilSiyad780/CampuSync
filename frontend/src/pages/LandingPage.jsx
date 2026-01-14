import { useState } from "react";
import { useNavigate } from "react-router-dom";   
export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
 const navigate = useNavigate()
  const roles = [
    { key: "admin", label: "Admin", icon: "👑", path: "/login" },
    { key: "teacher", label: "Teacher", icon: "👨‍🏫", path: "/teacher/login" },
    { key: "student", label: "Student", icon: "🎓", path: "/student/login" },
    { key: "parent", label: "Parent", icon: "👪", path: "/parent/login" },
  ];

  const handleRoleSelect = (path) => {
      navigate(path)
  };

  const handleSignup = () => {
    navigate('/signup')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
              C
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              CampuSync
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSignup}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Get Started Free
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-5 py-2.5 rounded-lg border-2 border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-all duration-200"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* HERO CONTENT */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
            🚀 Multi-Tenant SaaS Platform
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold leading-tight bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
            One Platform to Manage Your Entire Campus
          </h2>
          
          <p className="text-xl text-slate-600 leading-relaxed">
            CampuSync simplifies school operations — from admissions and
            attendance to exams, communication, and parent engagement. Built with enterprise-grade security and scalability.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSignup}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              Create School Account →
            </button>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-8 py-4 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-200"
            >
              Existing User Login
            </button>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">100+</div>
              <div className="text-sm text-slate-500">Schools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">50K+</div>
              <div className="text-sm text-slate-500">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-slate-500">Uptime</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl blur-3xl opacity-20"></div>
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">✓</div>
                <div className="text-white">
                  <div className="font-semibold">Student Management</div>
                  <div className="text-sm text-blue-100">Complete profiles & records</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">✓</div>
                <div className="text-white">
                  <div className="font-semibold">Teacher & Staff Control</div>
                  <div className="text-sm text-blue-100">Role-based permissions</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">✓</div>
                <div className="text-white">
                  <div className="font-semibold">Attendance & Timetables</div>
                  <div className="text-sm text-blue-100">Automated scheduling</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">✓</div>
                <div className="text-white">
                  <div className="font-semibold">Exams & Assignments</div>
                  <div className="text-sm text-blue-100">Digital assessment tools</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">✓</div>
                <div className="text-white">
                  <div className="font-semibold">Parent Communication</div>
                  <div className="text-sm text-blue-100">Real-time notifications</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">✓</div>
                <div className="text-white">
                  <div className="font-semibold">Finance & Reports</div>
                  <div className="text-sm text-blue-100">Advanced analytics</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES HIGHLIGHT */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              Platform Features
            </div>
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Everything You Need in One Place
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Powerful tools designed for modern educational institutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🔐"
              title="Multi-Tenant Architecture"
              description="Complete data isolation between schools with enterprise-grade security"
              highlight="Zero Cross-Tenant Access"
            />
            <FeatureCard
              icon="⚡"
              title="Role-Based Access Control"
              description="Granular permissions enforced at API level for all user roles"
              highlight="4 Distinct Roles"
            />
            <FeatureCard
              icon="🎯"
              title="SaaS-Ready Platform"
              description="Built-in subscription management with trial plans and limits"
              highlight="Scalable Architecture"
            />
            <FeatureCard
              icon="📊"
              title="Advanced Analytics"
              description="Real-time insights into attendance, performance, and finances"
              highlight="Data-Driven Decisions"
            />
            <FeatureCard
              icon="🔔"
              title="Smart Notifications"
              description="Automated alerts for parents, students, and teachers"
              highlight="Real-Time Updates"
            />
            <FeatureCard
              icon="💾"
              title="Secure Data Storage"
              description="PostgreSQL with automated backups and encryption"
              highlight="Bank-Level Security"
            />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              Core Modules
            </div>
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              What CampuSync Offers
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive solutions for every stakeholder
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon="👑"
              title="Admin & School Management"
              items={[
                "Institute Profile Setup",
                "Staff & Student Management",
                "Dynamic Timetables & Scheduling",
                "Attendance Oversight",
                "Finance & Expense Tracking",
                "Comprehensive Reports",
                "Subscription Management",
              ]}
              gradient="from-blue-600 to-blue-700"
            />

            <ServiceCard
              icon="👨‍🏫"
              title="Teacher Module"
              items={[
                "Create & Manage Assignments",
                "Schedule & Grade Exams",
                "Digital Attendance Tracking",
                "Class-wise Student View",
                "Parent Communication Tools",
                "Performance Analytics",
              ]}
              gradient="from-green-600 to-green-700"
            />

            <ServiceCard
              icon="🎓"
              title="Student & Parent Access"
              items={[
                "Personal Timetables",
                "Real-time Attendance Tracking",
                "Assignment Submissions",
                "Exam Schedules & Results",
                "Announcements & Notifications",
                "Multi-child Parent Dashboard",
              ]}
              gradient="from-purple-600 to-purple-700"
            />
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              Technology
            </div>
            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Built with Modern Tech Stack
            </h3>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Enterprise-grade technologies for reliability and performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <TechCard
              title="Backend"
              icon="⚙️"
              technologies={[
                { name: "Django + DRF", desc: "Robust REST API framework" },
                { name: "JWT Authentication", desc: "Secure token-based auth" },
                { name: "PostgreSQL", desc: "Reliable database system" },
                { name: "Multi-tenant", desc: "Complete data isolation" },
              ]}
            />
            <TechCard
              title="Frontend"
              icon="🎨"
              technologies={[
                { name: "React 18 + Vite", desc: "Fast & modern UI" },
                { name: "Tailwind CSS", desc: "Beautiful responsive design" },
                { name: "Axios", desc: "Efficient API communication" },
                { name: "Protected Routes", desc: "Role-based navigation" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* LOGIN OPTIONS */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4 text-white">
              Login to Your Portal
            </h3>
            <p className="text-xl text-blue-100">
              Choose your role and access your personalized dashboard
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {roles.map((role) => (
              <LoginButton
                key={role.key}
                label={`${role.label} Login`}
                icon={role.icon}
                onClick={() => handleRoleSelect(role.path)}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleSignup}
              className="px-8 py-4 rounded-xl bg-white text-blue-600 font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              Don't have an account? Sign Up Free →
            </button>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
            Ready to Transform Your School?
          </h3>
          <p className="text-xl text-slate-600 mb-8">
            Join 100+ schools already using CampuSync to streamline their operations
          </p>
          <button
            onClick={handleSignup}
            className="px-10 py-5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-200"
          >
            Start Free Trial Today →
          </button>
          <p className="text-sm text-slate-500 mt-4">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  C
                </div>
                <span className="text-xl font-bold text-white">CampuSync</span>
              </div>
              <p className="text-sm text-slate-400">
                Modern school management platform built for the digital age.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-blue-400 cursor-pointer transition">Features</li>
                <li className="hover:text-blue-400 cursor-pointer transition">Pricing</li>
                <li className="hover:text-blue-400 cursor-pointer transition">Security</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-blue-400 cursor-pointer transition">About</li>
                <li className="hover:text-blue-400 cursor-pointer transition">Contact</li>
                <li className="hover:text-blue-400 cursor-pointer transition">Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-blue-400 cursor-pointer transition">Privacy</li>
                <li className="hover:text-blue-400 cursor-pointer transition">Terms</li>
                <li className="hover:text-blue-400 cursor-pointer transition">Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            <p>© {new Date().getFullYear()} CampuSync. All rights reserved. Built with Django REST Framework & React.</p>
          </div>
        </div>
      </footer>

      {/* LOGIN ROLE SELECTION MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 text-3xl leading-none hover:rotate-90 transition-transform duration-200"
            >
              ×
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
                C
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                Welcome Back!
              </h2>
              <p className="text-slate-600">
                Choose your role to access your dashboard
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {roles.map((role) => (
                <button
                  key={role.key}
                  onClick={() => {
                    setShowLoginModal(false);
                    handleRoleSelect(role.path);
                  }}
                  className="group border-2 border-slate-200 py-8 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 flex flex-col items-center gap-3 hover:shadow-lg hover:scale-105"
                >
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-200">{role.icon}</span>
                  <span className="font-semibold text-lg text-slate-700 group-hover:text-blue-600 transition-colors">{role.label}</span>
                </button>
              ))}
            </div>

            <div className="text-center pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-3">Don't have an account?</p>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  handleSignup();
                }}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Sign up as Admin →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Components ---------- */

function FeatureCard({ icon, title, description, highlight }) {
  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-3">
        {highlight}
      </div>
      <h4 className="font-bold text-xl mb-3 text-slate-900">{title}</h4>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function ServiceCard({ icon, title, items, gradient }) {
  return (
    <div className="group bg-white border-2 border-slate-200 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
      <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h4 className="font-bold text-2xl mb-6 text-slate-900">{title}</h4>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-slate-600">
            <span className="text-blue-600 mt-1 font-bold">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TechCard({ title, icon, technologies }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">{icon}</span>
        <h4 className="text-2xl font-bold text-slate-900">{title}</h4>
      </div>
      <div className="space-y-4">
        {technologies.map((tech, idx) => (
          <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-400 transition-colors">
            <div className="font-semibold text-slate-900 mb-1">{tech.name}</div>
            <div className="text-sm text-slate-600">{tech.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginButton({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group bg-white/10 backdrop-blur-sm border-2 border-white/30 px-6 py-6 rounded-2xl hover:bg-white hover:border-white transition-all duration-200 flex flex-col items-center gap-3 hover:shadow-2xl hover:scale-105"
    >
      <span className="text-5xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
      <span className="text-sm font-semibold text-white group-hover:text-blue-600 transition-colors">{label}</span>
    </button>
  );
}