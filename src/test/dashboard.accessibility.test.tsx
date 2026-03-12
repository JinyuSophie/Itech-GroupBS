import "@testing-library/jest-dom/vitest";
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

describe("Dashboard accessibility", () => {
  test("renders main dashboard sections", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: /welcome back/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /progress overview/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /today's tasks/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /upcoming deadlines/i })
    ).toBeInTheDocument();
  });

  test("has a live status message region", () => {
    renderDashboard();

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent(/dashboard loaded successfully/i);
  });

  test("supports keyboard navigation", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.tab();
    expect(
      screen.getByRole("link", { name: /skip to main content/i })
    ).toHaveFocus();
  });

  test("shows text labels for task status", () => {
    renderDashboard();

    expect(screen.getByText(/not started/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });

  test("renders dashboard tables correctly", () => {
    renderDashboard();

    const tables = screen.getAllByRole("table");
    expect(tables.length).toBeGreaterThanOrEqual(2);
  });
});