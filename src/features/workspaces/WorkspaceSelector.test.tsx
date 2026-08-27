import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  partitionWorkspaces,
  WorkspaceSelector,
  type WorkspaceOption,
} from "./WorkspaceSelector";

afterEach(cleanup);

const workspaces: WorkspaceOption[] = [
  {
    tenantId: "personal-1",
    tenantName: "Ada's Learning Space",
    tenantCode: "IND-AAA",
    tenantType: "individual",
    roleLabel: "Teacher",
    current: true,
  },
  {
    tenantId: "school-1",
    tenantName: "Adunni Academy",
    tenantCode: "ADN",
    tenantType: "school",
    roleLabel: "Teacher",
  },
  {
    tenantId: "school-2",
    tenantName: "Royal Gateway Academy",
    tenantCode: "RGA",
    tenantType: "school",
    roleLabel: "Parent",
  },
];

describe("partitionWorkspaces", () => {
  it("separates personal and school memberships", () => {
    const { personal, schools } = partitionWorkspaces(workspaces);
    expect(personal).toHaveLength(1);
    expect(schools).toHaveLength(2);
  });
});

describe("WorkspaceSelector", () => {
  it("lists Personal and Schools sections with school · role labels", () => {
    const onSwitch = vi.fn();
    render(
      <WorkspaceSelector
        workspaces={workspaces}
        workspaceType="personal"
        onSwitchWorkspace={onSwitch}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /My Skuggle/i }));
    expect(screen.getAllByText("Personal").length).toBeGreaterThan(0);
    expect(screen.getByText("Schools")).toBeInTheDocument();
    expect(screen.getByText(/Adunni Academy · Teacher/i)).toBeInTheDocument();
    expect(screen.getByText(/Royal Gateway Academy · Parent/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /Adunni Academy/i }));
    expect(onSwitch).toHaveBeenCalledWith("school-1");
  });

  it("shows school · role on the trigger when a school workspace is active", () => {
    const schoolActive = workspaces.map((w) => ({
      ...w,
      current: w.tenantId === "school-1",
    }));
    render(
      <WorkspaceSelector
        workspaces={schoolActive}
        workspaceType="school"
        onSwitchWorkspace={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Adunni Academy · Teacher/i }),
    ).toBeInTheDocument();
    expect(within(screen.getByRole("button")).getByText("School")).toBeInTheDocument();
  });
});
