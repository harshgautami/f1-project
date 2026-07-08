import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader, Badge, EmptyState } from "./ui";

describe("PageHeader", () => {
  it("renders the accent word and the title", () => {
    render(<PageHeader accent="Manage" title="Drivers" subtitle="20 drivers" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Manage Drivers");
    expect(screen.getByText("20 drivers")).toBeInTheDocument();
  });
});

describe("Badge / EmptyState", () => {
  it("applies the badge class and renders children", () => {
    render(<Badge className="badge-pitstop">Pit Crew</Badge>);
    const el = screen.getByText("Pit Crew");
    expect(el).toHaveClass("badge", "badge-pitstop");
  });

  it("shows an empty-state message", () => {
    render(<EmptyState title="No drivers" message="Add one to start" />);
    expect(screen.getByText("No drivers")).toBeInTheDocument();
    expect(screen.getByText("Add one to start")).toBeInTheDocument();
  });
});
