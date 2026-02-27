import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? "active" : "");

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to={isAdmin() ? "/admin" : "/dashboard"} className="navbar-brand">
        <span>F1</span> Management
      </Link>

      <div className="navbar-links">
        {isAdmin() ? (
          <>
            <Link to="/admin" className={isActive("/admin")}>
              Dashboard
            </Link>
            <Link to="/admin/teams" className={isActive("/admin/teams")}>
              Teams
            </Link>
            <Link to="/admin/drivers" className={isActive("/admin/drivers")}>
              Drivers
            </Link>
            <Link to="/admin/races" className={isActive("/admin/races")}>
              Races
            </Link>
            <Link
              to="/admin/standings"
              className={isActive("/admin/standings")}
            >
              Standings
            </Link>
            <Link to="/admin/staff" className={isActive("/admin/staff")}>
              Staff
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className={isActive("/dashboard")}>
              Dashboard
            </Link>
            <Link to="/teams" className={isActive("/teams")}>
              Teams
            </Link>
            <Link to="/drivers" className={isActive("/drivers")}>
              Drivers
            </Link>
            <Link to="/races" className={isActive("/races")}>
              Races
            </Link>
            <Link to="/standings" className={isActive("/standings")}>
              Standings
            </Link>
            <Link to="/history" className={isActive("/history")}>
              History
            </Link>
            <Link to="/team-staff" className={isActive("/team-staff")}>
              Staff
            </Link>
          </>
        )}
      </div>

      <div className="nav-user-info">
        <span className={`nav-role-badge ${user.role}`}>{user.role}</span>
        <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          {user.username}
        </span>
        <button
          className="btn-logout"
          onClick={logout}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontFamily: "inherit",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
