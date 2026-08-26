import { Building2, ShieldCheck, UserRound } from "lucide-react";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { SchoolRegistrationWizard } from "./SchoolRegistrationWizard";

export default function RegisterSchoolPage() {
  usePageTitle("Create your school account");

  return (
    <section className="app-container py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
        <aside className="rounded-[2rem] bg-[linear-gradient(145deg,#24114f,#5b36e8)] p-7 text-white lg:sticky lg:top-24 lg:h-fit lg:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-200">
            Guided registration
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.02]">
            Create your
            <br />
            school account.
          </h1>
          <p className="mt-5 text-sm leading-7 text-brand-100">
            Begin with school identity, branding and the first administrator.
            Academic configuration continues after secure sign-in.
          </p>
          <ul className="mt-8 grid gap-4 text-sm font-semibold text-brand-100">
            <li className="flex gap-3">
              <ShieldCheck className="size-5 shrink-0" />
              Tenant workspace prepared by the backend
            </li>
            <li className="flex gap-3">
              <UserRound className="size-5 shrink-0" />
              One accountable first administrator
            </li>
            <li className="flex gap-3">
              <Building2 className="size-5 shrink-0" />
              Guided implementation continues after registration
            </li>
          </ul>
        </aside>
        <div className="surface-card overflow-hidden">
          <SchoolRegistrationWizard />
        </div>
      </div>
    </section>
  );
}
