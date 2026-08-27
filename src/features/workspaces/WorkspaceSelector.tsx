import { Building2, ChevronDown, UserRound } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type WorkspaceOption = {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  tenantType: string;
  roleLabel: string;
  current?: boolean;
};

type WorkspaceSelectorProps = {
  workspaces: WorkspaceOption[];
  workspaceType: "personal" | "school";
  isSwitchingWorkspace?: boolean;
  onSwitchWorkspace?: (tenantId: string) => void;
  /** Compact trigger for tight header slots (e.g. mobile). */
  compact?: boolean;
};

function workspaceTitle(workspace: WorkspaceOption): string {
  return workspace.tenantType === "individual" ? "My Skuggle" : workspace.tenantName;
}

function workspaceSubtitle(workspace: WorkspaceOption): string {
  if (workspace.tenantType === "individual") {
    return "Personal · Private and portable";
  }
  return `${workspace.tenantName} · ${workspace.roleLabel}`;
}

export function partitionWorkspaces(workspaces: WorkspaceOption[]) {
  const personal = workspaces.filter((w) => w.tenantType === "individual");
  const schools = workspaces.filter((w) => w.tenantType !== "individual");
  return { personal, schools };
}

export function WorkspaceSelector({
  workspaces,
  workspaceType,
  isSwitchingWorkspace = false,
  onSwitchWorkspace,
  compact = false,
}: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const { personal, schools } = useMemo(
    () => partitionWorkspaces(workspaces),
    [workspaces],
  );
  const current = workspaces.find((w) => w.current);
  const triggerLabel =
    workspaceType === "personal"
      ? "My Skuggle"
      : current
        ? `${current.tenantName} · ${current.roleLabel}`
        : "Workspace";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (workspaces.length === 0) return null;

  const renderSection = (label: string, items: WorkspaceOption[]) => {
    if (items.length === 0) return null;
    return (
      <div className="py-1" role="group" aria-label={label}>
        <p className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        {items.map((workspace) => (
          <button
            key={workspace.tenantId}
            type="button"
            role="option"
            aria-selected={Boolean(workspace.current)}
            disabled={isSwitchingWorkspace}
            onClick={() => {
              setOpen(false);
              if (!workspace.current) onSwitchWorkspace?.(workspace.tenantId);
            }}
            className={`w-full rounded-lg px-3 py-2 text-left text-xs ${
              workspace.current
                ? "bg-indigo-50 text-indigo-800 font-bold"
                : "hover:bg-slate-50 text-slate-700"
            }`}
          >
            <p className="font-semibold truncate flex items-center gap-1.5">
              {workspace.tenantType === "individual" ? (
                <UserRound className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Building2 className="h-3.5 w-3.5 shrink-0" />
              )}
              {workspaceTitle(workspace)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 pl-5 truncate">
              {workspaceSubtitle(workspace)}
            </p>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={isSwitchingWorkspace}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 ${
          compact ? "px-2 py-1.5 max-w-[11rem]" : "px-2.5 py-1.5 max-w-[16rem]"
        }`}
      >
        {workspaceType === "personal" ? (
          <UserRound className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Building2 className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate">
          {isSwitchingWorkspace ? "Switching…" : triggerLabel}
        </span>
        <span className="rounded bg-white px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-500 shrink-0">
          {workspaceType === "personal" ? "Personal" : "School"}
        </span>
        <ChevronDown className="w-3 h-3 shrink-0" />
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Workspaces"
          className="absolute left-0 top-full mt-1 z-50 w-72 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg p-1"
        >
          {renderSection("Personal", personal)}
          {personal.length > 0 && schools.length > 0 ? (
            <div className="mx-2 border-t border-slate-100" />
          ) : null}
          {renderSection("Schools", schools)}
        </div>
      )}
    </div>
  );
}
