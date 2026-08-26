import { Link } from "react-router-dom";

export const BrandLogo = ({ compact = false }: { compact?: boolean }) => (
  <Link
    to="/"
    className="inline-flex min-h-11 shrink-0 items-center rounded-xl"
    aria-label="Skuggle home"
  >
    <img
      src="/skuggle-logo.png"
      alt="Skuggle"
      width="512"
      height="160"
      className={
        compact
          ? "h-8 w-auto object-contain object-left"
          : "h-9 w-auto object-contain object-left sm:h-10"
      }
    />
  </Link>
);
