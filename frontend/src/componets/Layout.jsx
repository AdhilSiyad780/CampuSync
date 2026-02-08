// frontend/src/componets/Layout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleDarkMode } from "../store/ThemeSlice";
import api from "../api/axios";


function SideNavLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
          "hover:bg-slate-800/70 hover:text-slate-50",
          isActive ? "bg-blue-500/20 text-blue-100" : "text-slate-300",
        ].join(" ")
      }
    >
      <span>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const darkMode = useSelector((state) => state.theme.darkMode);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = async () => {
  try {
    // 1. Hit the backend to clear HttpOnly cookies
    await api.post('logout/'); 
    navigate("/"); 
    localStorage.removeItem("user");

  } catch (err) {
    console.error("Logout failed on server, but clearing local state anyway.");
  } finally {
    console.log('api for logout called')
  }
};
  // Later you can replace with real data from profile API
  const userName = "Super Admin";
  const userEmail = "superadmin@example.com";

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* SIDEBAR */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900/95 text-slate-100 dark:border-slate-800">
        {/* Logo */}
        <div
          className="flex cursor-pointer items-center gap-3 px-5 py-4"
          onClick={() => navigate("/superadmin")}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 font-bold">
            C
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide">
              CampusSync
            </span>
            <span className="text-xs text-slate-400">Super Admin</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="mt-4 flex flex-col gap-1 px-3">
          {/* relative paths -> resolved under /superadmin */}
          <SideNavLink to="profile" icon="👤" label="Profile" />
          <SideNavLink
            to="subscriptions/plans"
            icon="📦"
            label="Subscription Plans"
          />
          <SideNavLink to="dashboard" icon="📊" label="Dashboard" />
          <SideNavLink to="tenants" icon="🏫" label="Tenants" />
        </nav>

        {/* Logout bottom */}
        <div className="mt-auto px-3 pb-4 pt-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-200 hover:bg-red-500/20"
            onClick={handleLogout}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div>
            <h1 className="text-lg font-semibold">Super Admin Panel</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage tenants, subscriptions, and platform settings.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark mode toggle (Redux) */}
         <button
  type="button"
  onClick={() => dispatch(toggleDarkMode())}
  className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
>
  <span>{darkMode ? "🌙" : "☀️"}</span>
  <span>{darkMode ? "Dark" : "Light"} mode</span>
</button>

            {/* User info */}
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {userEmail}
              </span>
            </div>
          </div>
        </header>

        {/* Page content from routes */}
        <main className="flex-1 bg-slate-50 px-6 py-4 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
