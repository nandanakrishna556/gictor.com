import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** When true, render as plain markup (no Link). Use inside footers etc. */
  asStatic?: boolean;
  variant?: "dark" | "light";
}

export default function Logo({ className, asStatic, variant = "dark" }: LogoProps) {
  const wordmarkClass = variant === "light" ? "text-white" : "text-gray-950";
  const inner = (
    <span className={cn("inline-flex items-center gap-2 font-black tracking-tight", className)}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-[#ff8a4c] to-[#ff5a1f] text-white shadow-[0_4px_12px_-2px_rgba(255,90,31,0.5)]"
      >
        <span className="text-[15px] font-black leading-none">G</span>
      </span>
      <span className={cn("text-[19px] tracking-[-0.02em]", wordmarkClass)}>Gictor</span>
    </span>
  );

  if (asStatic) return inner;
  return <Link to="/" className="inline-flex items-center">{inner}</Link>;
}
