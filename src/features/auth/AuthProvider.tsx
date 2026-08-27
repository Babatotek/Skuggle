import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { appConfig } from "@/app/config";
import type { AuthenticatedUser } from "@/app/types";
import { getApiError } from "@/shared/api/client";
import { authService, type LoginInput } from "./authService";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  status: "loading" | "authenticated" | "unauthenticated" | "error";
  error: Error | null;
  login: (input: LoginInput) => Promise<AuthenticatedUser>;
  completeMfaChallenge: (input: {
    code?: string;
    recovery_code?: string;
  }) => Promise<AuthenticatedUser>;
  switchWorkspace: (tenantId: string) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthEventType = "login" | "logout" | "session-expired";
interface AuthEventMessage {
  type: AuthEventType;
  at: number;
}

const AUTH_CHANNEL = "skuggle-auth";
const AUTH_STORAGE_KEY = "skuggle:auth-event";
/** Set after a successful login. Session cookies are HttpOnly, so we cannot
 *  detect a real session from document.cookie — only XSRF-TOKEN is readable,
 *  and that exists for guests too (which caused noisy /auth/me 401s). */
const EXPECT_SESSION_KEY = "skuggle:expect-session";

const expectsSession = (): boolean => {
  try {
    return localStorage.getItem(EXPECT_SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

const markExpectsSession = (): void => {
  try {
    localStorage.setItem(EXPECT_SESSION_KEY, "1");
  } catch {
    // Ignore storage failures (private mode / policy).
  }
};

const clearExpectsSession = (): void => {
  try {
    localStorage.removeItem(EXPECT_SESSION_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const isAuthEventMessage = (value: unknown): value is AuthEventMessage => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    ["login", "logout", "session-expired"].includes(String(record.type)) &&
    typeof record.at === "number"
  );
};

const publishAuthEvent = (type: AuthEventType): void => {
  const message: AuthEventMessage = { type, at: Date.now() };
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage(message);
    channel.close();
  }
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(message));
  } catch {
    // Private browsing or storage policy may disable this fallback.
  }
};

const hardRedirectToLogin = (expired = false): void => {
  window.location.replace(expired ? "/login?expired=1" : "/login");
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const handlingTerminalEvent = useRef(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>(
    appConfig.liveApi ? "loading" : "unauthenticated",
  );
  const [error, setError] = useState<Error | null>(null);
  const [sessionProbeEnabled, setSessionProbeEnabled] = useState(
    appConfig.liveApi,
  );

  const probeSession = useCallback(async (): Promise<void> => {
    if (!appConfig.liveApi || !sessionProbeEnabled) {
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
      return;
    }

    // Guests (and CSRF-only cookies) must not hit /auth/me.
    if (!expectsSession()) {
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
      return;
    }

    setStatus((prev) => (prev === "authenticated" ? prev : "loading"));
    const probeAbort = new AbortController();
    const probeTimeout = window.setTimeout(() => probeAbort.abort("timeout"), 12_000);
    try {
      const session = await authService.session(probeAbort.signal);
      markExpectsSession();
      setUser(session.user);
      setStatus("authenticated");
      setError(null);
    } catch (caught: unknown) {
      const apiError = getApiError(caught);
      // A cancelled probe must not trap the shell on "loading" or kick a valid session.
      if (apiError.kind === "cancelled" && !probeAbort.signal.aborted) {
        setStatus((prev) => (prev === "authenticated" ? prev : "unauthenticated"));
        return;
      }
      setUser(null);
      if (
        apiError.kind === "unauthorized" ||
        apiError.kind === "forbidden" ||
        apiError.status === 401 ||
        apiError.status === 403
      ) {
        clearExpectsSession();
        setStatus("unauthenticated");
        setError(null);
      } else {
        // Network/server/timeout: leave the public shell usable instead of spinning forever.
        clearExpectsSession();
        setStatus("unauthenticated");
        setError(caught instanceof Error ? caught : new Error(apiError.message));
      }
    } finally {
      window.clearTimeout(probeTimeout);
    }
  }, [sessionProbeEnabled]);

  useEffect(() => {
    void probeSession();
  }, [probeSession]);

  const tearDownLocalSession = useCallback(async (): Promise<void> => {
    clearExpectsSession();
    setSessionProbeEnabled(false);
    setUser(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const clearAndRedirect = useCallback(
    async (expired: boolean): Promise<void> => {
      if (handlingTerminalEvent.current) return;
      handlingTerminalEvent.current = true;
      await tearDownLocalSession();
      hardRedirectToLogin(expired);
    },
    [tearDownLocalSession],
  );

  useEffect(() => {
    const receive = (message: AuthEventMessage): void => {
      if (message.type === "login") {
        setSessionProbeEnabled(true);
        void probeSession();
        return;
      }
      void clearAndRedirect(message.type === "session-expired");
    };
    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== AUTH_STORAGE_KEY || !event.newValue) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        if (isAuthEventMessage(parsed)) receive(parsed);
      } catch {
        // Ignore malformed cross-tab messages.
      }
    };
    const handleSessionExpired = (): void => {
      publishAuthEvent("session-expired");
      void clearAndRedirect(true);
    };
    const channel =
      "BroadcastChannel" in window ? new BroadcastChannel(AUTH_CHANNEL) : null;
    if (channel) {
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (isAuthEventMessage(event.data)) receive(event.data);
      };
    }
    window.addEventListener("storage", handleStorage);
    window.addEventListener("skuggle:session-expired", handleSessionExpired);
    return () => {
      channel?.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "skuggle:session-expired",
        handleSessionExpired,
      );
    };
  }, [clearAndRedirect, probeSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      error,
      login: async (input) => {
        handlingTerminalEvent.current = false;
        setSessionProbeEnabled(true);
        const response = await authService.login(input);
        markExpectsSession();
        setUser(response.user);
        setStatus("authenticated");
        setError(null);
        publishAuthEvent("login");
        return response.user;
      },
      completeMfaChallenge: async (input) => {
        handlingTerminalEvent.current = false;
        setSessionProbeEnabled(true);
        const response = await authService.completeMfaChallenge(input);
        markExpectsSession();
        setUser(response.user);
        setStatus("authenticated");
        setError(null);
        publishAuthEvent("login");
        return response.user;
      },
      switchWorkspace: async (tenantId) => {
        const response = await authService.switchWorkspace(tenantId);
        setUser(response.user);
        setStatus("authenticated");
        setError(null);
        return response.user;
      },
      logout: async () => {
        if (handlingTerminalEvent.current) return;
        handlingTerminalEvent.current = true;
        setSessionProbeEnabled(false);
        try {
          if (appConfig.liveApi) {
            await authService.logout();
          }
        } catch {
          // Server logout may fail (CSRF/network); local teardown still required.
        } finally {
          await tearDownLocalSession();
          publishAuthEvent("logout");
          hardRedirectToLogin(false);
        }
      },
      refresh: async () => {
        if (!sessionProbeEnabled) return;
        await probeSession();
      },
    }),
    [error, probeSession, sessionProbeEnabled, status, tearDownLocalSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
};
