import { describe, it, expect, vi, beforeEach } from "vitest";

/* The admin side edits exactly what the user side reads, through two links
   that are easy to break silently: every managed collection needs a screen,
   and every write needs to name the user-facing caches it makes stale. These
   assert both, so the two halves of the app can't drift apart unnoticed. */

vi.mock("../api", () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: [], headers: {} })) },
}));

import API from "../api";
import { loaders, prefetchRouteData } from "../data/loaders";
import { ROUTE_LOADERS } from "../routes";
import {
  driversConfig,
  teamsConfig,
  racesConfig,
  standingsConfig,
  staffConfig,
  raceHistoryConfig,
} from "./resources";

const CONFIGS = {
  "/admin/drivers": driversConfig,
  "/admin/teams": teamsConfig,
  "/admin/races": racesConfig,
  "/admin/standings": standingsConfig,
  "/admin/staff": staffConfig,
  "/admin/history": raceHistoryConfig,
};

// Every cache key a user-facing page can read (the season-parameterised ones
// resolved for a sample season / id).
const USER_KEYS = [
  loaders.drivers.key,
  loaders.teams.key,
  loaders.teamsRes.key,
  loaders.staff.key,
  loaders.history.key,
  loaders.dashboard.key,
  loaders.races(2026).key,
  loaders.standings(2026).key,
  loaders.live(2026).key,
  loaders.driver("abc").key,
];

describe("admin ↔ user data parity", () => {
  beforeEach(() => {
    API.get.mockClear();
  });

  it("every collection the user browses has an admin screen", () => {
    for (const path of Object.keys(CONFIGS))
      expect(ROUTE_LOADERS[path], `${path} is not routed`).toBeTypeOf("function");
  });

  it("every admin write declares the user caches it invalidates", () => {
    for (const [path, config] of Object.entries(CONFIGS)) {
      expect(config.invalidates?.length, `${path} invalidates nothing`).toBeGreaterThan(0);
      for (const prefix of config.invalidates)
        expect(
          USER_KEYS.some((k) => k.startsWith(prefix)),
          `${path} invalidates "${prefix}", which no page reads`,
        ).toBe(true);
    }
  });

  // prefetchRouteData resolves its loaders asynchronously (a season-scoped
  // route first asks which seasons exist), so let the queue drain.
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("hovering an admin link warms the same data its screen will read", async () => {
    for (const [path, config] of Object.entries(CONFIGS)) {
      API.get.mockClear();
      prefetchRouteData(path);
      await flush();
      const urls = API.get.mock.calls.map(([u]) => u);
      expect(urls, `${path} prefetched nothing`).toContain(config.endpoint);
    }
  });

  it("the archive exposes the win split the user-facing Archive charts", () => {
    const teamWins = raceHistoryConfig.fields.find((f) => f.key === "teamWins");
    expect(teamWins?.type).toBe("list");
    expect(teamWins.itemFields.map((f) => f.key)).toEqual(["team", "wins", "color"]);
  });
});
