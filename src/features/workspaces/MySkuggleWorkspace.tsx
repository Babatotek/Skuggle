import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  LockKeyhole,
  Plus,
  School,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import type { UserRole } from "@/types";
import { PersonalPlanner } from "./PersonalPlanner";

export type ConnectedSchool = {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  roleLabel: string;
  current?: boolean;
};

interface MySkuggleWorkspaceProps {
  role: UserRole;
  userId: string;
  userName: string;
  activeTab: string;
  schoolCount: number;
  schools?: ConnectedSchool[];
  onSelectTab: (tab: string) => void;
  onOpenModal: (modal: string) => void;
  onSwitchWorkspace?: (tenantId: string) => void;
}

const roleContent = {
  teacher: {
    eyebrow: "Your portable teaching workspace",
    title: "Plan once. Teach with confidence anywhere.",
    description: "Keep lesson ideas, resources and professional goals private until you choose to share a copy with a school.",
    primary: "Create a lesson draft",
    primaryAction: "ai_lesson_builder",
    focus: ["Prepare next lesson", "Organise question bank", "Update teaching portfolio"],
  },
  parent: {
    eyebrow: "Your family learning companion",
    title: "Make learning at home feel manageable.",
    description: "Coordinate study routines, goals and helpful explanations without exposing unrelated family information to a school.",
    primary: "Plan family study time",
    primaryAction: "personal_planner",
    focus: ["Review this week's homework", "Set a learning goal", "Ask for a simple explanation"],
  },
  student: {
    eyebrow: "Your private learning space",
    title: "Know what to learn next.",
    description: "Build a learning history that stays with you. Notes and independent practice remain private unless you submit them.",
    primary: "Start a learning session",
    primaryAction: "personal_planner",
    focus: ["Continue revision plan", "Practise a difficult topic", "Add a project to portfolio"],
  },
} as const;

export function MySkuggleWorkspace({
  role,
  userId,
  userName,
  activeTab,
  schoolCount,
  schools = [],
  onSelectTab,
  onOpenModal,
  onSwitchWorkspace,
}: MySkuggleWorkspaceProps) {
  const content = roleContent[role as keyof typeof roleContent] ?? roleContent.student;
  const firstName = userName.trim().split(/\s+/)[0] || "there";

  if (activeTab !== "home") {
    const labels: Record<string, { title: string; copy: string; icon: typeof Target }> = {
      planner: { title: "Personal planner", copy: "Private plans and reminders stay with your account across schools.", icon: CalendarDays },
      resources: { title: "Personal resources", copy: "Build a reusable private library. Sharing will always create a separate school-owned copy.", icon: BookOpen },
      goals: { title: "Goals and progress", copy: "Track personal growth without presenting it as an official school record.", icon: Target },
      portfolio: { title: "Portable portfolio", copy: "Keep eligible projects, certificates and achievements when you change schools.", icon: BriefcaseBusiness },
      schools: { title: "Connected schools", copy: "Invitations and authorised memberships appear here. A typed school name can never grant access.", icon: School },
    };
    const section = labels[activeTab] ?? labels.planner;
    const Icon = section.icon;
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="personal-section-title">
        <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700"><Icon className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600">My Skuggle · Private</p>
              <h1 id="personal-section-title" className="mt-2 text-2xl font-black text-slate-950">{section.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{section.copy}</p>
            </div>
          </div>
          {activeTab === "planner" ? (
            <PersonalPlanner userId={userId} role={role} />
          ) : activeTab === "schools" ? (
            <div className="mt-8 space-y-3">
              {schools.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <Building2 className="mx-auto h-7 w-7 text-slate-400" />
                  <h2 className="mt-3 font-bold text-slate-900">No school workspaces yet</h2>
                  <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
                    Accept an authorised invitation to add a school workspace. Your personal records stay private.
                  </p>
                </div>
              ) : (
                schools.map((school) => (
                  <div
                    key={school.tenantId}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">
                        {school.tenantName} · {school.roleLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {school.tenantCode} · Official school records stay in this workspace
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(school.current)}
                      onClick={() => onSwitchWorkspace?.(school.tenantId)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:cursor-default disabled:bg-slate-300"
                    >
                      {school.current ? "Current workspace" : "Switch to school"}
                      {!school.current ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>
                  </div>
                ))
              )}
              <button type="button" onClick={() => onSelectTab("home")} className="mt-2 text-sm font-bold text-indigo-700">
                Back to My Skuggle
              </button>
            </div>
          ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Sparkles className="mx-auto h-7 w-7 text-indigo-500" />
            <h2 className="mt-3 font-bold text-slate-900">Your space is ready to grow</h2>
            <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">The workspace boundary is active. Personal records for this section will be added through dedicated user-owned APIs in the next capability release.</p>
            <button type="button" onClick={() => onSelectTab("home")} className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Back to My Skuggle</button>
          </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-labelledby="my-skuggle-title">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-650 to-violet-700 p-6 text-white shadow-xl shadow-indigo-200/60 sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[1.45fr_0.8fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
              <UserRound className="h-3.5 w-3.5" /> My Skuggle · Personal workspace
            </div>
            <p className="mt-6 text-sm font-bold text-indigo-100">Hello, {firstName}. {content.eyebrow}</p>
            <h1 id="my-skuggle-title" className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">{content.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">{content.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => content.primaryAction === "ai_lesson_builder" ? onOpenModal(content.primaryAction) : onSelectTab("planner")} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-indigo-700 shadow-sm">
                <Plus className="h-4 w-4" /> {content.primary}
              </button>
              <button type="button" onClick={() => onSelectTab("resources")} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white">
                Open my resources <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-slate-950/20 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-extrabold"><LockKeyhole className="h-4 w-4" /> Private by default</div>
            <p className="mt-2 text-xs leading-5 text-indigo-100">Nothing here enters a school workspace automatically. You will always preview and confirm anything you choose to submit or copy.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Continue where you stopped</p><h2 className="mt-1 text-xl font-black text-slate-950">Your next useful actions</h2></div>
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {content.focus.map((item, index) => (
              <button key={item} type="button" onClick={() => onSelectTab(index === 0 ? "planner" : index === 1 ? "resources" : "portfolio")} className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50">
                <span className="text-xs font-black text-indigo-600">0{index + 1}</span><p className="mt-3 text-sm font-bold text-slate-900">{item}</p><ArrowRight className="mt-4 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><School className="h-5 w-5" /></div><div><p className="text-sm font-black text-slate-900">School connections</p><p className="text-xs text-slate-500">{schoolCount} authorised {schoolCount === 1 ? "workspace" : "workspaces"}</p></div></div>
          <p className="mt-4 text-sm leading-6 text-slate-600">School records stay governed by each institution. Switch only when you need official classes, attendance, results or communication.</p>
          <button type="button" onClick={() => onSelectTab("schools")} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-indigo-700">Manage connections <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: role === "parent" ? HeartHandshake : GraduationCap, title: "Personal continuity", copy: "Your eligible work stays with you when a school membership ends." },
          { icon: LockKeyhole, title: "Clear ownership", copy: "Personal drafts and official school records are never presented as the same thing." },
          { icon: Sparkles, title: "Helpful, human-controlled AI", copy: "Use assistance for ideas and explanations while keeping professional and learning judgement." },
        ].map(({ icon: Icon, title, copy }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-indigo-600" /><h2 className="mt-3 text-sm font-black text-slate-900">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p></article>
        ))}
      </div>
    </section>
  );
}
