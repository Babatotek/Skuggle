import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Mock the auth provider
vi.mock("./features/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: null,
    status: "unauthenticated",
    login: vi.fn(),
    logout: vi.fn(),
    updateContext: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("renders the Skuggle landing brand", async () => {
    const { unmount } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(await screen.findByText(/Skuggle/i)).toBeInTheDocument();
    unmount();
  });
});
