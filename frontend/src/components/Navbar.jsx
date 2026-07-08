import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconLogout } from "./Icons";

const ADMIN_LINKS = [
  ["/admin", "Dashboard"],
  ["/admin/teams", "Teams"],
  ["/admin/drivers", "Drivers"],
  ["/admin/races", "Races"],
  ["/admin/standings", "Standings"],
  ["/admin/staff", "Staff"],
];

const USER_LINKS = [
  ["/dashboard", "Dashboard"],
  ["/teams", "Teams"],
  ["/drivers", "Drivers"],
  ["/races", "Races"],
  ["/standings", "Standings"],
  ["/history", "History"],
  ["/team-staff", "Staff"],
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { pathname } = useLocation();
  if (!user) return null;

  const admin = isAdmin();
  const links = admin ? ADMIN_LINKS : USER_LINKS;
  const home = admin ? "/admin" : "/dashboard";

  return (
    <nav className="navbar">
      <Link to={home} className="navbar-brand">
        <span className="brand-mark">F1</span>
        Management
      </Link>

      <div className="navbar-links">
        {links.map(([path, label]) => (
          <Link key={path} to={path} className={pathname === path ? "active" : ""}>
            {label}
          </Link>
        ))}
      </div>

      <div className="nav-user-info">
        <span className={`nav-role-badge ${user.role}`}>{user.role}</span>
        <span className="nav-user-name">{user.username}</span>
        <button className="btn btn-ghost btn-sm" onClick={logout} title="Log out">
          <IconLogout />
        </button>
      </div>
    </nav>
  );
}
