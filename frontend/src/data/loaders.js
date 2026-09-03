import API from "../api";
import { prefetch } from "../hooks/useFetch";
import { RACE_SEASON, STANDINGS_SEASON } from "../config/season";

/* ---------------------------------------------------------------------------
   Page data loaders — one definition per page, shared by the page itself
   (via useFetch) and by prefetching. Keeping key + fetcher together means a
   hover or idle prefetch fills exactly the cache entry the page will read.
   ------------------------------------------------------------------------- */

const body = (r) => r.data;

/* Which seasons a collection actually holds (newest first). One request per
   collection per session — the answer cannot change under us mid-visit — and
   shared by every season picker plus the dashboard lookup below. A failure
   resolves to [] so callers quietly fall back to their static list. */
const seasonRequests = new Map();
export const seasonsOf = (endpoint) => {
  if (!seasonRequests.has(endpoint)) {
    seasonRequests.set(
      endpoint,
      API.get(`${endpoint}/seasons`)
        .then(body)
        .then((list) => (Array.isArray(list) ? list : []))
        .catch(() => []),
    );
  }
  return seasonRequests.get(endpoint);
};

/** `preferred` when that season has data behind it, else the newest that does. */
export const resolveSeason = async (endpoint, preferred) => {
  const list = await seasonsOf(endpoint);
  return !list.length || list.includes(preferred) ? preferred : list[0];
};

/** Row count for a collection without downloading it: the list routes report
    the unfiltered total in X-Total-Count whenever paging is requested. */
const count = async (endpoint) => {
  const res = await API.get(`${endpoint}?limit=1`);
  const total = Number(res.headers?.["x-total-count"]);
  if (Number.isFinite(total)) return total;
  // Header not visible (proxy stripped it, CORS not exposing it): fall back
  // to the honest-but-heavier way rather than reporting "1".
  return (await API.get(endpoint)).data.length;
};

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
      // Against a database that stops short of the current year the home hub
      // would otherwise open on an empty calendar and an empty championship;
      // fall back to the newest season each collection actually has.
      const [raceSeason, standingSeason] = await Promise.all([
        resolveSeason("/races", RACE_SEASON),
        resolveSeason("/standings", STANDINGS_SEASON),
      ]);
      const [races, standings] = await Promise.all([
        API.get(`/races?season=${raceSeason}&include=results`),
        API.get(`/standings?season=${standingSeason}&type=driver`),
      ]);
      return {
        races: races.data,
        standings: standings.data,
        raceSeason,
        standingSeason,
      };
    },
  },
  // One card per admin collection, counted the way its manager lists them
  // (unfiltered) so the dashboard figure matches the rows behind the link.
  adminCounts: {
    key: "admin:counts",
    fetch: async () => {
      const [teams, drivers, races, standings, staff, history] = await Promise.all([
        count("/teams"),
        count("/drivers"),
        count("/races"),
        count("/standings"),
        count("/team-staff"),
        count("/race-history"),
      ]);
      return { teams, drivers, races, standings, staff, history };
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

/* Admin CRUD screens. ResourceManager caches its list under
   `admin:<endpoint>` (plus the active filter query) and the data behind its
   selects under `admin:refs:<endpoint>` — matching those keys here is what
   lets hovering an admin nav link warm the screen, the same treatment the
   user-facing routes already had. Endpoints mirror config/resources.jsx. */
const adminList = (endpoint) => ({
  key: `admin:${endpoint}`,
  fetch: () => API.get(endpoint).then(body),
});

const adminTeamRefs = (endpoint) => ({
  key: `admin:refs:${endpoint}`,
  fetch: () => API.get("/teams").then((r) => ({ teams: r.data })),
});

/** What each route needs on arrival. The two season-scoped pages resolve the
    season first so the warmed cache key is the one the page will actually
    read — on a database that stops short of the current year that is the
    newest season with data, not this one. */
const ROUTE_DATA = {
  "/dashboard": () => [loaders.dashboard],
  "/races": async () => [loaders.races(await resolveSeason("/races", RACE_SEASON))],
  "/standings": async () => [
    loaders.standings(await resolveSeason("/standings", STANDINGS_SEASON)),
  ],
  "/drivers": () => [loaders.drivers, loaders.teams],
  "/teams": () => [loaders.teamsRes],
  "/team-staff": () => [loaders.staff],
  "/history": () => [loaders.history],
  "/live": () => [loaders.live(RACE_SEASON)],
  "/admin": () => [loaders.adminCounts],
  "/admin/teams": () => [adminList("/teams")],
  "/admin/drivers": () => [adminList("/drivers"), adminTeamRefs("/drivers")],
  "/admin/races": () => [adminList("/races")],
  "/admin/standings": () => [adminList("/standings")],
  "/admin/staff": () => [adminList("/team-staff"), adminTeamRefs("/team-staff")],
  "/admin/history": () => [adminList("/race-history")],
};

/** Fill the cache for a route's data ahead of navigating to it. */
export function prefetchRouteData(path) {
  const entry = ROUTE_DATA[path];
  if (!entry) return;
  Promise.resolve(entry())
    .then((list) => {
      for (const l of list || []) prefetch(l.key, l.fetch);
    })
    .catch(() => {});
}

/** After sign-in: warm every page's data for the role, spaced out over idle
    time so it never competes with the page the user is actually looking at. */
export function warmData(admin) {
  const paths = admin
    ? [
        "/admin",
        "/admin/teams",
        "/admin/drivers",
        "/admin/races",
        "/admin/standings",
        "/admin/staff",
        "/admin/history",
        "/live",
      ]
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
