import { describe, expect, it } from "vitest";
import {
  bumpWorkspaceSwitchScope,
  currentWorkspaceSwitchGeneration,
  isCurrentWorkspaceSwitchGeneration,
  workspaceSwitchSignal,
} from "./workspaceSwitchScope";

describe("workspaceSwitchScope", () => {
  it("bumps generation and aborts the previous signal on switch", () => {
    const before = currentWorkspaceSwitchGeneration();
    const previousSignal = workspaceSwitchSignal();
    const next = bumpWorkspaceSwitchScope();
    expect(next).toBe(before + 1);
    expect(previousSignal.aborted).toBe(true);
    expect(isCurrentWorkspaceSwitchGeneration(next)).toBe(true);
    expect(isCurrentWorkspaceSwitchGeneration(before)).toBe(false);
  });
});
