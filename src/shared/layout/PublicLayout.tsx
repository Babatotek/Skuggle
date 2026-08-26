import { Menu, X } from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useState, type MouseEvent } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { appConfig } from "@/app/config";
import { InteractiveToolsWidget } from "@/components/InteractiveToolsWidget";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { ModalSkeleton } from "@/shared/ui";
import { SmartLibraryWidget } from "@/shared/ui/SmartLibraryWidget";

const ResultCheckerModal = lazy(async () => {
  const mod = await import("@/components/modals/ResultCheckerModal");
  return { default: mod.ResultCheckerModal };
});

const publicLinks = [
  ["HOME", "home"],
  ["FEATURES", "features"],
  ["SOLUTIONS", "solutions"],
  ["PRICING", "pricing"],
  ["ABOUT", "about"],
] as const;

const scrollToSection = (sectionId: string) => {
  const el = document.getElementById(sectionId);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
};

export const PublicLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<unknown>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleOpenModal = useCallback((modalName: string, data?: unknown) => {
    if (modalName === "result_checker") {
      navigate("/result-checker");
      setMenuOpen(false);
      return;
    }
    setActiveModal(modalName);
    setModalData(data ?? null);
    setMenuOpen(false);
  }, [navigate]);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/") return;
    const sectionId = location.hash.replace(/^#/, "");
    if (!sectionId) return;

    let attempts = 0;
    const tryScroll = () => {
      attempts += 1;
      if (scrollToSection(sectionId) || attempts >= 12) return;
      window.setTimeout(tryScroll, 50);
    };

    const timer = window.setTimeout(tryScroll, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const goToSection = (sectionId: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMenuOpen(false);

    if (location.pathname === "/") {
      if (location.hash !== `#${sectionId}`) {
        navigate(`/#${sectionId}`, { replace: false });
      }
      window.requestAnimationFrame(() => {
        scrollToSection(sectionId);
      });
      return;
    }

    navigate(`/#${sectionId}`);
  };

  return (
    <div className="min-h-screen bg-cream-50 text-slate-900">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-[var(--z-sticky)] bg-cream-50/90 py-2 backdrop-blur-xl no-print sm:py-3">
        <div className="app-container rounded-2xl border border-cream-200 bg-white shadow-[0_10px_35px_rgba(36,17,79,.07)]">
          <div className="flex min-h-16 items-center justify-between gap-4 px-3 sm:px-5">
            <BrandLogo />
            <nav
              className="hidden items-center gap-1 lg:flex"
              aria-label="Public navigation"
            >
              {publicLinks.map(([label, sectionId]) => (
                <a
                  key={sectionId}
                  href={`/#${sectionId}`}
                  onClick={goToSection(sectionId)}
                  className="tap-target inline-flex items-center rounded-xl px-3 text-xs font-extrabold tracking-[0.06em] text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {label}
                </a>
              ))}
              <InteractiveToolsWidget
                currentRole="landing"
                onOpenModal={handleOpenModal}
                onNavigate={(path) => navigate(path)}
              />
              <SmartLibraryWidget isGuest onOpenModal={handleOpenModal} />
            </nav>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <InteractiveToolsWidget
                currentRole="landing"
                onOpenModal={handleOpenModal}
                onNavigate={(path) => navigate(path)}
                className="hidden sm:flex lg:hidden"
              />
              <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/login"
                className="tap-target inline-flex items-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-800 hover:bg-brand-50"
              >
                Sign in
              </Link>
              <Link
                to="/join"
                className="tap-target inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-200 hover:bg-brand-700"
              >
                Get started
              </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="tap-target grid place-items-center rounded-xl text-slate-700 hover:bg-brand-50 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="public-mobile-menu"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            >
              {menuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </button>
          </div>
          {menuOpen && (
            <nav
              id="public-mobile-menu"
              className="grid gap-1 border-t border-cream-200 px-3 py-3 lg:hidden"
              aria-label="Mobile public navigation"
            >
              {publicLinks.map(([label, sectionId]) => (
                <a
                  key={sectionId}
                  href={`/#${sectionId}`}
                  onClick={goToSection(sectionId)}
                  className="tap-target flex items-center rounded-xl px-3 py-2 text-sm font-extrabold tracking-wide text-slate-700 hover:bg-brand-50"
                >
                  {label}
                </a>
              ))}
              <div className="px-3 py-2 lg:hidden">
                <InteractiveToolsWidget
                  currentRole="landing"
                  onOpenModal={handleOpenModal}
                  onNavigate={(path) => navigate(path)}
                />
              </div>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="tap-target flex items-center rounded-xl px-3 py-2 text-sm font-extrabold tracking-wide text-slate-700 hover:bg-brand-50"
              >
                SIGN IN
              </Link>
              <Link
                to="/join"
                onClick={() => setMenuOpen(false)}
                className="tap-target flex items-center rounded-xl px-3 py-2 text-sm font-extrabold tracking-wide text-slate-700 hover:bg-brand-50"
              >
                GET STARTED
              </Link>
            </nav>
          )}
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="border-t border-cream-200 bg-white py-10 no-print">
        <div className="app-container grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <BrandLogo />
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Know every student, organise teaching, understand performance and
              keep parents informed—without turning school work into ERP work.
            </p>
          </div>
          <nav
            className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4"
            aria-label="Footer navigation"
          >
            <Link
              to="/privacy"
              className="font-semibold text-slate-600 hover:text-brand-700"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="font-semibold text-slate-600 hover:text-brand-700"
            >
              Terms
            </Link>
            <a
              href={`mailto:${appConfig.supportEmail}`}
              className="font-semibold text-slate-600 hover:text-brand-700"
            >
              Support
            </a>
            <Link
              to="/login"
              className="font-semibold text-slate-600 hover:text-brand-700"
            >
              Sign in
            </Link>
          </nav>
        </div>
        <p className="app-container mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} Skuggle. All rights reserved.
        </p>
      </footer>

      <Suspense fallback={<ModalSkeleton />}>
        {activeModal === "result_checker" && (
          <ResultCheckerModal
            isOpen
            onClose={handleCloseModal}
            student={modalData as { admissionNo?: string } | null}
          />
        )}
      </Suspense>
    </div>
  );
};
