import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  Play,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { appConfig } from "@/app/config";
import { usePageTitle } from "@/shared/hooks/usePageTitle";

const heroImage = "/skuggle-hero.png";

const features = [
  {
    title: "Student records",
    description:
      "One reliable student history across classes, sessions, guardians and school workflows.",
    icon: UsersRound,
    tone: "bg-brand-50 text-brand-700",
  },
  {
    title: "Teaching & attendance",
    description:
      "Help teachers reach today's classes, attendance and lesson work quickly—even on smaller screens.",
    icon: BookOpenCheck,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Assessment intelligence",
    description:
      "Connect scores, approvals, report cards and performance signals without losing human review.",
    icon: Sparkles,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Parent connection",
    description:
      "Give each guardian a simple, secure view of all authorised children in one account.",
    icon: ShieldCheck,
    tone: "bg-coral-100 text-coral-500",
  },
];

const heroHighlights = [
  {
    icon: UsersRound,
    title: "Student Management",
    note: "Everything in one place",
  },
  {
    icon: BookOpenCheck,
    title: "Smart Learning",
    note: "Tools that help students thrive",
  },
  {
    icon: ShieldCheck,
    title: "Parent Connection",
    note: "Keep families in the loop",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    note: "Make confident decisions",
  },
];

export default function LandingPage() {
  usePageTitle("Run your school smarter");

  return (
    <>
      <section
        id="home"
        className="scroll-mt-28 overflow-hidden border-b border-cream-200 bg-[radial-gradient(circle_at_76%_18%,rgba(217,205,255,.62),transparent_24%),linear-gradient(145deg,#fffdf9_0%,#fff9ef_55%,#f8f5ff_100%)]"
      >
        <div className="app-container pb-10 pt-4 sm:pt-6 lg:pb-14">
          <div className="grid items-center gap-12 lg:min-h-[calc(100vh-12rem)] lg:grid-cols-[1.02fr_.98fr] lg:gap-6">
            <div className="relative z-10 max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-xs font-extrabold text-brand-700 shadow-sm">
                <Sparkles className="size-4" aria-hidden="true" />
                Smart School Management, Simplified
              </p>
              <h1 className="mt-6 text-[clamp(3.2rem,7vw,6.7rem)] font-black leading-[0.94] tracking-[-0.065em] text-brand-900">
                Smart work now,
                <br />
                <span className="font-display font-normal italic text-brand-600">
                  Global relevance tomorrow
                </span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Every student deserves to be seen, supported, and understood.
                Skuggle helps schools track progress, identify challenges early, and improve learning outcomes
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/join"
                  className="tap-target inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-brand-200 transition hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  Start learning free
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <a
                  href={`mailto:${appConfig.supportEmail}?subject=Skuggle%20demo%20request`}
                  className="tap-target inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-6 py-3 text-sm font-extrabold text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  <Play className="size-4 fill-current" aria-hidden="true" />
                  Book a demo
                </a>
              </div>
              <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> No setup
                  fee
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Guided
                  onboarding
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Mobile
                  ready
                </span>
              </p>
            </div>

            <div className="relative mx-auto flex min-h-[430px] w-full max-w-[680px] items-center justify-center sm:min-h-[520px] lg:min-h-full">
              <div
                className="absolute left-[12%] top-[14%] size-[72%] rounded-full bg-brand-200/45 blur-3xl"
                aria-hidden="true"
              />
              <img
                src={heroImage}
                alt="Skuggle, a friendly AI school assistant robot waving and holding a book"
                width="1024"
                height="1024"
                fetchPriority="high"
                className="relative z-10 w-full max-w-[640px] object-contain drop-shadow-[0_28px_32px_rgba(71,38,150,.14)]"
              />
            </div>
          </div>

          <div className="relative z-20 mt-12 grid gap-3 rounded-3xl border border-brand-100 bg-white/90 p-3 shadow-[0_18px_55px_rgba(36,17,79,.08)] backdrop-blur md:grid-cols-2 xl:grid-cols-4">
            {heroHighlights.map(({ icon: Icon, title, note }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-2xl p-3 sm:p-4"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-brand-900">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="library" className="scroll-mt-28 border-b border-brand-100 bg-white py-16 sm:py-20">
        <div className="app-container grid overflow-hidden rounded-[2rem] border border-brand-100 bg-[linear-gradient(135deg,#f5f2ff,#fffdf9)] shadow-card lg:grid-cols-[.85fr_1.15fr]">
          <div className="bg-brand-900 p-7 text-white sm:p-10">
            <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
              <BookOpen className="size-6" aria-hidden="true" />
            </div>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-brand-300">
              Skuggle Smart Library
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">
              Learn anything in your curriculum.
            </h2>
            <p className="mt-4 text-sm leading-7 text-brand-100">
              Find books, lessons and study resources, then ask Skuggle to
              explain what you do not understand.
            </p>
          </div>
          <form action="/library" method="get" className="p-7 sm:p-10">
            <div className="grid gap-4 sm:grid-cols-3">
              <label>
                <span className="mb-1.5 block text-xs font-extrabold text-slate-700">
                  Class
                </span>
                <input
                  name="class"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-500"
                  placeholder="e.g. JSS 2"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-extrabold text-slate-700">
                  Subject
                </span>
                <input
                  name="subject"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-500"
                  placeholder="e.g. Mathematics"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-extrabold text-slate-700">
                  Topic
                </span>
                <input
                  name="topic"
                  className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-brand-500"
                  placeholder="e.g. Fractions"
                />
              </label>
            </div>
            <button
              type="submit"
              className="tap-target mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-extrabold text-white hover:bg-brand-700 sm:w-auto"
            >
              Explore Free Library <ArrowRight className="size-4" />
            </button>
            <p className="mt-5 text-xs font-bold text-slate-500">
              AI explanations · Practice · Study help
            </p>
          </form>
        </div>
      </section>

      <section id="features" className="scroll-mt-28 bg-white py-20">
        <div className="app-container">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600">
            One connected school
          </p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <h2 className="max-w-2xl text-4xl font-black tracking-[-0.04em] text-brand-900 sm:text-5xl">
              Everything essential.
              <br />
              <span className="font-display font-normal italic text-brand-600">
                Without the complexity.
              </span>
            </h2>
            <p className="max-w-lg text-sm leading-7 text-slate-600">
              Reliable records first. Then the intelligence to understand
              performance, support teachers and keep families informed.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map(({ title, description, icon: Icon, tone }) => (
              <article key={title} className="surface-card p-6">
                <div
                  className={`grid size-12 place-items-center rounded-2xl ${tone}`}
                >
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-slate-950">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="solutions"
        className="scroll-mt-28 border-y border-brand-100 bg-brand-50/60 py-20"
      >
        <div className="app-container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600">
              Right-sized solutions
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-brand-900">
              One platform.
              <br />
              Six clear experiences.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              A teacher starts with today's work. A parent starts with their
              children. Leadership starts with school health. Everyone gets an
              experience shaped around their responsibilities.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Platform owner",
              "School leadership",
              "School operations",
              "Teacher",
              "Parent / guardian",
              "Student",
            ].map((role, index) => (
              <article
                key={role}
                className="rounded-2xl border border-brand-100 bg-white p-5"
              >
                <span className="text-xs font-black text-brand-500">
                  0{index + 1}
                </span>
                <h3 className="mt-6 text-base font-extrabold text-brand-900">
                  {role}
                </h3>
              </article>
            ))}
          </div>
        </div>

        <div className="app-container mt-16 overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-12 text-white shadow-2xl sm:px-12 lg:grid lg:grid-cols-[1fr_.8fr] lg:items-center lg:gap-14">
          <div>
            <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
              <ScanLine className="size-6" aria-hidden="true" />
            </div>
            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-300">
              Skuggle SmartMark
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Print. Scan. Mark. Done.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-100">
              Prepare assessments digitally, conduct them on paper, scan answer
              sheets with ordinary devices, review uncertain responses and
              approve scores into each student's academic record.
            </p>
          </div>
          <ol
            className="mt-8 grid gap-3 lg:mt-0"
            aria-label="SmartMark workflow"
          >
            {[
              "Create assessment",
              "Print examination and answer sheet",
              "Scan or upload a class batch",
              "Review exceptions",
              "Approve scores",
            ].map((step, index) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-bold"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-500 text-xs">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-28 bg-white py-20">
        <div className="app-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600">
              Flexible pricing
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-brand-900 sm:text-5xl">
              Start free. Grow when you need more.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Families can start directly with Smart Library Free. Learn+ and
              school plans add deeper learning support when they are needed.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <article className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-7">
              <BookOpen className="size-7 text-emerald-700" />
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">
                For students & parents
              </p>
              <h3 className="mt-2 text-2xl font-black text-brand-900">
                Smart Library Free
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Curriculum discovery, selected open resources, basic reading,
                explanations and practice.
              </p>
              <Link
                to="/join"
                className="tap-target mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-extrabold text-white"
              >
                Start free <ArrowRight className="size-4" />
              </Link>
            </article>
            <article className="rounded-3xl border border-brand-200 bg-brand-50 p-7 shadow-card">
              <Sparkles className="size-7 text-brand-600" />
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[.14em] text-brand-600">
                For individuals & families
              </p>
              <h3 className="mt-2 text-2xl font-black text-brand-900">
                Skuggle Learn+
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Extended AI help, personalised practice, study plans, revision
                tools and advanced progress.
              </p>
              <a
                href={`mailto:${appConfig.supportEmail}?subject=Skuggle%20Learn%2B%20interest`}
                className="tap-target mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-extrabold text-white"
              >
                Ask about Learn+ <ArrowRight className="size-4" />
              </a>
            </article>
            <article className="rounded-3xl border border-amber-100 bg-amber-50/60 p-7">
              <UsersRound className="size-7 text-amber-700" />
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[.14em] text-amber-700">
                For schools
              </p>
              <h3 className="mt-2 text-2xl font-black text-brand-900">
                School Plans
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                School-approved resources, assignments, learning analytics,
                SmartMark and family access.
              </p>
              <Link
                to="/register-school"
                className="tap-target mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 text-sm font-extrabold text-white"
              >
                Register a school <ArrowRight className="size-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="scroll-mt-28 bg-cream-100 py-20 text-center"
      >
        <div className="app-container">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600">
            About Skuggle
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] text-brand-900 sm:text-5xl">
            Built to make every school day simpler and more connected.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Skuggle gives school communities one secure place to organise work,
            understand progress and support every learner.
          </p>
          <Link
            to="/join"
            className="tap-target mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-brand-700"
          >
            Join Skuggle free <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
