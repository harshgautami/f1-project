import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* The user-facing pages have to stay honest against a database that is behind
   the calendar — a deployment seeded before the Jolpica sync existed, or one
   whose sync hasn't been re-run this season. Two things used to break there:

     · every 2026 round still read "upcoming", because `status` is a snapshot
       written at sync time and nothing re-writes it as races are run;
     · the championship opened on the current season and found nothing, even
       though the database had a full table one or more years back.

   This fixture is that database: a calendar frozen mid-season, and standings
   that stop at 2024. */

vi.mock("../../data/circuits", () => ({
  getCircuit: () => ({ d: "M100 100 L900 100 L900 500 L100 500 Z" }),
}));

const STALE_RACES = [
  // Run months ago, but the row still says "upcoming".
  {
    _id: "r1",
    round: 1,
    name: "Bahrain Grand Prix",
    circuit: "Bahrain International Circuit",
    country: "Bahrain",
    date: "2026-04-12T15:00:00.000Z",
    season: 2026,
    laps: 57,
    status: "upcoming",
  },
  {
    _id: "r2",
    round: 2,
    name: "Monaco Grand Prix",
    circuit: "Circuit de Monaco",
    country: "Monaco",
    date: "2026-06-07T13:00:00.000Z",
    season: 2026,
    laps: 78,
    status: "upcoming",
  },
  // Genuinely still to come.
  {
    _id: "r3",
    round: 3,
    name: "Abu Dhabi Grand Prix",
    circuit: "Yas Marina Circuit",
    country: "UAE",
    date: "2099-12-06T13:00:00.000Z",
    season: 2026,
    laps: 58,
    status: "upcoming",
  },
];

const STANDINGS_2024 = [
  { _id: "s1", position: 1, name: "Max Verstappen", team: "Red Bull Racing", nationality: "Dutch", wins: 9, points: 437 },
  { _id: "s2", position: 2, name: "Lando Norris", team: "McLaren", nationality: "British", wins: 4, points: 374 },
];

vi.mock("../../api", () => ({
  default: {
    get: vi.fn((url) => {
      if (url.startsWith("/races/seasons")) return Promise.resolve({ data: [2026] });
      if (url.startsWith("/standings/seasons")) return Promise.resolve({ data: [2024] });
      if (url.startsWith("/races")) return Promise.resolve({ data: STALE_RACES });
      if (url.includes("/standings"))
        return Promise.resolve({ data: url.includes("season=2024") ? STANDINGS_2024 : [] });
      return Promise.resolve({ data: [] });
    }),
  },
}));

import UserRaces from "./UserRaces";
import UserStandings from "./UserStandings";

const mount = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);
const statuses = (container) =>
  [...container.querySelectorAll(".hub-race-status")].map((el) => el.textContent);

describe("user pages against a database that is behind the calendar", () => {
  it("shows a round that has been run as completed, whatever the row says", async () => {
    const { container } = mount(<UserRaces />);
    await waitFor(() => expect(statuses(container)).toHaveLength(3));
    expect(statuses(container)).toEqual(["completed", "completed", "upcoming"]);
  });

  it("counts down to the first round that has not been run", async () => {
    mount(<UserRaces />);
    // The hero titles the next race by country — not Bahrain, run in April.
    expect(await screen.findByText("UAE")).toBeInTheDocument();
  });

  it("falls back to the newest season the championship actually has", async () => {
    const { container } = mount(<UserStandings />);
    // The standings row splits the name, so match on the surname element.
    expect((await screen.findAllByText("Verstappen")).length).toBeGreaterThan(0);
    expect(screen.queryByText("No standings yet")).not.toBeInTheDocument();
    // …and the picker follows it, rather than sitting on an empty season.
    expect(container.querySelector(".hub-select-value").textContent).toBe("2024");
  });
});
