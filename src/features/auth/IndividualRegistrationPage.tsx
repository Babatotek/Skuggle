import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type SyntheticEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SchoolRegistrationWizard } from "@/features/public/SchoolRegistrationWizard";
import { authService } from "@/features/auth/authService";
import { apiRequest, getApiError } from "@/shared/api/client";
import { usePageTitle } from "@/shared/hooks/usePageTitle";
import { appConfig } from "@/app/config";

type RegistrationType = "student" | "parent" | "teacher" | "school";

const parseRegistrationType = (value: string | null): RegistrationType => {
  if (value === "parent") return "parent";
  if (value === "teacher") return "teacher";
  if (value === "school") return "school";
  return "student";
};

const accountOptions = [
  { value: "student" as const, label: "Student" },
  { value: "parent" as const, label: "Parent / Guardian" },
  { value: "teacher" as const, label: "Teacher" },
  { value: "school" as const, label: "School" },
];

const ageFromBirthDate = (birthDate: string): number | null => {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  )
    age -= 1;
  return age;
};

export default function IndividualRegistrationPage() {
  usePageTitle("Create your free account");
  const [searchParams] = useSearchParams();
  const [type, setType] = useState<RegistrationType>(
    parseRegistrationType(searchParams.get("type")),
  );
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    className: "",
    schoolInvitationCode: searchParams.get("invite") ?? "",
    guardianName: "",
    guardianEmail: "",
  });
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    requiresVerification: boolean;
  } | null>(null);
  const age = useMemo(() => ageFromBirthDate(form.birthDate), [form.birthDate]);
  const requiresGuardian = type === "student" && age !== null && age < 18;

  const update = (field: keyof typeof form, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !/^\S+@\S+\.\S+$/.test(form.email)
    ) {
      setError("Enter your name and a valid email address.");
      return;
    }
    if (type === "student" && age === null) {
      setError("Enter the student's date of birth.");
      return;
    }
    if (age !== null && (age < 5 || age > 100)) {
      setError("Review the date of birth before continuing.");
      return;
    }
    if (password.length < 12 || password !== confirmation) {
      setError(
        "Use a password of at least 12 characters and confirm it correctly.",
      );
      return;
    }
    if (
      requiresGuardian &&
      (!form.guardianName.trim() ||
        !/^\S+@\S+\.\S+$/.test(form.guardianEmail) ||
        !guardianConsent)
    ) {
      setError(
        "A parent or guardian must provide valid details and consent for this student account.",
      );
      return;
    }
    if (!accepted) {
      setError("Accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiRequest<{
        accountId: string;
        requiresVerification: boolean;
      }>("/individuals/register", {
        method: "POST",
        body: {
          accountType: type,
          ...form,
          password,
          passwordConfirmation: confirmation,
          guardianConsent: requiresGuardian ? guardianConsent : undefined,
        },
      });
      setCreated({ requiresVerification: response.requiresVerification });
      setPassword("");
      setConfirmation("");
    } catch (caught: unknown) {
      setError(getApiError(caught).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <section className="app-container flex min-h-[calc(100dvh-96px)] items-center justify-center py-12">
        <div className="surface-card max-w-xl p-8 text-center sm:p-12">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
          <h1 className="mt-5 text-3xl font-black text-brand-900">
            Your Skuggle account is ready
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {created.requiresVerification
              ? "Check your email to verify the account, then sign in to start learning."
              : "Sign in to start exploring Smart Library and save your progress."}
          </p>
          <Link
            to="/login"
            className="tap-target mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white"
          >
            Continue to sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="app-container py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[.68fr_1.32fr]">
        <aside className="rounded-[2rem] bg-[linear-gradient(145deg,#24114f,#5b36e8)] p-7 text-white lg:sticky lg:top-28 lg:h-fit lg:p-9">
          {type === "school" ? (
            <>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-200">
                Guided registration
              </p>
              <h1 className="mt-4 font-display text-5xl leading-[1.02]">
                Create your school account.
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
                  <UsersRound className="size-5 shrink-0" />
                  One accountable first administrator
                </li>
                <li className="flex gap-3">
                  <Building2 className="size-5 shrink-0" />
                  Guided implementation continues after registration
                </li>
              </ul>
            </>
          ) : (
            <>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-200">
                Smart Library Free
              </p>
              <h1 className="mt-4 font-display text-5xl leading-[1.02]">
                Learn with Skuggle.
              </h1>
              <p className="mt-5 text-sm leading-7 text-brand-100">
                Create an individual account now. Connecting a school is optional
                and can happen later without creating a duplicate learner.
              </p>
              <ul className="mt-8 grid gap-4 text-sm font-semibold text-brand-100">
                <li className="flex gap-3">
                  <GraduationCap className="size-5 shrink-0" /> Curriculum-aligned
                  resources and practice
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="size-5 shrink-0" /> Age-aware privacy and
                  guardian consent
                </li>
                <li className="flex gap-3">
                  <UsersRound className="size-5 shrink-0" /> Parent and student
                  experiences
                </li>
              </ul>
              <Link
                to="/library"
                className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-white hover:underline"
              >
                Preview Smart Library <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </aside>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
            <h2 className="text-xl font-black text-brand-900">
              {type === "school"
                ? "School registration"
                : "Create your free account"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {type === "school"
                ? "Required fields are marked with an asterisk."
                : "Choose who will use this account."}
            </p>
            <div
              className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
              role="group"
              aria-label="Account type"
            >
              {accountOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setType(value);
                    setError(null);
                  }}
                  aria-pressed={type === value}
                  className={`tap-target rounded-xl border px-4 py-3 text-sm font-extrabold ${type === value ? "border-brand-500 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-600 hover:border-brand-200"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {type === "school" ? (
            <SchoolRegistrationWizard embedded />
          ) : (
          <form
            onSubmit={(event) => {
              void submit(event);
            }}
            className="space-y-5 p-5 sm:p-8"
            noValidate
          >
            {error && (
              <div
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="First name"
                value={form.firstName}
                onChange={(value) => update("firstName", value)}
                autoComplete="given-name"
              />
              <Field
                label="Last name"
                value={form.lastName}
                onChange={(value) => update("lastName", value)}
                autoComplete="family-name"
              />
            </div>
            <Field
              label="Email address"
              value={form.email}
              onChange={(value) => update("email", value)}
              type="email"
              autoComplete="email"
            />
            {type === "student" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Date of birth"
                  value={form.birthDate}
                  onChange={(value) => update("birthDate", value)}
                  type="date"
                  autoComplete="bday"
                />
                <Field
                  label="Current class (optional)"
                  value={form.className}
                  onChange={(value) => update("className", value)}
                  placeholder="e.g. JSS 2"
                />
              </div>
            )}
            <Field
              label="School invitation code (optional)"
              value={form.schoolInvitationCode}
              onChange={(value) => update("schoolInvitationCode", value)}
              placeholder="You can connect a school later"
            />

            {requiresGuardian && (
              <fieldset className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <legend className="px-1 text-sm font-extrabold text-amber-900">
                  Parent or guardian consent
                </legend>
                <p className="mb-4 text-xs leading-5 text-amber-800">
                  This student is under 18. A parent or guardian must provide
                  their details and approve the account.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Guardian name"
                    value={form.guardianName}
                    onChange={(value) => update("guardianName", value)}
                    autoComplete="name"
                  />
                  <Field
                    label="Guardian email"
                    value={form.guardianEmail}
                    onChange={(value) => update("guardianEmail", value)}
                    type="email"
                    autoComplete="email"
                  />
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-amber-900">
                  <input
                    type="checkbox"
                    checked={guardianConsent}
                    onChange={(event) =>
                      setGuardianConsent(event.target.checked)
                    }
                    className="mt-1 size-4 accent-brand-600"
                  />
                  I am the parent or legal guardian and consent to this student
                  account being created.
                </label>
              </fieldset>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-sm font-bold text-slate-800">
                  Password
                </span>
                <span className="relative block">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-12 text-sm focus:border-brand-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="tap-target absolute right-0 top-0 grid place-items-center text-slate-500"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </span>
                <span className="mt-1 block text-[11px] text-slate-500">
                  At least 12 characters.
                </span>
              </label>
              <Field
                label="Confirm password"
                value={confirmation}
                onChange={setConfirmation}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-600">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 size-4 accent-brand-600"
              />
              <span>
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="font-bold text-brand-700 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-bold text-brand-700 hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {appConfig.enableGoogleOAuth && type !== "school" && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    void (async () => {
                      try {
                        setSubmitting(true);
                        const result = await authService.googleRedirectUrl({
                          intent: "signup",
                          accountType:
                            type === "parent" || type === "teacher" || type === "student"
                              ? type
                              : "student",
                          returnTo: "/app",
                        });
                        window.location.assign(result.url);
                      } catch (caught) {
                        setError(getApiError(caught).message);
                        setSubmitting(false);
                      }
                    })();
                  }}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
                >
                  Continue with Google
                </button>
                <div className="mb-4 flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" /> or email{" "}
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating account…" : "Create free account"}
              {!submitting && <ArrowRight className="size-4" />}
            </button>
            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-extrabold text-brand-700 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
          )}
        </div>
      </div>
    </section>
  );
}

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) => (
  <label>
    <span className="mb-1.5 block text-sm font-bold text-slate-800">
      {label}
    </span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm focus:border-brand-500 focus:bg-white"
    />
  </label>
);
