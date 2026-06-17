import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X, Check, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import { SERVICES } from "./data";
import { cn } from "@/lib/utils";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  const handleAnchor = (e: React.MouseEvent, id: string) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/80 backdrop-blur-xl border-b border-gray-100" : "bg-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between md:h-[72px]">
        <Logo />

        {/* Center nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          <Link
            to="/#how-it-works"
            onClick={(e) => handleAnchor(e, "how-it-works")}
            className="rounded-full px-4 py-2 font-medium text-gray-600 transition hover:text-gray-950 text-base bg-gray-100/0"
          >
            How it works
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-4 py-2 font-medium text-gray-600 transition hover:text-gray-950 text-base bg-gray-100/0"
            >
              Services
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", servicesOpen && "rotate-180")} />
            </button>

            {servicesOpen && (
              <div className="absolute left-1/2 top-full -translate-x-1/2 pt-3">
                <div className="relative w-[680px] overflow-hidden rounded-[28px] border border-gray-100 bg-white p-4 shadow-2xl">
                  {/* blobs */}
                  <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-blue-100/40 blur-[80px]" />
                  <div className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-indigo-300/25 blur-[80px]" />

                  <div className="relative grid gap-4" style={{ gridTemplateColumns: "1fr 240px" }}>
                    {/* Services list */}
                    <div>
                      <div className="mb-3 flex items-center gap-2 px-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                          ✨ Done-for-you
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          <span className="relative inline-flex h-1.5 w-1.5">
                            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                          Taking clients
                        </span>
                      </div>

                      <ul className="space-y-1">
                        {SERVICES.map((s) => (
                          <li key={s.href}>
                            <Link
                              to={s.href}
                              className="group flex items-start gap-3 rounded-2xl p-2.5 transition hover:bg-gray-50"
                            >
                              <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl", s.bg)}>
                                {s.emoji}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-950">{s.label}</span>
                                  <span className="rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                    {s.tag}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[12.5px] leading-snug text-gray-500">{s.description}</p>
                              </div>
                              <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-950" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* DIY card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-5 text-white">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />
                      <div className="relative">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-300">DIY</div>
                        <h4 className="mt-1 text-[17px] font-bold leading-tight">Want to do it yourself?</h4>
                        <p className="mt-2 text-[12px] leading-relaxed text-gray-300">
                          Spin up your own AI studio in under 60 seconds. Plans from $29/mo.
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {["No long-term contract", "Credits never expire", "Cancel anytime"].map((b) => (
                            <li key={b} className="flex items-center gap-1.5 text-[11.5px] text-gray-300">
                              <Check className="h-3 w-3 text-blue-400" /> {b}
                            </li>
                          ))}
                        </ul>
                        <Link
                          to="/signup"
                          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12.5px] font-semibold text-gray-950 transition hover:bg-gray-100"
                        >
                          Get started <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/#pricing"
            onClick={(e) => handleAnchor(e, "pricing")}
            className="rounded-full px-4 py-2 font-medium text-gray-600 transition hover:text-gray-950 text-base bg-gray-100/0"
          >
            Pricing
          </Link>
          <Link
            to="/#faq"
            onClick={(e) => handleAnchor(e, "faq")}
            className="rounded-full px-4 py-2 font-medium text-gray-600 transition hover:text-gray-950 text-base bg-gray-100/0"
          >
            FAQ
          </Link>
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 font-medium text-gray-600 transition hover:text-gray-950 text-base"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-4 py-2 font-semibold text-white transition hover:bg-gray-800 text-base"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full p-2 text-gray-700 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur-xl md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            <Link to="/#how-it-works" onClick={(e) => handleAnchor(e, "how-it-works")} className="rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">How it works</Link>
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Services</div>
            {SERVICES.map((s) => (
              <Link key={s.href} to={s.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <span className={cn("grid h-9 w-9 place-items-center rounded-lg text-lg", s.bg)}>{s.emoji}</span>
                <span className="font-medium">{s.label}</span>
              </Link>
            ))}
            <Link to="/#pricing" onClick={(e) => handleAnchor(e, "pricing")} className="rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Pricing</Link>
            <Link to="/#faq" onClick={(e) => handleAnchor(e, "faq")} className="rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">FAQ</Link>
            <div className="mt-2 flex gap-2 border-t border-gray-100 pt-3">
              <Link to="/login" className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700">Log in</Link>
              <Link to="/signup" className="flex-1 rounded-full bg-gray-950 px-4 py-2 text-center text-sm font-semibold text-white">Get started</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
