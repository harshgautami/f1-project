import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserDashboard from "./UserDashboard";

// jsdom ships neither of these; framer-motion's useInView/useReducedMotion
// need them to exist.
beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }));
  window.IntersectionObserver =
    window.IntersectionObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

vi.mock("../../data/circuits", () => ({
  getCircuit: () => ({ d: "M100 100 L900 100 L900 500 L100 500 Z" }),
}));

vi.mock("../../api", () => ({
  default: {
    get: vi.fn((url) => {
      // The loader asks which seasons each collection holds before querying.
      if (url.endsWith("/seasons")) return Promise.resolve({ data: [2026] });
      if (url.startsWith("/races")) {
        return Promise.resolve({
          data: [
            {
              _id: "r1",
              round: 1,
              name: "Bahrain Grand Prix",
              circuit: "Bahrain International Circuit",
              country: "Bahrain",
              city: "Sakhir",
              date: "2026-03-08T15:00:00.000Z",
              season: 2026,
              laps: 57,
              status: "completed",
              results: [
                { position: 1, driver: "Charles Leclerc", number: 16, team: "Ferrari", color: "#E8002D", grid: 2, time: "1:27:11.335" },
                { position: 2, driver: "George Russell", number: 63, team: "Mercedes", color: "#27F4D2", grid: 1, time: "+0.427" },
                { position: 3, driver: "Lewis Hamilton", number: 44, team: "Ferrari", color: "#E8002D", grid: 3, time: "+0.772" },
              ],
            },
            {
              _id: "r2",
              round: 2,
              name: "Spanish Grand Prix",
              circuit: "Circuit de Barcelona-Catalunya",
              country: "Spain",
              city: "Barcelona",
              date: "2099-06-01T13:00:00.000Z",
              season: 2026,
              laps: 66,
              status: "upcoming",
              results: [],
            },
          ],
        });
      }
      return Promise.resolve({
        data: [
          { _id: "s1", position: 1, name: "Andrea Kimi Antonelli", team: "Mercedes", points: 179 },
          { _id: "s2", position: 2, name: "George Russell", team: "Mercedes", points: 154 },
          { _id: "s3", position: 3, name: "Lewis Hamilton", team: "Ferrari", points: 147 },
        ],
      });
    }),
  },
}));

describe("UserDashboard (home hub)", () => {
  it("renders the live hero, featured cards and lower zone from season data", async () => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>,
    );

    // Hero: session panel resolves to the last completed GP
    expect(await screen.findByText("Join live session")).toBeInTheDocument();
    expect(screen.getByText("/57")).toBeInTheDocument();
    // appears in the hero top-3 AND the report card's art
    expect(screen.getAllByText("Leclerc").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("+0.427")).toBeInTheDocument();
    expect(screen.getByText("Bahrain International Circuit")).toBeInTheDocument();

    // Featured: report + standings + preview cards
    expect(
      screen.getByText(/How Leclerc won the Bahrain Grand Prix from P2/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/leads the drivers' championship by 25 points/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/What to watch for at the Spanish Grand Prix/),
    ).toBeInTheDocument();

    // Lower zone: schedule row for the next round
    expect(screen.getByText("Spanish Grand Prix")).toBeInTheDocument();
    expect(screen.getByText("R02")).toBeInTheDocument();
  });
});
