import { ArrowRight, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  onboardingService,
  type OnboardingSnapshot,
} from "@/shared/api/onboarding";

interface SetupProgressBannerProps {
  /** Optional secondary CTA, e.g. jump to Results after setup is mostly done */
  onNavigateTab?: (tab: string) => void;
}

export function SetupProgressBanner({
  onNavigateTab,
}: SetupProgressBannerProps) {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await onboardingService.getProgress();
        if (!cancelled) setSnapshot(data);
      } catch {
        if (!cancelled) setSnapshot(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !snapshot?.requiresSetup) {
    return null;
  }

  const incomplete = snapshot.steps.filter(
    (step) => step.status !== "complete",
  ).length;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Rocket className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            Continue setup — {snapshot.progress}% complete
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {incomplete} step{incomplete === 1 ? "" : "s"} remaining before your
            school is ready to launch.
          </p>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, snapshot.progress))}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:shrink-0">
        {onNavigateTab && snapshot.progress >= 50 && (
          <button
            type="button"
            onClick={() => onNavigateTab("results")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Results workflow
          </button>
        )}
        <button
          type="button"
          onClick={() => void navigate("/app/setup")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700"
        >
          Continue setup
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
