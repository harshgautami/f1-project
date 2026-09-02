import API from "../api";
import { prefetch } from "../hooks/useFetch";
import { RACE_SEASON, STANDINGS_SEASON } from "../config/season";

/* ---------------------------------------------------------------------------
   Page data loaders — one definition per page, shared by the page itself
   (via useFetch) and by prefetching. Keeping key + fetcher together means a
   hover or idle prefetch fills exactly the cache entry the page will read.
   ------------------------------------------------------------------------- */

const body = (r) => r.data;

export const loaders = {
  drivers: { key: "drivers", fetch: () => API.get("/drivers").then(body) },
  teams: { key: "teams", fetch: () => API.get("/teams").then(body) },
  // UserTeams reads the axios response itself, so this one keeps the envelope.
  teamsRes: { key: "teams:res", fetch: () => API.get("/teams") },
  staff: {
    key: "staff",
    fetch: () => Promise.all([API.get("/team-staff"), API.get("/teams")]),
  },
  history: { key: "history", fetch: () => API.get("/race-history").then(body) },
  dashboard: {
    key: "dashboard",
    fetch: async () => {
      const [races, standings] = await Promise.all([
        API.get(`/races?season=${RACE_SEASON}&include=results`),
        API.get(`/standings?season=${STANDINGS_SEASON}&type=driver`),
      ]);
      return { races: races.data, standings: standings.data };
    },
  },
  adminCounts: {
    key: "admin:counts",
    fetch: async () => {
      const [t, d, r, s] = await Promise.all([
        API.get("/teams"),
        API.get("/drivers"),
        API.get(`/races?season=${RACE_SEASON}`),
        API.get("/team-staff"),
      ]);
      return {
        teams: t.data.length,
        drivers: d.data.length,
        races: r.data.length,
        staff: s.data.length,
      };
    },
  },
  races: (season) => ({
    key: `races:${season}`,
    fetch: () => API.get(`/races?season=${season}`).then(body),
  }),
  standings: (season) => ({
    key: `standings:${season}`,
    fetch: () =>
      Promise.all([
        API.get(`/standings?season=${season}&type=driver`),
        API.get(`/standings?season=${season}&type=constructor`),
      ]).then(([dRes, cRes]) => ({ driver: dRes.data, constructor: cRes.data })),
  }),
  live: (season) => ({
    key: `live:${season}`,
    fetch: async () => {
      const [drivers, races] = await Promise.all([
        API.get("/drivers"),
        API.get(`/races?season=${season}&include=results`),
      ]);
      return { drivers: drivers.data, races: races.data };
    },
  }),
  driver: (id) => ({
    key: `driver:${id}`,
    fetch: () => API.get(`/drivers/${id}`).then(body),
  }),
};

/** What each route needs on arrival (current-season defaults). */
const ROUTE_DATA = {
  "/dashboard": () => [loaders.dashboard],
  "/races": () => [loaders.races(RACE_SEASON)],
  "/standings": () => [loaders.standings(STANDINGS_SEASON)],
  "/drivers": () => [loaders.drivers, loaders.teams],
  "/teams": () => [loaders.teamsRes],
  "/team-staff": () => [loaders.staff],
  "/history": () => [loaders.history],
  "/live": () => [loaders.live(RACE_SEASON)],
  "/admin": () => [loaders.adminCounts],
};

/** Fill the cache for a route's data ahead of navigating to it. */
export function prefetchRouteData(path) {
  for (const l of ROUTE_DATA[path]?.() || []) prefetch(l.key, l.fetch);
}

/** After sign-in: warm every page's data for the role, spaced out over idle
    time so it never competes with the page the user is actually looking at. */
export function warmData(admin) {
  const paths = admin
    ? ["/admin"]
    : ["/dashboard", "/standings", "/races", "/drivers", "/teams", "/team-staff", "/history", "/live"];
  const idle =
    typeof window !== "undefined" && window.requestIdleCallback
      ? (cb) => window.requestIdleCallback(cb, { timeout: 3000 })
      : (cb) => setTimeout(cb, 800);
  let i = 0;
  const next = () => {
    if (i >= paths.length) return;
    prefetchRouteData(paths[i++]);
    idle(next);
  };
  idle(next);
}
