import { describe, expect, it } from "vitest";
import { workspaceHomeTab } from "./workspaceHomeTab";

describe("workspaceHomeTab", () => {
  it("always lands personal workspaces on home", () => {
    expect(workspaceHomeTab("school_admin", "individual")).toBe("home");
    expect(workspaceHomeTab("teacher", "individual")).toBe("home");
  });

  it("maps school roles to their destination home tabs", () => {
    expect(workspaceHomeTab("school_admin", "school")).toBe("dashboard");
    expect(workspaceHomeTab("principal", "school")).toBe("overview");
    expect(workspaceHomeTab("teacher", "school")).toBe("home");
  });
});
