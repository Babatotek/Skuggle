/**
 * Cancels in-flight tenant-scoped requests when the active workspace changes.
 * Switch itself must run after bump so it is not aborted.
 */
let generation = 0;
let controller = new AbortController();

export function bumpWorkspaceSwitchScope(): number {
  generation += 1;
  controller.abort("workspace-switch");
  controller = new AbortController();
  return generation;
}

export function currentWorkspaceSwitchGeneration(): number {
  return generation;
}

export function workspaceSwitchSignal(): AbortSignal {
  return controller.signal;
}

export function isCurrentWorkspaceSwitchGeneration(value: number): boolean {
  return value === generation;
}
