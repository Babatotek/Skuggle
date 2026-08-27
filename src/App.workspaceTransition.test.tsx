import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { AuthenticatedUser } from "./app/types";

const personalUser: AuthenticatedUser = {
  id: "user-1",
  name: "Ada Okafor",
  email: "ada@example.com",
  emailVerified: true,
  role: "teacher",
  roleLabel: "Teacher",
  permissions: [],
  tenant: {
    id: "personal-1",
    name: "Ada's Learning Space",
    code: "IND-AAA",
    type: "individual",
  },
  memberships: [
    {
      tenantId: "personal-1",
      tenantName: "Ada's Learning Space",
      tenantCode: "IND-AAA",
      tenantType: "individual",
      tenantStatus: "active",
      role: "teacher",
      roleLabel: "Teacher",
      current: true,
    },
    {
      tenantId: "school-1",
      tenantName: "Adunni Academy",
      tenantCode: "ADN",
      tenantType: "school",
      tenantStatus: "active",
      role: "teacher",
      roleLabel: "Teacher",
      current: false,
    },
  ],
};

const schoolUser: AuthenticatedUser = {
  ...personalUser,
  tenant: {
    id: "school-1",
    name: "Adunni Academy",
    code: "ADN",
    type: "school",
  },
  memberships: personalUser.memberships?.map((m) => ({
    ...m,
    current: m.tenantId === "school-1",
  })),
};

const authState = vi.hoisted(() => ({
  user: null as AuthenticatedUser | null,
  switchWorkspace: vi.fn(),
}));

vi.mock("./features/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: authState.user,
    status: authState.user ? "authenticated" : "unauthenticated",
    login: vi.fn(),
    logout: vi.fn(),
    updateContext: vi.fn(),
    switchWorkspace: authState.switchWorkspace,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("./features/students/studentService", () => ({
  studentService: {
    list: vi.fn(async () => ({ data: [{ id: "stu-1" }], meta: {} })),
  },
  mapStudentSummaryToRecord: vi.fn((row: { id: string }) => ({
    id: row.id,
    name: "Stale Student",
  })),
}));

vi.mock("./features/onboarding/setupRedirect", () => ({
  shouldRedirectToSetup: vi.fn(async () => false),
}));

vi.mock("./app/config", () => ({
  appConfig: {
    name: "Skuggle",
    apiUrl: "/api/v1",
    csrfUrl: "/sanctum/csrf-cookie",
    environment: "test",
    supportEmail: "support@skuggle.com",
    requestTimeoutMs: 15_000,
    liveApi: true,
    enableDemo: false,
    enableGoogleOAuth: false,
  },
}));

vi.mock("./features/workspaces/MySkuggleWorkspace", () => ({
  MySkuggleWorkspace: () => (
    <div>My Skuggle · Personal workspace</div>
  ),
}));

import App from "./App";
import { studentService } from "./features/students/studentService";

afterEach(() => {
  cleanup();
  authState.user = null;
  authState.switchWorkspace.mockReset();
  vi.mocked(studentService.list).mockClear();
});

beforeEach(() => {
  authState.switchWorkspace.mockResolvedValue(schoolUser);
});

describe("App workspace transitions", () => {
  it("routes personal tenants to My Skuggle and does not load school students", async () => {
    authState.user = personalUser;
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/My Skuggle · Personal workspace/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Ownership: Private, only you/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /My Home/i })).toBeInTheDocument();
    expect(screen.queryByText(/Syncing students/i)).not.toBeInTheDocument();
    expect(studentService.list).not.toHaveBeenCalled();
  });

  it("switches personal to school and reloads school context", async () => {
    authState.user = personalUser;
    authState.switchWorkspace.mockImplementation(async () => {
      authState.user = schoolUser;
      return schoolUser;
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByText(/My Skuggle · Personal workspace/i);
    const triggers = screen.getAllByRole("button", { name: /My Skuggle/i });
    fireEvent.click(triggers[0]!);
    fireEvent.click(await screen.findByRole("option", { name: /Adunni Academy/i }));

    await waitFor(() => {
      expect(authState.switchWorkspace).toHaveBeenCalledWith("school-1");
    });
    await waitFor(() => {
      expect(studentService.list).toHaveBeenCalled();
    });
    expect(
      await screen.findByLabelText(/Ownership: Owned by Adunni Academy/i),
    ).toBeInTheDocument();
  });

  it("switches school to personal without keeping school student sync", async () => {
    authState.user = schoolUser;
    authState.switchWorkspace.mockImplementation(async () => {
      authState.user = personalUser;
      return personalUser;
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(studentService.list).toHaveBeenCalled();
    });
    vi.mocked(studentService.list).mockClear();

    const triggers = await screen.findAllByRole("button", {
      name: /Adunni Academy · Teacher/i,
    });
    fireEvent.click(triggers[0]!);
    fireEvent.click(await screen.findByRole("option", { name: /My Skuggle/i }));

    await waitFor(() => {
      expect(authState.switchWorkspace).toHaveBeenCalledWith("personal-1");
    });
    expect(
      await screen.findByText(/My Skuggle · Personal workspace/i),
    ).toBeInTheDocument();
    expect(studentService.list).not.toHaveBeenCalled();
  });
});
