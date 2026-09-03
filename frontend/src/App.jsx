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
import { ROUTE_LOADERS, warmRoutes } from "./routes";
import { warmData } from "./data/loaders";
import Navbar from "./components/Navbar";
import RaceLaunch from "./components/RaceLaunch";
import FXBackground from "./components/FXBackground";
import { Loader } from "./components/ui";

// Auth pages load eagerly (first paint); everything else is code-split so the
// heavy chart/animation code only downloads when that route is visited.
import Login from "./pages/Login";
import Register from "./pages/Register";

// The login backdrop pulls in a WebGL library (ogl) no other screen needs, so
// it ships as its own chunk and only /login pays for it.
const LoginTerminal = lazy(() => import("./components/LoginTerminal"));

// The loaders are shared with routes.js so nav hover / idle prefetch pulls
// the very same chunk React.lazy will ask for.
const UserDashboard = lazy(ROUTE_LOADERS["/dashboard"]);
const UserTeams = lazy(ROUTE_LOADERS["/teams"]);
const UserDrivers = lazy(ROUTE_LOADERS["/drivers"]);
const UserDriverProfile = lazy(ROUTE_LOADERS["/drivers/:id"]);
const UserRaces = lazy(ROUTE_LOADERS["/races"]);
const UserStandings = lazy(ROUTE_LOADERS["/standings"]);
const UserRaceHistory = lazy(ROUTE_LOADERS["/history"]);
const UserTeamStaff = lazy(ROUTE_LOADERS["/team-staff"]);
const LiveRace = lazy(ROUTE_LOADERS["/live"]);
const AdminDashboard = lazy(ROUTE_LOADERS["/admin"]);
const AdminTeams = lazy(ROUTE_LOADERS["/admin/teams"]);
const AdminDrivers = lazy(ROUTE_LOADERS["/admin/drivers"]);
const AdminRaces = lazy(ROUTE_LOADERS["/admin/races"]);
const AdminStandings = lazy(ROUTE_LOADERS["/admin/standings"]);
const AdminStaff = lazy(ROUTE_LOADERS["/admin/staff"]);
const AdminRaceHistory = lazy(ROUTE_LOADERS["/admin/history"]);

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

// No exit animation on route change: waiting for the old page to fade out
// before the new one can even start loading cost ~400ms on every click.
// Pages animate IN (PageTransition); leaving is immediate.
const AppRoutes = () => {
  const location = useLocation();
  return (
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
          <Route path="/admin/history" element={protect(<AdminRaceHistory />, true)} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

function AppShell() {
  const { launching, endLaunch, user } = useAuth();
  // The auth screens (sign in / create account) trade the ambient circuit
  // backdrop for the faulty terminal.
  const { pathname } = useLocation();
  const onAuth = pathname === "/login" || pathname === "/register";

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

  // Once signed in, pull every route's chunk AND its data during idle time,
  // so later navigation never waits on a download, a compile or a fetch.
  React.useEffect(() => {
    if (!user || launching) return;
    warmRoutes(user.role === "admin");
    warmData(user.role === "admin");
  }, [user, launching]);

  return (
    <>
      <div className={`app-container${onAuth ? " has-terminal" : ""}`}>
        {onAuth ? (
          <Suspense fallback={null}>
            <LoginTerminal />
          </Suspense>
        ) : (
          <FXBackground />
        )}
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
