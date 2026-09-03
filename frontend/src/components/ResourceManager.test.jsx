import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/* The two behaviours that keep the admin side and the user side telling the
   same story: repeatable subdocument rows survive the round trip, and a write
   drops the caches the user-facing pages read. */

const SEASON = {
  _id: "h1",
  year: 2025,
  totalRaces: 24,
  champion: "Lando Norris",
  championTeam: "McLaren",
  constructorChampion: "McLaren",
  teamWins: [{ _id: "sub1", team: "McLaren", wins: 14, color: "#FF8000" }],
};

vi.mock("../api", () => ({
  default: {
    get: vi.fn((url) =>
      Promise.resolve({
        data: url.startsWith("/race-history") ? [SEASON] : [],
        headers: {},
      }),
    ),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

import API from "../api";
import { prefetch, useFetch } from "../hooks/useFetch";
import ResourceManager from "./ResourceManager";
import { raceHistoryConfig } from "../config/resources";

const mount = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

/** Reports whether a cache key still holds a value (a hit renders instantly). */
function CacheProbe({ cacheKey }) {
  const { loading } = useFetch(() => Promise.resolve(["late"]), [], { key: cacheKey });
  return <span data-testid="probe">{loading ? "miss" : "hit"}</span>;
}

/** Open the edit modal on the one archived season and return its <form>. */
const openEditor = async (container) => {
  fireEvent.click(await screen.findByRole("button", { name: /edit/i }));
  const form = await waitFor(() => {
    const f = container.querySelector(".modal form");
    if (!f) throw new Error("editor did not open");
    return f;
  });
  return form;
};

describe("ResourceManager keeps the two halves of the app in step", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("edits the win split as real rows and sends it without Mongo's _ids", async () => {
    const { container } = mount(<ResourceManager config={raceHistoryConfig} />);
    const form = await openEditor(container);

    // The stored subdocument arrives as an editable row, _id stripped.
    const first = container.querySelector(".form-list-row");
    expect(first.querySelector('input[type="text"]')).toHaveValue("McLaren");
    expect(first.querySelector('input[type="number"]')).toHaveValue(14);

    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    const rows = container.querySelectorAll(".form-list-row");
    expect(rows).toHaveLength(2);
    fireEvent.change(rows[1].querySelector('input[type="text"]'), {
      target: { value: "Red Bull" },
    });

    fireEvent.submit(form);

    await waitFor(() => expect(API.put).toHaveBeenCalled());
    const [url, payload] = API.put.mock.calls[0];
    expect(url).toBe("/race-history/h1");
    expect(payload.teamWins).toEqual([
      { team: "McLaren", wins: 14, color: "#FF8000" },
      { team: "Red Bull", wins: 0, color: "#e10600" },
    ]);
  });

  it("drops an added row the operator never named", async () => {
    const { container } = mount(<ResourceManager config={raceHistoryConfig} />);
    const form = await openEditor(container);

    fireEvent.click(screen.getByRole("button", { name: /add team/i }));
    expect(container.querySelectorAll(".form-list-row")).toHaveLength(2);
    fireEvent.submit(form);

    await waitFor(() => expect(API.put).toHaveBeenCalled());
    expect(API.put.mock.calls[0][1].teamWins).toEqual([
      { team: "McLaren", wins: 14, color: "#FF8000" },
    ]);
  });

  it("removing every row still reaches the server as an empty list", async () => {
    const { container } = mount(<ResourceManager config={raceHistoryConfig} />);
    const form = await openEditor(container);

    fireEvent.click(screen.getByRole("button", { name: /remove row 1/i }));
    expect(container.querySelectorAll(".form-list-row")).toHaveLength(0);
    fireEvent.submit(form);

    await waitFor(() => expect(API.put).toHaveBeenCalled());
    expect(API.put.mock.calls[0][1].teamWins).toEqual([]);
  });

  it("a write drops the user-facing caches the resource feeds", async () => {
    // A user page has already cached the archive this session.
    await act(async () => {
      prefetch("history", () => Promise.resolve(["cached"]));
      await Promise.resolve();
    });
    const before = render(<CacheProbe cacheKey="history" />);
    expect(before.getByTestId("probe")).toHaveTextContent("hit");
    before.unmount();

    const { container } = mount(<ResourceManager config={raceHistoryConfig} />);
    fireEvent.submit(await openEditor(container));
    await waitFor(() => expect(API.put).toHaveBeenCalled());

    const after = render(<CacheProbe cacheKey="history" />);
    expect(after.getByTestId("probe")).toHaveTextContent("miss");
  });
});
