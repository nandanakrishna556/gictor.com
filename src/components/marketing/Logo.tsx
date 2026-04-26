import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoDark from "@/assets/gictor-logo-dark.svg";
import logoLight from "@/assets/gictor-logo-light.svg";

interface LogoProps {
  className?: string;
  /** When true, render as plain markup (no Link). Use inside footers etc. */
  asStatic?: boolean;
  /** "dark" = dark wordmark for light backgrounds. "light" = light wordmark for dark backgrounds. */
  variant?: "dark" | "light";
}

export default function Logo({ className, asStatic, variant = "dark" }: LogoProps) {
  const src = variant === "light" ? logoLight : logoDark;
  const img = (
    <img
      src={src}
      alt="Gictor"
      className={cn("h-8 w-auto select-none", className)}
      draggable={false}
    />
  );

  if (asStatic) return img;
  return (
    <Link to="/" className="inline-flex items-center" aria-label="Gictor home">
      {img}
    </Link>
  );
}
