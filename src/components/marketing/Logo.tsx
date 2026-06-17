import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoIcon from "@/assets/gictor-icon.svg";

interface LogoProps {
  className?: string;
  /** When true, render as plain markup (no Link). Use inside footers etc. */
  asStatic?: boolean;
  /** "dark" = for light backgrounds (dark text). "light" = for dark backgrounds (light text). */
  variant?: "dark" | "light";
  /** Optional size override for the icon mark. */
  iconClassName?: string;
}

export default function Logo({ className, asStatic, variant = "dark", iconClassName }: LogoProps) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img
        src={logoIcon}
        alt=""
        aria-hidden="true"
        className={cn("h-8 w-8 shrink-0", iconClassName)}
      />
      <span
        className={cn(
          "font-display text-[22px] font-bold leading-none tracking-[-0.02em]",
          variant === "light" ? "text-white" : "text-gray-950"
        )}
      >
        Gictor
      </span>
    </span>
  );

  if (asStatic) return inner;
  return (
    <Link to="/" className="inline-flex items-center" aria-label="Gictor home">
      {inner}
    </Link>
  );
}
