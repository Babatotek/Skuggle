import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./app/AppRouter.tsx";
import { AuthProvider } from "./features/auth/AuthProvider";
import { FeedbackProvider } from "./shared/ui";
import "./index.css";

// Clear any legacy Workbox/PWA worker left from earlier deploys. Offline caching
// is intentionally disabled (vite-plugin-pwa selfDestroying), but injectRegister
// is false so old workers would otherwise keep controlling the origin forever.
if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });
  if ("caches" in window) {
    void caches.keys().then((keys) => {
      for (const key of keys) {
        void caches.delete(key);
      }
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FeedbackProvider>
          <AppRouter />
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
