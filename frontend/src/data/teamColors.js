// Team-name → brand colour, for API rows that carry no colour of their own
// (e.g. standings). Race results already store a per-row colour from the sync.
// Matched by substring so "Red Bull", "Red Bull Racing", etc. all resolve.
const TEAM_COLOR_MAP = [
  ["racing bulls", "#6692FF"],
  ["rb f1", "#6692FF"],
  ["red bull", "#3671C6"],
  ["ferrari", "#E8002D"],
  ["mercedes", "#27F4D2"],
  ["mclaren", "#FF8000"],
  ["aston", "#229971"],
  ["alpine", "#0093CC"],
  ["williams", "#64C4FF"],
  ["sauber", "#52E252"],
  ["audi", "#00D5B8"],
  ["haas", "#B6BABD"],
  ["cadillac", "#C69A5A"],
];

export function teamColor(name = "", fallback = "#e10600") {
  const key = String(name).toLowerCase();
  const hit = TEAM_COLOR_MAP.find(([frag]) => key.includes(frag));
  return hit ? hit[1] : fallback;
}
