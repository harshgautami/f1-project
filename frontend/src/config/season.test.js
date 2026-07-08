import { describe, it, expect } from "vitest";
import {
  RACE_SEASON,
  STANDINGS_SEASON,
  SEASONS,
  STANDINGS_SEASONS,
  CALENDAR_ROUNDS,
} from "./season";

describe("season config", () => {
  it("exposes sensible season constants", () => {
    expect(Number.isInteger(RACE_SEASON)).toBe(true);
    expect(Number.isInteger(STANDINGS_SEASON)).toBe(true);
    expect(CALENDAR_ROUNDS).toBeGreaterThan(0);
  });

  it("lists the query seasons and includes the defaults", () => {
    expect(SEASONS).toContain(RACE_SEASON);
    expect(STANDINGS_SEASONS).toContain(STANDINGS_SEASON);
  });
});
