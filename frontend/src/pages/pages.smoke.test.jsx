import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

/* Every page now renders through the shared hub primitives, so one broken
   prop contract would take out most of the app at once. This mounts each
   screen against fixture data and asserts its hero landed — cheap insurance
   that the design system stays wired up. */

import Navbar from "../components/Navbar";
import Login from "./Login";
import Register from "./Register";
import UserDrivers from "./user/UserDrivers";
import UserDriverProfile from "./user/UserDriverProfile";
import UserTeams from "./user/UserTeams";
import UserTeamStaff from "./user/UserTeamStaff";
import UserStandings from "./user/UserStandings";
import UserRaces from "./user/UserRaces";
import UserRaceHistory from "./user/UserRaceHistory";
import LiveRace from "./user/LiveRace";
import AdminDashboard from "./admin/AdminDashboard";
import AdminDrivers from "./admin/AdminDrivers";

beforeAll(() => {
  // jsdom ships none of these; framer-motion and recharts need them to exist.
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
      dispatchEvent: () => false,
    }));
  window.IntersectionObserver =
    window.IntersectionObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  window.ResizeObserver =
    window.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  // jsdom has no SVG geometry engine; TrackMap samples the circuit with these.
  if (globalThis.SVGElement && !SVGElement.prototype.getTotalLength) {
    SVGElement.prototype.getTotalLength = () => 1000;
    SVGElement.prototype.getPointAtLength = () => ({ x: 0, y: 0 });
  }
});

vi.mock("../data/circuits", () => ({
  getCircuit: () => ({ d: "M100 100 L900 100 L900 500 L100 500 Z" }),
}));

vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { username: "tifosi", role: "user" },
    isAdmin: () => false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const TEAM = {
  _id: "t1",
  name: "Ferrari",
  fullName: "Scuderia Ferrari HP",
  color: "#E8002D",
  base: "Maranello",
  teamPrincipal: "Fred Vasseur",
  powerUnit: "Ferrari",
  chassis: "SF-26",
  firstEntry: 1950,
  worldChampionships: 16,
};

const DRIVER = {
  _id: "d1",
  firstName: "Charles",
  lastName: "Leclerc",
  number: 16,
  nationality: "Monegasque",
  worldChampionships: 0,
  totalRaceWins: 8,
  totalPodiums: 43,
  totalPoints: 1430,
  team: TEAM,
  biography: "Ferrari's qualifying specialist.",
  seasonsActive: "2018–present",
  history: [
    { year: 2024, team: "Ferrari", position: 3, wins: 3, podiums: 13, points: 356 },
    { year: 2025, team: "Ferrari", position: 5, wins: 0, podiums: 7, points: 210 },
  ],
};

const RACES = [
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
    winnerName: "Charles Leclerc",
    winnerTeam: "Ferrari",
    results: [
      { position: 1, driver: "Charles Leclerc", number: 16, team: "Ferrari", color: "#E8002D", grid: 2, time: "1:27:11.335" },
      { position: 2, driver: "George Russell", number: 63, team: "Mercedes", color: "#27F4D2", grid: 1, time: "+0.427" },
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
];

const DRIVER_STANDINGS = [
  { _id: "s1", position: 1, name: "Andrea Kimi Antonelli", team: "Mercedes", nationality: "Italian", wins: 4, points: 179 },
  { _id: "s2", position: 2, name: "George Russell", team: "Mercedes", nationality: "British", wins: 2, points: 154 },
  { _id: "s3", position: 3, name: "Lewis Hamilton", team: "Ferrari", nationality: "British", wins: 1, points: 147 },
];

const TEAM_STANDINGS = [
  { _id: "c1", position: 1, name: "Mercedes", nationality: "German", wins: 6, points: 333 },
  { _id: "c2", position: 2, name: "Ferrari", nationality: "Italian", wins: 3, points: 291 },
];

const STAFF = [
  {
    _id: "p1",
    name: "Jock Clear",
    role: "Race engineer",
    department: "mechanical",
    nationality: "British",
    experience: 25,
    team: TEAM,
    teamName: "Ferrari",
  },
];

const HISTORY = [
  {
    year: 2025,
    totalRaces: 24,
    champion: "Max Verstappen",
    championTeam: "Red Bull Racing",
    constructorChampion: "McLaren",
    teamWins: [
      { team: "McLaren", wins: 12, color: "#FF8000" },
      { team: "Red Bull Racing", wins: 7, color: "#3671C6" },
    ],
  },
];

vi.mock("../api", () => ({
  default: {
    get: vi.fn((url) => {
      if (url.startsWith("/drivers/")) return Promise.resolve({ data: DRIVER });
      if (url.startsWith("/drivers")) return Promise.resolve({ data: [DRIVER] });
      if (url.startsWith("/teams")) return Promise.resolve({ data: [TEAM] });
      if (url.startsWith("/races")) return Promise.resolve({ data: RACES });
      if (url.startsWith("/team-staff")) return Promise.resolve({ data: STAFF });
      if (url.startsWith("/race-history")) return Promise.resolve({ data: HISTORY });
      if (url.includes("type=constructor"))
        return Promise.resolve({ data: TEAM_STANDINGS });
      return Promise.resolve({ data: DRIVER_STANDINGS });
    }),
  },
}));

const mount = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe("every page renders in the hub design language", () => {
  it("masthead shows the brand, the rail and the session actions", () => {
    mount(<Navbar />);
    expect(screen.getByText("F1")).toBeInTheDocument();
    expect(screen.getByText("Live Timing")).toBeInTheDocument();
    expect(screen.getByText("tifosi")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  // Several labels appear twice by design — once in the hero panel and once in
  // the stat strip below it — so these assert presence, not uniqueness.
  it("login and register use the split auth shell", () => {
    const { unmount } = mount(<Login />);
    expect(screen.getAllByText("Sign in").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Lights out")).toBeInTheDocument();
    unmount();

    mount(<Register />);
    expect(screen.getAllByText("Create account").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Join the grid")).toBeInTheDocument();
  });

  it("drivers list renders the hero and a driver card", async () => {
    mount(<UserDrivers />);
    expect(await screen.findByText("The grid")).toBeInTheDocument();
    expect(screen.getAllByText("Charles").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Leclerc").length).toBeGreaterThanOrEqual(2);
  });

  it("driver profile renders the kinetic name hero and career table", async () => {
    render(
      <MemoryRouter initialEntries={["/drivers/d1"]}>
        <Routes>
          <Route path="/drivers/:id" element={<UserDriverProfile />} />
        </Routes>
      </MemoryRouter>,
    );
    expect((await screen.findAllByText("Career points")).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Season by season")).toBeInTheDocument();
    expect(screen.getByText("Ferrari's qualifying specialist.")).toBeInTheDocument();
  });

  it("constructors page renders the spec sheet", async () => {
    mount(<UserTeams />);
    expect(await screen.findByText("Titles won")).toBeInTheDocument();
    expect(screen.getByText("Scuderia Ferrari HP")).toBeInTheDocument();
    expect(screen.getByText("Maranello")).toBeInTheDocument();
  });

  it("paddock page groups staff under their team", async () => {
    mount(<UserTeamStaff />);
    expect(await screen.findByText("Head count")).toBeInTheDocument();
    expect(screen.getByText("Jock Clear")).toBeInTheDocument();
    expect(screen.getByText("mechanical")).toBeInTheDocument();
  });

  it("standings page renders ranked championship rows", async () => {
    mount(<UserStandings />);
    expect(await screen.findByText("Leader points")).toBeInTheDocument();
    expect(screen.getByText("Drivers' championship")).toBeInTheDocument();
    expect(screen.getAllByText("Antonelli").length).toBeGreaterThanOrEqual(1);
  });

  it("calendar renders race cards with status", async () => {
    mount(<UserRaces />);
    expect(await screen.findByText("Open race tracker")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getAllByText("Bahrain").length).toBeGreaterThanOrEqual(1);
  });

  it("archive renders season cards", async () => {
    mount(<UserRaceHistory />);
    expect((await screen.findAllByText("Seasons archived")).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("World champion")).toBeInTheDocument();
    expect(screen.getAllByText("Verstappen").length).toBeGreaterThanOrEqual(2);
  });

  it("live tracker wires the hero panel to the session engine", async () => {
    mount(<LiveRace />);
    expect(await screen.findByText("Lap")).toBeInTheDocument();
    expect(screen.getByText("Join live session")).toBeInTheDocument();
    expect(screen.getByText("Classification")).toBeInTheDocument();
    expect(screen.getByText("Real replay")).toBeInTheDocument();
  });

  it("admin CRUD screens inherit the hero, toolbar and table", async () => {
    mount(<AdminDrivers />);
    expect(await screen.findByText("Roster")).toBeInTheDocument();
    expect(screen.getByText("Drivers on file")).toBeInTheDocument();
    expect(screen.getByText("All drivers")).toBeInTheDocument();
    expect(screen.getAllByText(/Add Driver/i).length).toBeGreaterThanOrEqual(1);
  });

  it("admin dashboard renders the control-room hero and collections", async () => {
    mount(<AdminDashboard />);
    expect(await screen.findByText("Records under management")).toBeInTheDocument();
    expect(screen.getByText("Quick actions")).toBeInTheDocument();
    expect(screen.getByText("Manage standings")).toBeInTheDocument();
  });
});
