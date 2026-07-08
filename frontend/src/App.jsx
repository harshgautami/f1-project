import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AnimatePresence } from "./components/motion";
import Navbar from "./components/Navbar";
import { Loader } from "./components/ui";

import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/user/UserDashboard";
import UserTeams from "./pages/user/UserTeams";
import UserDrivers from "./pages/user/UserDrivers";
import UserDriverProfile from "./pages/user/UserDriverProfile";
import UserRaces from "./pages/user/UserRaces";
import UserStandings from "./pages/user/UserStandings";
import UserRaceHistory from "./pages/user/UserRaceHistory";
import UserTeamStaff from "./pages/user/UserTeamStaff";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminRaces from "./pages/admin/AdminRaces";
import AdminStandings from "./pages/admin/AdminStandings";
import AdminStaff from "./pages/admin/AdminStaff";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader label="Warming up the grid" />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
};

const RedirectHome = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return children;
};

const protect = (element, adminOnly = false) => (
  <ProtectedRoute adminOnly={adminOnly}>{element}</ProtectedRoute>
);

const AppRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<RedirectHome><Login /></RedirectHome>} />
        <Route path="/register" element={<RedirectHome><Register /></RedirectHome>} />

        {/* User */}
        <Route path="/dashboard" element={protect(<UserDashboard />)} />
        <Route path="/teams" element={protect(<UserTeams />)} />
        <Route path="/drivers" element={protect(<UserDrivers />)} />
        <Route path="/drivers/:id" element={protect(<UserDriverProfile />)} />
        <Route path="/races" element={protect(<UserRaces />)} />
        <Route path="/standings" element={protect(<UserStandings />)} />
        <Route path="/history" element={protect(<UserRaceHistory />)} />
        <Route path="/team-staff" element={protect(<UserTeamStaff />)} />

        {/* Admin */}
        <Route path="/admin" element={protect(<AdminDashboard />, true)} />
        <Route path="/admin/teams" element={protect(<AdminTeams />, true)} />
        <Route path="/admin/drivers" element={protect(<AdminDrivers />, true)} />
        <Route path="/admin/races" element={protect(<AdminRaces />, true)} />
        <Route path="/admin/standings" element={protect(<AdminStandings />, true)} />
        <Route path="/admin/staff" element={protect(<AdminStaff />, true)} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="app-container">
          <Navbar />
          <div className="main-content">
            <AppRoutes />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}
