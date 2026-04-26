import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/gictor-logo-light.svg";
import logoDark from "@/assets/gictor-logo-dark.svg";

interface LogoProps {
  className?: string;
  /** When true, render as plain markup (no Link). Use inside footers etc. */
  asStatic?: boolean;
  /** "dark" = dark wordmark for light backgrounds, "light" = light wordmark for dark backgrounds */
  variant?: "dark" | "light";
}

export default function Logo({ className, asStatic, variant = "dark" }: LogoProps) {
  // variant "light" = light wordmark used on dark backgrounds (gictor-logo-dark.svg has light text)
  // variant "dark"  = dark wordmark used on light backgrounds (gictor-logo-light.svg has dark text)
  const src = variant === "light" ? logoDark : logoLight;
  const inner = (
    <img
      src={src}
      alt="Gictor"
      className={cn("h-8 w-auto select-none", className)}
      draggable={false}
    />
  );

  if (asStatic) return inner;
  return (
    <Link to="/" className="inline-flex items-center" aria-label="Gictor home">
      {inner}
    </Link>
  );
}
