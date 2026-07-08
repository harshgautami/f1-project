import React from "react";
import { RACE_SEASON, STANDINGS_SEASON, SEASONS, STANDINGS_SEASONS } from "./season";

/* Declarative definitions for every admin CRUD screen. Consumed by
   <ResourceManager config={...} />. */

const DEPARTMENTS = [
  "mechanical",
  "physical",
  "pitstop",
  "strategy",
  "management",
  "aerodynamics",
];

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const TeamCell = ({ team }) =>
  team ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: team.color || "#888",
          flex: "none",
        }}
      />
      {team.name}
    </span>
  ) : (
    <span className="text-muted">—</span>
  );

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const teamOptions = (refs) =>
  (refs.teams || []).map((t) => ({ value: t._id, label: t.name }));

export const driversConfig = {
  endpoint: "/drivers",
  singular: "Driver",
  plural: "Drivers",
  eyebrow: "Roster",
  refs: { teams: "/teams" },
  rowLabel: (r) => `${r.firstName} ${r.lastName}`,
  filters: [{ param: "team", label: "Teams", options: teamOptions }],
  columns: [
    {
      key: "number",
      label: "#",
      render: (r) => (
        <span style={{ fontWeight: 800, fontStyle: "italic" }}>{r.number}</span>
      ),
    },
    {
      key: "name",
      label: "Driver",
      render: (r) => (
        <strong style={{ color: "var(--text-primary)" }}>
          {r.firstName} {r.lastName}
        </strong>
      ),
    },
    { key: "team", label: "Team", render: (r) => <TeamCell team={r.team} /> },
    { key: "nationality", label: "Nationality" },
    {
      key: "worldChampionships",
      label: "Titles",
      align: "center",
      render: (r) => (
        <span
          style={{
            fontWeight: 800,
            color: r.worldChampionships > 0 ? "var(--accent-red)" : undefined,
          }}
        >
          {r.worldChampionships}
        </span>
      ),
    },
    { key: "totalRaceWins", label: "Wins", align: "center" },
    {
      key: "totalPoints",
      label: "Points",
      align: "center",
      render: (r) => <span style={{ fontWeight: 700 }}>{r.totalPoints}</span>,
    },
  ],
  fields: [
    { key: "firstName", label: "First Name", type: "text", required: true, half: true },
    { key: "lastName", label: "Last Name", type: "text", required: true, half: true },
    { key: "number", label: "Number", type: "number", required: true, min: 0, max: 99, half: true },
    { key: "nationality", label: "Nationality", type: "text", required: true, half: true },
    { key: "dateOfBirth", label: "Date of Birth", type: "date", required: true, half: true },
    {
      key: "team",
      label: "Team",
      type: "select",
      required: true,
      half: true,
      options: teamOptions,
      edit: (r) => r.team?._id || "",
    },
    { key: "worldChampionships", label: "World Championships", type: "number", min: 0, half: true },
    { key: "totalRaceWins", label: "Total Wins", type: "number", min: 0, half: true },
    { key: "totalPodiums", label: "Total Podiums", type: "number", min: 0, half: true },
    { key: "totalPoints", label: "Total Points", type: "number", min: 0, half: true },
    { key: "seasonsActive", label: "Seasons Active", type: "text", placeholder: "e.g. 2015–present" },
    { key: "biography", label: "Biography", type: "textarea" },
  ],
  emptyForm: {
    firstName: "",
    lastName: "",
    number: "",
    nationality: "",
    dateOfBirth: "",
    team: "",
    worldChampionships: 0,
    totalRaceWins: 0,
    totalPodiums: 0,
    totalPoints: 0,
    seasonsActive: "",
    biography: "",
  },
};

export const teamsConfig = {
  endpoint: "/teams",
  singular: "Team",
  plural: "Teams",
  eyebrow: "Constructors",
  columns: [
    {
      key: "color",
      label: "",
      render: (r) => (
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 14,
            borderRadius: 4,
            background: r.color || "#888",
          }}
        />
      ),
    },
    {
      key: "name",
      label: "Team",
      render: (r) => (
        <strong style={{ color: "var(--text-primary)" }}>{r.name}</strong>
      ),
    },
    { key: "base", label: "Base" },
    { key: "teamPrincipal", label: "Principal" },
    { key: "powerUnit", label: "Power Unit" },
    { key: "worldChampionships", label: "Titles", align: "center" },
  ],
  fields: [
    { key: "name", label: "Name", type: "text", required: true, half: true },
    { key: "fullName", label: "Full Name", type: "text", required: true, half: true },
    { key: "base", label: "Base", type: "text", required: true, half: true },
    { key: "teamPrincipal", label: "Team Principal", type: "text", required: true, half: true },
    { key: "powerUnit", label: "Power Unit", type: "text", required: true, half: true },
    { key: "chassis", label: "Chassis", type: "text", half: true },
    { key: "firstEntry", label: "First Entry", type: "number", min: 1900, max: 2100, half: true },
    { key: "worldChampionships", label: "World Championships", type: "number", min: 0, half: true },
    { key: "color", label: "Team Color", type: "color" },
  ],
  emptyForm: {
    name: "",
    fullName: "",
    base: "",
    teamPrincipal: "",
    powerUnit: "",
    chassis: "",
    firstEntry: "",
    worldChampionships: 0,
    color: "#e10600",
  },
};

export const racesConfig = {
  endpoint: "/races",
  singular: "Race",
  plural: "Races",
  eyebrow: "Calendar",
  filters: [
    {
      param: "season",
      label: "Seasons",
      options: SEASONS.map((y) => ({ value: y, label: String(y) })),
    },
    {
      param: "status",
      label: "Statuses",
      options: ["upcoming", "completed", "cancelled"].map((s) => ({
        value: s,
        label: cap(s),
      })),
    },
  ],
  columns: [
    {
      key: "round",
      label: "Rd",
      render: (r) => <span className="race-round">R{r.round}</span>,
    },
    {
      key: "name",
      label: "Grand Prix",
      render: (r) => (
        <strong style={{ color: "var(--text-primary)" }}>{r.name}</strong>
      ),
    },
    { key: "circuit", label: "Circuit" },
    { key: "country", label: "Country" },
    { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <span className={`race-status ${r.status}`}>{r.status}</span>
      ),
    },
  ],
  fields: [
    { key: "name", label: "Race Name", type: "text", required: true, half: true },
    { key: "circuit", label: "Circuit", type: "text", required: true, half: true },
    { key: "country", label: "Country", type: "text", required: true, half: true },
    { key: "city", label: "City", type: "text", half: true },
    { key: "date", label: "Date", type: "date", required: true, half: true },
    { key: "season", label: "Season", type: "number", required: true, min: 1950, max: 2100, half: true },
    { key: "round", label: "Round", type: "number", required: true, min: 1, half: true },
    { key: "laps", label: "Laps", type: "number", min: 1, half: true },
    { key: "circuitLength", label: "Circuit Length", type: "text", placeholder: "e.g. 5.278 km", half: true },
    {
      key: "status",
      label: "Status",
      type: "select",
      half: true,
      options: ["upcoming", "completed", "cancelled"].map((s) => ({ value: s, label: cap(s) })),
    },
    { key: "winnerName", label: "Winner", type: "text", half: true },
    { key: "winnerTeam", label: "Winning Team", type: "text", half: true },
    { key: "fastestLap", label: "Fastest Lap", type: "text", half: true },
  ],
  emptyForm: {
    name: "",
    circuit: "",
    country: "",
    city: "",
    date: "",
    season: RACE_SEASON,
    round: "",
    laps: "",
    circuitLength: "",
    status: "upcoming",
    winnerName: "",
    winnerTeam: "",
    fastestLap: "",
  },
};

export const standingsConfig = {
  endpoint: "/standings",
  singular: "Standing",
  plural: "Standings",
  eyebrow: "Championship",
  rowLabel: (r) => r.name,
  filters: [
    {
      param: "season",
      label: "Seasons",
      options: STANDINGS_SEASONS.map((y) => ({ value: y, label: String(y) })),
    },
    {
      param: "type",
      label: "Types",
      options: [
        { value: "driver", label: "Drivers" },
        { value: "constructor", label: "Constructors" },
      ],
    },
  ],
  columns: [
    {
      key: "position",
      label: "Pos",
      align: "center",
      render: (r) => (
        <span className={`pos-medal ${r.position <= 3 ? `pos-${r.position}` : ""}`}>
          {r.position}
        </span>
      ),
    },
    { key: "season", label: "Season", align: "center" },
    { key: "type", label: "Type", render: (r) => cap(r.type) },
    {
      key: "name",
      label: "Name",
      render: (r) => (
        <strong style={{ color: "var(--text-primary)" }}>{r.name}</strong>
      ),
    },
    { key: "team", label: "Team" },
    {
      key: "points",
      label: "Points",
      align: "center",
      render: (r) => <span style={{ fontWeight: 700 }}>{r.points}</span>,
    },
    { key: "wins", label: "Wins", align: "center" },
  ],
  fields: [
    { key: "season", label: "Season", type: "number", required: true, min: 1950, max: 2100, half: true },
    {
      key: "type",
      label: "Type",
      type: "select",
      required: true,
      half: true,
      options: [
        { value: "driver", label: "Driver" },
        { value: "constructor", label: "Constructor" },
      ],
    },
    { key: "position", label: "Position", type: "number", required: true, min: 1, half: true },
    { key: "name", label: "Name", type: "text", required: true, half: true },
    { key: "team", label: "Team", type: "text", half: true },
    { key: "nationality", label: "Nationality", type: "text", half: true },
    { key: "points", label: "Points", type: "number", min: 0, half: true },
    { key: "wins", label: "Wins", type: "number", min: 0, half: true },
  ],
  emptyForm: {
    season: STANDINGS_SEASON,
    type: "driver",
    position: "",
    name: "",
    team: "",
    nationality: "",
    points: 0,
    wins: 0,
  },
};

export const staffConfig = {
  endpoint: "/team-staff",
  singular: "Staff Member",
  plural: "Staff",
  eyebrow: "Personnel",
  refs: { teams: "/teams" },
  rowLabel: (r) => r.name,
  filters: [
    { param: "team", label: "Teams", options: teamOptions },
    {
      param: "department",
      label: "Departments",
      options: DEPARTMENTS.map((d) => ({ value: d, label: cap(d) })),
    },
  ],
  columns: [
    {
      key: "name",
      label: "Name",
      render: (r) => (
        <strong style={{ color: "var(--text-primary)" }}>{r.name}</strong>
      ),
    },
    { key: "role", label: "Role" },
    {
      key: "department",
      label: "Department",
      render: (r) => (
        <span className={`badge badge-department badge-${r.department}`}>
          {r.department}
        </span>
      ),
    },
    { key: "team", label: "Team", render: (r) => <TeamCell team={r.team} /> },
    { key: "experience", label: "Experience" },
  ],
  fields: [
    { key: "name", label: "Name", type: "text", required: true, half: true },
    { key: "role", label: "Role", type: "text", required: true, half: true },
    {
      key: "department",
      label: "Department",
      type: "select",
      required: true,
      half: true,
      options: DEPARTMENTS.map((d) => ({ value: d, label: cap(d) })),
    },
    {
      key: "team",
      label: "Team",
      type: "select",
      required: true,
      half: true,
      options: teamOptions,
      edit: (r) => r.team?._id || "",
    },
    { key: "experience", label: "Experience", type: "text", placeholder: "e.g. 12 years", half: true },
    { key: "nationality", label: "Nationality", type: "text", half: true },
  ],
  emptyForm: {
    name: "",
    role: "",
    department: "mechanical",
    team: "",
    experience: "",
    nationality: "",
  },
};

export const raceHistoryConfig = {
  endpoint: "/race-history",
  singular: "Season",
  plural: "Race History",
  eyebrow: "Archive",
  rowLabel: (r) => String(r.year),
  columns: [
    {
      key: "year",
      label: "Year",
      render: (r) => (
        <strong style={{ fontStyle: "italic", color: "var(--text-primary)" }}>
          {r.year}
        </strong>
      ),
    },
    { key: "champion", label: "World Champion" },
    { key: "championTeam", label: "Team" },
    { key: "constructorChampion", label: "Constructors' Champion" },
    { key: "totalRaces", label: "Races", align: "center" },
  ],
  fields: [
    { key: "year", label: "Year", type: "number", required: true, min: 1950, max: 2100, half: true },
    { key: "totalRaces", label: "Total Races", type: "number", required: true, min: 0, half: true },
    { key: "champion", label: "World Champion", type: "text", required: true, half: true },
    { key: "championTeam", label: "Champion's Team", type: "text", required: true, half: true },
    { key: "constructorChampion", label: "Constructors' Champion", type: "text", required: true },
  ],
  emptyForm: {
    year: "",
    totalRaces: "",
    champion: "",
    championTeam: "",
    constructorChampion: "",
  },
};
