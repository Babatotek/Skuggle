import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
} from "lucide-react";
import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { apiRequest, getApiError } from "@/shared/api/client";

interface RegistrationDraft {
  schoolName: string;
  schoolCode: string;
  schoolEmail: string;
  phone: string;
  address: string;
  schoolType: string;
  schoolLevel: string;
  primaryColor: string;
  adminName: string;
  adminEmail: string;
}

const emptyDraft: RegistrationDraft = {
  schoolName: "",
  schoolCode: "",
  schoolEmail: "",
  phone: "",
  address: "",
  schoolType: "",
  schoolLevel: "",
  primaryColor: "#5b36e8",
  adminName: "",
  adminEmail: "",
};

const isDraft = (value: unknown): value is RegistrationDraft => {
  if (typeof value !== "object" || value === null) return false;
  return [
    "schoolName",
    "schoolCode",
    "schoolEmail",
    "phone",
    "address",
    "schoolType",
    "schoolLevel",
    "primaryColor",
    "adminName",
    "adminEmail",
  ].every((key) => typeof (value as Record<string, unknown>)[key] === "string");
};

const readDraft = (): RegistrationDraft => {
  try {
    const raw = sessionStorage.getItem("skuggle:school-registration");
    if (!raw) return emptyDraft;
    const parsed: unknown = JSON.parse(raw);
    return isDraft(parsed) ? parsed : emptyDraft;
  } catch {
    return emptyDraft;
  }
};

const steps = ["School information", "Branding", "Administrator", "Review"];

export function SchoolRegistrationWizard({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<RegistrationDraft>(readDraft);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.setItem(
      "skuggle:school-registration",
      JSON.stringify(draft),
    );
  }, [draft]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent): void => {
      if (createdId || !Object.values(draft).some(Boolean)) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [createdId, draft]);
  useEffect(
    () => () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    },
    [logoUrl],
  );

  const update = (field: keyof RegistrationDraft, value: string): void =>
    setDraft((current) => ({ ...current, [field]: value }));
  const stepError = useMemo(() => {
    if (step === 0) {
      if (
        !draft.schoolName.trim() ||
        !draft.schoolCode.trim() ||
        !/^\S+@\S+\.\S+$/.test(draft.schoolEmail) ||
        !draft.phone.trim() ||
        !draft.address.trim() ||
        !draft.schoolType ||
        !draft.schoolLevel
      )
        return "Complete all required school fields with valid contact details.";
    }
    if (step === 2) {
      if (!draft.adminName.trim() || !/^\S+@\S+\.\S+$/.test(draft.adminEmail))
        return "Enter the administrator's name and a valid email address.";
      if (password.length < 10)
        return "Use a password with at least 10 characters.";
      if (password !== confirmPassword)
        return "The password confirmation does not match.";
    }
    return null;
  }, [confirmPassword, draft, password, step]);

  const next = (): void => {
    setError(null);
    if (stepError) {
      setError(stepError);
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  };

  const selectLogo = (file: File | undefined): void => {
    setError(null);
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/svg+xml"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Use a PNG, JPG or SVG logo no larger than 2 MB.");
      return;
    }
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    setLogo(file);
    setLogoUrl(URL.createObjectURL(file));
  };

  const submit = async (
    event: SyntheticEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const body = new FormData();
      (Object.keys(draft) as (keyof RegistrationDraft)[]).forEach((key) =>
        body.append(key, draft[key]),
      );
      body.append("password", password);
      body.append("password_confirmation", confirmPassword);
      if (logo) body.append("logo", logo);
      const response = await apiRequest<{ schoolId: string }>(
        "/schools/register",
        { method: "POST", body, timeoutMs: 30_000 },
      );
      setCreatedId(response.schoolId);
      sessionStorage.removeItem("skuggle:school-registration");
      setPassword("");
      setConfirmPassword("");
    } catch (caught: unknown) {
      const apiError = getApiError(caught);
      const detail = apiError.issues
        .map((issue) => issue.message)
        .filter(Boolean)
        .slice(0, 3)
        .join(" ");
      setError(detail || apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (createdId) {
    return (
      <div
        className={
          embedded
            ? "p-5 text-center sm:p-8"
            : "app-container flex min-h-[calc(100dvh-72px)] items-center justify-center py-12"
        }
      >
        <div className={embedded ? "" : "surface-card max-w-xl p-8 sm:p-12"}>
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Check className="size-7" />
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-tight text-brand-900 sm:text-3xl">
            School account created
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your school account was created successfully. Check your
            administrator email for a verification link, then sign in to
            continue guided setup.
          </p>
          <Link
            to="/login"
            className="tap-target mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-extrabold text-white"
          >
            Continue to sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {!embedded && (
        <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
          <h2 className="text-xl font-black text-brand-900">
            School registration
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Required fields are marked with an asterisk.
          </p>
        </div>
      )}
      <ol
        className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 px-3 py-4 sm:px-8"
        aria-label="Registration steps"
      >
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={`flex flex-col items-center gap-1 text-center text-[10px] font-bold sm:text-xs ${index <= step ? "text-brand-700" : "text-slate-400"}`}
          >
            <span
              className={`grid size-8 place-items-center rounded-full border ${index < step ? "border-brand-600 bg-brand-600 text-white" : index === step ? "border-brand-600 bg-white" : "border-slate-300 bg-white"}`}
            >
              {index < step ? <Check className="size-4" /> : index + 1}
            </span>
            <span className="hidden sm:block">{label}</span>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="p-5 sm:p-8"
        noValidate
      >
        {error && (
          <div
            className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            role="alert"
          >
            {error}
          </div>
        )}
        {step === 0 && (
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="sr-only">School information</legend>
            <TextField
              label="School name"
              value={draft.schoolName}
              onChange={(value) => update("schoolName", value)}
              required
              autoComplete="organization"
            />
            <TextField
              label="School code"
              value={draft.schoolCode}
              onChange={(value) => update("schoolCode", value.toUpperCase())}
              required
            />
            <TextField
              label="School email"
              value={draft.schoolEmail}
              onChange={(value) => update("schoolEmail", value)}
              type="email"
              required
              autoComplete="email"
            />
            <TextField
              label="Phone number"
              value={draft.phone}
              onChange={(value) => update("phone", value)}
              type="tel"
              required
              autoComplete="tel"
            />
            <div className="sm:col-span-2">
              <TextField
                label="Address"
                value={draft.address}
                onChange={(value) => update("address", value)}
                required
                autoComplete="street-address"
              />
            </div>
            <SelectField
              label="School type"
              value={draft.schoolType}
              onChange={(value) => update("schoolType", value)}
              options={["Day school", "Boarding school", "Day and boarding"]}
            />
            <SelectField
              label="School level"
              value={draft.schoolLevel}
              onChange={(value) => update("schoolLevel", value)}
              options={[
                "Nursery",
                "Primary",
                "Secondary",
                "Nursery, Primary and Secondary",
              ]}
            />
          </fieldset>
        )}
        {step === 1 && (
          <fieldset>
            <legend className="text-base font-extrabold text-slate-950">
              School branding
            </legend>
            <p className="mt-1 text-sm text-slate-600">
              Branding will be reviewed and applied to dashboards and supported
              school documents.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_auto]">
              <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-6 text-center hover:border-brand-400">
                <ImagePlus className="size-8 text-brand-600" />
                <span className="mt-3 text-sm font-bold text-brand-900">
                  Upload school logo
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  PNG, JPG or SVG · maximum 2 MB
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(event) => selectLogo(event.target.files?.[0])}
                  className="sr-only"
                />
              </label>
              <div className="grid min-h-48 min-w-48 place-items-center rounded-2xl border border-slate-200 bg-white p-4">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="School logo preview"
                    className="max-h-36 max-w-36 object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Logo preview</span>
                )}
              </div>
            </div>
            <label className="mt-5 block text-sm font-bold text-slate-800">
              Primary school colour
              <input
                type="color"
                value={draft.primaryColor}
                onChange={(event) =>
                  update("primaryColor", event.target.value)
                }
                className="ml-3 size-11 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 align-middle"
              />
            </label>
          </fieldset>
        )}
        {step === 2 && (
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="sr-only">Administrator account</legend>
            <TextField
              label="Administrator full name"
              value={draft.adminName}
              onChange={(value) => update("adminName", value)}
              required
              autoComplete="name"
            />
            <TextField
              label="Administrator email"
              value={draft.adminEmail}
              onChange={(value) => update("adminEmail", value)}
              type="email"
              required
              autoComplete="email"
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
            />
            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
              autoComplete="new-password"
            />
          </fieldset>
        )}
        {step === 3 && (
          <div>
            <h3 className="text-base font-extrabold text-slate-950">
              Review before creating the account
            </h3>
            <dl className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
              {(
                [
                  ["School", draft.schoolName],
                  ["Code", draft.schoolCode],
                  ["Contact", draft.schoolEmail],
                  ["Type", draft.schoolType],
                  ["Level", draft.schoolLevel],
                  ["Administrator", draft.adminName],
                  ["Administrator email", draft.adminEmail],
                ] satisfies [string, string][]
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">
                    {value.length > 0 ? value : "—"}
                  </dd>
                </div>
              ))}
            </dl>
            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 size-4 accent-brand-600"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="font-bold text-brand-700">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="font-bold text-brand-700">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>
        )}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => {
              setError(null);
              setStep((current) => Math.max(0, current - 1));
            }}
            className="tap-target inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="tap-target inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-extrabold text-white hover:bg-brand-700"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="tap-target inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Creating school…" : "Create school account"}{" "}
              {!submitting && <ArrowRight className="size-4" />}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

const TextField = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) => {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <label htmlFor={id} className="block text-sm font-bold text-slate-800">
      {label}
      {required && <span className="text-rose-600"> *</span>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-950 focus:border-brand-500 focus:bg-white"
      />
    </label>
  );
};

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) => (
  <label className="block text-sm font-bold text-slate-800">
    {label}
    <span className="text-rose-600"> *</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
      className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-950"
    >
      <option value="">Select {label.toLowerCase()}</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  </label>
);

const PasswordField = ({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete = "new-password",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) => (
  <label className="block text-sm font-bold text-slate-800">
    {label}
    <span className="text-rose-600"> *</span>
    <span className="relative mt-1.5 block">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        minLength={12}
        className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pr-12 text-sm font-normal text-slate-950"
      />
      <button
        type="button"
        onClick={onToggle}
        className="tap-target absolute right-0 top-0 grid place-items-center text-slate-500"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </span>
  </label>
);
