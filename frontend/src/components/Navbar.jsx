import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence, useReducedMotion } from "./motion";
import { useFetch } from "../hooks/useFetch";
import API from "../api";
import { RACE_SEASON } from "../config/season";
import { prefetchRoute } from "../routes";
import { prefetchRouteData } from "../data/loaders";
import { lastRaceOf, nextRaceOf } from "../data/raceStatus";
import { IconLogout, IconChevronRight } from "./Icons";

// Hovering/focusing a rail link pulls in the page's chunk and its data, so
// the click that follows lands on a fully rendered page.
const warmLink = (path) => {
  prefetchRoute(path);
  prefetchRouteData(path);
};

/* ---------------------------------------------------------------------------
   The masthead — a two-tier "pit wall":

     · timing strip: season, the next round with a live countdown to lights
       out, and the last round with its winner (links to the replay)
     · main bar: the angled red speed mark, an uppercase link rail whose red
       indicator glides between routes, and the session card

   Scrolling compacts it (strip folds away, bar shrinks) and the bottom rule
   becomes a page-progress line. Under 900px the rail becomes a full-screen
   sheet with staggered, oversized links. Same shape for both roles — only the
   rail changes — so the chrome never shifts when you switch accounts.
   ------------------------------------------------------------------------- */

const ADMIN_LINKS = [
  ["/admin", "Dashboard"],
  ["/admin/teams", "Teams"],
  ["/admin/drivers", "Drivers"],
  ["/admin/races", "Races"],
  ["/admin/standings", "Standings"],
  ["/admin/staff", "Staff"],
  ["/admin/history", "Archive"],
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

const COMPACT_AT = 24; // px scrolled before the bar folds
const pad = (n) => String(n).padStart(2, "0");
const shortName = (race) => race.name.replace(/ Grand Prix$/i, " GP");

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

/** Ticks once a second while a target date is in the future. */
function useCountdown(date) {
  const target = date ? new Date(date).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target || target <= Date.now()) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const ms = target - now;
  if (!target || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: pad(Math.floor((s % 86400) / 3600)),
    m: pad(Math.floor((s % 3600) / 60)),
    s: pad(s % 60),
  };
}

function TimingStrip({ nextRace, lastRace }) {
  const cd = useCountdown(nextRace?.date);
  return (
    <div className="mast-strip">
      <div className="mast-strip-inner">
        <span className="mast-chip season">
          <i className="dot" />
          {RACE_SEASON} Season
        </span>

        {nextRace && (
          <Link to="/races" className="mast-next" title="Full calendar">
            <span className="mast-strip-k">Next round</span>
            <span className="mast-strip-v">
              R{nextRace.round} · {shortName(nextRace)}
            </span>
            {nextRace.city && <span className="mast-strip-sub">{nextRace.city}</span>}
            {cd && (
              <span className="mast-count mono-num" aria-label="Time to lights out">
                <b>{cd.d}</b>
                <small>d</small>
                <b>{cd.h}</b>
                <small>h</small>
                <b>{cd.m}</b>
                <small>m</small>
                <b>{cd.s}</b>
                <small>s</small>
              </span>
            )}
          </Link>
        )}

        {lastRace && (
          <Link to="/live" className="mast-last" title="Replay the last Grand Prix">
            <span className="mast-strip-k">Last</span>
            <span className="mast-strip-v">
              R{lastRace.round} · {shortName(lastRace)}
            </span>
            {lastRace.winnerName && (
              <span className="mast-strip-sub">{lastRace.winnerName} won</span>
            )}
            <span className="mast-replay">
              <i className="dot pulse" />
              Replay
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

function SessionCard({ user, compact = false }) {
  const initials = String(user.username || "?").slice(0, 2).toUpperCase();
  return (
    <span className="mast-user" title={`Signed in as ${user.username}`}>
      <span className={`mast-avatar ${user.role}`} aria-hidden="true">
        {initials}
      </span>
      {!compact && (
        <span className="mast-user-meta">
          <span className="mast-user-name">{user.username}</span>
          <em className={`mast-role ${user.role}`}>{user.role}</em>
        </span>
      )}
    </span>
  );
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const headRef = useRef(null);
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The strip's next/last round — one fetch for the life of the session.
  const { data: races } = useFetch(
    () => (user ? API.get(`/races?season=${RACE_SEASON}`).then((r) => r.data) : Promise.resolve([])),
    [!!user],
    { key: user ? `races:${RACE_SEASON}` : undefined },
  );
  const { nextRace, lastRace } = useMemo(() => {
    // Effective status (see data/raceStatus): the strip has to keep counting
    // down to the right round even if the calendar has not been re-synced.
    const list = Array.isArray(races) ? races : [];
    const done = lastRaceOf(list.filter((r) => r.winnerName));
    return { nextRace: nextRaceOf(list), lastRace: done };
  }, [races]);

  // Scroll: fold the bar past a threshold (with hysteresis so it doesn't
  // flutter) and drive the progress line through a CSS variable — no re-render.
  // Scroll events already arrive at most once per frame, so no extra throttle.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      headRef.current?.style.setProperty("--scroll-progress", String(Math.min(1, y / max)));
      setCompact((c) => (y > COMPACT_AT ? true : y < 4 ? false : c));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile sheet: close on navigation, lock the page behind it, Esc closes.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Rail indicator: measure the active link once per route/size change and
  // let CSS glide the bar there (framer's layoutId re-measured every render).
  const admin = !!user && isAdmin();
  const navRef = useRef(null);
  const [ind, setInd] = useState(null);
  useEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      const el = nav?.querySelector("a.active");
      if (!nav || !el) return setInd(null);
      setInd({ x: el.offsetLeft - nav.scrollLeft + 10, w: Math.max(0, el.offsetWidth - 20) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname, admin, compact, user]);

  if (!user) return null;

  const links = admin ? ADMIN_LINKS : USER_LINKS;
  const home = admin ? "/admin" : "/dashboard";
  const isActive = (path) =>
    pathname === path || (path !== home && pathname.startsWith(`${path}/`));

  return (
    <header ref={headRef} className={`mast${compact ? " compact" : ""}${menuOpen ? " menu-open" : ""}`}>
      <TimingStrip nextRace={nextRace} lastRace={lastRace} />

      <div className="mast-inner">
        <Link to={home} className="mast-brand" aria-label="F1 Management home">
          <BrandMark />
        </Link>

        <nav className="mast-nav" aria-label="Main" ref={navRef}>
          {links.map(([path, label]) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={active ? "active" : undefined}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => warmLink(path)}
                onFocus={() => warmLink(path)}
                onTouchStart={() => warmLink(path)}
              >
                {path === "/live" && <i className="live-dot" aria-hidden="true" />}
                {label}
              </Link>
            );
          })}
          {/* one indicator for the whole rail, slid under the active link by a
              CSS transition — no per-render layout measuring */}
          <span
            className={`mast-ind${ind ? " on" : ""}`}
            style={ind ? { transform: `translateX(${ind.x}px)`, width: ind.w } : undefined}
            aria-hidden="true"
          />
        </nav>

        <div className="mast-actions">
          <SessionCard user={user} />
          <button className="mast-btn" onClick={logout}>
            <IconLogout />
            <span>Sign out</span>
          </button>
          <button
            type="button"
            className={`mast-burger${menuOpen ? " open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mast-sheet"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <i />
            <i />
            <i />
          </button>
        </div>
      </div>
      <span className="mast-rule" aria-hidden="true" />

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mast-sheet"
            className="mast-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.nav
              className="mast-sheet-nav"
              aria-label="Main"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                show: { transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: 0.05 } },
                hidden: {},
              }}
            >
              {links.map(([path, label], i) => (
                <motion.div
                  key={path}
                  variants={{
                    hidden: { opacity: 0, x: reduce ? 0 : -28 },
                    show: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: reduce ? 0.01 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link to={path} className={`mast-sheet-link${isActive(path) ? " active" : ""}`}>
                    <span className="mast-sheet-num">{pad(i + 1)}</span>
                    <span className="mast-sheet-label">{label}</span>
                    <IconChevronRight />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
            <div className="mast-sheet-foot">
              <SessionCard user={user} />
              <button className="mast-btn" onClick={logout}>
                <IconLogout />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
