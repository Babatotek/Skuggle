import { Link } from "react-router-dom";
import { ResultCheckerForm } from "@/features/results/ResultCheckerForm";
import { BrandLogo } from "@/shared/ui/BrandLogo";

export default function ResultCheckerPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex justify-center">
          <BrandLogo />
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
          Check your result
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your admission number, academic session, term and the PIN
          provided by your school to verify a published result.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
        <ResultCheckerForm />
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Need help?{" "}
        <Link to="/login" className="font-semibold text-indigo-600">
          Sign in to your school portal
        </Link>
      </p>
    </div>
  );
}
