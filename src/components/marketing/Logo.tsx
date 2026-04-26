import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoDark from "@/assets/gictor-logo-dark.svg";
import logoLight from "@/assets/gictor-logo-light.svg";

interface LogoProps {
  className?: string;
  /** When true, render as plain markup (no Link). Use inside footers etc. */
  asStatic?: boolean;
  /** "dark" = for light backgrounds (dark text). "light" = for dark backgrounds (light text). */
  variant?: "dark" | "light";
}

export default function Logo({ className, asStatic, variant = "dark" }: LogoProps) {
  const src = variant === "light" ? logoDark : logoLight;
  const inner = (
    <img
      src={src}
      alt="Gictor"
      className={cn("h-8 w-auto", className)}
    />
  );

  if (asStatic) return inner;
  return (
    <Link to="/" className="inline-flex items-center">
      {inner}
    </Link>
  );
}
