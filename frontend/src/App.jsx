import React, { lazy, Suspense } from "react";
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
import RaceLaunch from "./components/RaceLaunch";
import FXBackground from "./components/FXBackground";
import { Loader } from "./components/ui";

// Auth pages load eagerly (first paint); everything else is code-split so the
// heavy chart/animation code only downloads when that route is visited.
import Login from "./pages/Login";
import Register from "./pages/Register";

const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const UserTeams = lazy(() => import("./pages/user/UserTeams"));
const UserDrivers = lazy(() => import("./pages/user/UserDrivers"));
const UserDriverProfile = lazy(() => import("./pages/user/UserDriverProfile"));
const UserRaces = lazy(() => import("./pages/user/UserRaces"));
const UserStandings = lazy(() => import("./pages/user/UserStandings"));
const UserRaceHistory = lazy(() => import("./pages/user/UserRaceHistory"));
const UserTeamStaff = lazy(() => import("./pages/user/UserTeamStaff"));
const LiveRace = lazy(() => import("./pages/user/LiveRace"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminTeams = lazy(() => import("./pages/admin/AdminTeams"));
const AdminDrivers = lazy(() => import("./pages/admin/AdminDrivers"));
const AdminRaces = lazy(() => import("./pages/admin/AdminRaces"));
const AdminStandings = lazy(() => import("./pages/admin/AdminStandings"));
const AdminStaff = lazy(() => import("./pages/admin/AdminStaff"));

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, launching } = useAuth();
  if (loading) return <Loader label="Warming up the grid" />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  // While the post-login cinematic plays, hold a quiet placeholder instead of
  // mounting the heavy dashboard — its charts/count-ups would starve the
  // animation's timers. The real page mounts the instant the overlay clears.
  if (launching) return <div className="launch-holding" aria-hidden="true" />;
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
      <Suspense fallback={<Loader label="Loading" />}>
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
          <Route path="/live" element={protect(<LiveRace />)} />

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
      </Suspense>
    </AnimatePresence>
  );
};

function AppShell() {
  const { launching, endLaunch, user } = useAuth();

  // Warm the home-page chunk while the cinematic plays so the wipe reveals a
  // rendered dashboard, not a loading spinner. (The page itself still mounts
  // only after the overlay clears — see ProtectedRoute.)
  React.useEffect(() => {
    if (!launching || !user) return;
    const warm =
      user.role === "admin"
        ? import("./pages/admin/AdminDashboard")
        : import("./pages/user/UserDashboard");
    warm.catch(() => {});
  }, [launching, user]);

  return (
    <>
      <div className="app-container">
        <FXBackground />
        {/* keep the chrome out of the frame while the cinematic plays */}
        {!launching && <Navbar />}
        <div className="main-content">
          <AppRoutes />
        </div>
      </div>
      {/* Post-login cinematic: lights out → driver's-POV launch down the grid. */}
      <AnimatePresence>
        {launching && <RaceLaunch key="launch" onComplete={endLaunch} />}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}
