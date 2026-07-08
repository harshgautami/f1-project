import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
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

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} />
          ) : (
            <Register />
          )
        }
      />

      {/* User Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <UserTeams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <ProtectedRoute>
            <UserDrivers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drivers/:id"
        element={
          <ProtectedRoute>
            <UserDriverProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/races"
        element={
          <ProtectedRoute>
            <UserRaces />
          </ProtectedRoute>
        }
      />
      <Route
        path="/standings"
        element={
          <ProtectedRoute>
            <UserStandings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <UserRaceHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-staff"
        element={
          <ProtectedRoute>
            <UserTeamStaff />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teams"
        element={
          <ProtectedRoute adminOnly>
            <AdminTeams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/drivers"
        element={
          <ProtectedRoute adminOnly>
            <AdminDrivers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/races"
        element={
          <ProtectedRoute adminOnly>
            <AdminRaces />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/standings"
        element={
          <ProtectedRoute adminOnly>
            <AdminStandings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute adminOnly>
            <AdminStaff />
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
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

export default App;
