import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IconLogout, IconUser } from "./Icons";

/* The F1.com-style masthead: angled red brand block, flat link rail, and the
   session actions pinned right. Same shape for both roles — only the rail
   changes — so the chrome never shifts when you switch accounts. */

const ADMIN_LINKS = [
  ["/admin", "Dashboard"],
  ["/admin/teams", "Teams"],
  ["/admin/drivers", "Drivers"],
  ["/admin/races", "Races"],
  ["/admin/standings", "Standings"],
  ["/admin/staff", "Staff"],
  ["/live", "Live Timing"],
];

const USER_LINKS = [
  ["/dashboard", "Latest"],
  ["/races", "Schedule"],
  ["/standings", "Standings"],
  ["/drivers", "Drivers"],
  ["/teams", "Teams"],
  ["/team-staff", "Paddock"],
  ["/history", "Archive"],
  ["/live", "Live Timing"],
];

/** Angled "F1"-style speed mark — italic wordmark plus three swept bars. */
function BrandMark() {
  return (
    <span className="mast-mark" aria-hidden="true">
      <span className="mast-mark-word">F1</span>
      <span className="mast-mark-bars">
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { pathname } = useLocation();
  if (!user) return null;

  const admin = isAdmin();
  const links = admin ? ADMIN_LINKS : USER_LINKS;
  const home = admin ? "/admin" : "/dashboard";

  return (
    <header className="mast">
      <div className="mast-inner">
        <Link to={home} className="mast-brand" aria-label="F1 Management home">
          <BrandMark />
        </Link>

        <nav className="mast-nav" aria-label="Main">
          {links.map(([path, label]) => {
            const active =
              pathname === path || (path !== home && pathname.startsWith(`${path}/`));
            return (
              <Link key={path} to={path} className={active ? "active" : undefined}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mast-actions">
          <span className="mast-user" title={`Signed in as ${user.username}`}>
            <IconUser />
            <span className="mast-user-name">{user.username}</span>
            <em className={`mast-role ${user.role}`}>{user.role}</em>
          </span>
          <button className="mast-btn" onClick={logout}>
            <IconLogout />
            <span>Sign out</span>
          </button>
        </div>
      </div>
      <span className="mast-rule" aria-hidden="true" />
    </header>
  );
}
