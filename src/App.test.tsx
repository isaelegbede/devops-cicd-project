import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("operations dashboard", () => {
  it("shows platform overview and service health", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /good morning, alex/i })).toBeInTheDocument();
    expect(screen.getByText("Payments API")).toBeInTheDocument();
    expect(screen.getByText("Identity platform")).toBeInTheDocument();
  });

  it("filters services and shows an empty state for unmatched queries", () => {
    render(<App />);
    const filter = screen.getByRole("searchbox", { name: "Filter services" });

    fireEvent.change(filter, { target: { value: "commerce" } });
    expect(screen.getByText("Payments API")).toBeInTheDocument();
    expect(screen.queryByText("Identity platform")).not.toBeInTheDocument();

    fireEvent.change(filter, { target: { value: "no-such-service" } });
    expect(screen.getByText(/no services match/i)).toBeInTheDocument();
  });
});
