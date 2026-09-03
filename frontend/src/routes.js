/* ---------------------------------------------------------------------------
   Route chunk registry + prefetch.

   Every routed page is code-split. The loaders live here so the same import()
   backs both React.lazy (App.jsx) and prefetching: hovering a nav link, or an
   idle moment after first paint, pulls the chunk in before it's needed — so a
   click never waits on a download (or, in dev, on Vite compiling the page).
   ------------------------------------------------------------------------- */

export const ROUTE_LOADERS = {
  "/dashboard": () => import("./pages/user/UserDashboard"),
  "/teams": () => import("./pages/user/UserTeams"),
  "/drivers": () => import("./pages/user/UserDrivers"),
  "/drivers/:id": () => import("./pages/user/UserDriverProfile"),
  "/races": () => import("./pages/user/UserRaces"),
  "/standings": () => import("./pages/user/UserStandings"),
  "/history": () => import("./pages/user/UserRaceHistory"),
  "/team-staff": () => import("./pages/user/UserTeamStaff"),
  "/live": () => import("./pages/user/LiveRace"),
  "/admin": () => import("./pages/admin/AdminDashboard"),
  "/admin/teams": () => import("./pages/admin/AdminTeams"),
  "/admin/drivers": () => import("./pages/admin/AdminDrivers"),
  "/admin/races": () => import("./pages/admin/AdminRaces"),
  "/admin/standings": () => import("./pages/admin/AdminStandings"),
  "/admin/staff": () => import("./pages/admin/AdminStaff"),
  "/admin/history": () => import("./pages/admin/AdminRaceHistory"),
};

const loaded = new Set();

/** Kick off the chunk for a route path (idempotent, errors ignored). */
export function prefetchRoute(path) {
  const load = ROUTE_LOADERS[path];
  if (!load || loaded.has(path)) return;
  loaded.add(path);
  load().catch(() => loaded.delete(path));
}

/** Warm every route for a role when the browser is idle. */
export function warmRoutes(admin) {
  const paths = Object.keys(ROUTE_LOADERS).filter((p) =>
    admin ? p.startsWith("/admin") || p === "/live" : !p.startsWith("/admin"),
  );
  const idle =
    typeof window !== "undefined" && window.requestIdleCallback
      ? (cb) => window.requestIdleCallback(cb, { timeout: 2500 })
      : (cb) => setTimeout(cb, 1200);
  idle(() => paths.forEach(prefetchRoute));
}
