import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ScanFace, Star } from "lucide-react";
import LandingNav from "@/components/marketing/LandingNav";
import LandingFooter from "@/components/marketing/LandingFooter";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export type Deliverable = {
  emoji: string;
  title: string;
  description: string;
  accent: string; // tailwind gradient classes "from-x to-y"
  bg: string;     // tailwind bg utility for blob/tile
};

export type ProcessStep = {
  emoji: string;
  title: string;
  description: string;
  duration: string;
};

export type ServicePageProps = {
  eyebrow: string;
  eyebrowEmoji: string;
  h1Top: string;
  h1Highlight: string;
  sub: string;
  heroBullets: string[];
  statsPills: { emoji: string; label: string }[];
  deliverablesHeader: string;
  deliverables: Deliverable[];
  processHeader: string;
  process: ProcessStep[];
  pricingHeadline: string;
  pricingPrice: string;
  pricingCadence: string;
  pricingIncluded: string[];
  whoItsFor: string[];
  finalCtaTitle: { plain: string; italic: string };
  finalCtaSub: string;
  pageTitle: string;
  pageDescription: string;
};

export default function ServicePageLayout(props: ServicePageProps) {
  useScrollReveal();

  useEffect(() => {
    document.title = props.pageTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", props.pageDescription);
    window.scrollTo({ top: 0 });
  }, [props.pageTitle, props.pageDescription]);

  return (
    <div className="min-h-screen bg-white text-gray-950 antialiased">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-radial pt-32 pb-20 md:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid bg-grid-fade opacity-50" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-orange-200/30 blur-[120px]" />

        <div className="container-page relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-1.5 text-[12.5px] font-semibold text-gray-700 shadow-sm backdrop-blur">
              <span>{props.eyebrowEmoji}</span>
              {props.eyebrow}
              <ScanFace className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <h1 className="reveal mt-7 text-[44px] font-black tracking-[-0.03em] text-gray-950 sm:text-6xl md:text-7xl lg:text-[78px]">
              {props.h1Top}
              <br />
              <span className="text-gradient-orange">{props.h1Highlight}</span>
            </h1>
            <p className="reveal mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-gray-500">
              {props.sub}
            </p>

            <div className="reveal mx-auto mt-7 flex max-w-3xl flex-wrap items-center justify-center gap-2">
              {props.heroBullets.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-gray-700">
                  <Check className="h-3 w-3 text-orange-500" /> {b}
                </span>
              ))}
            </div>

            <div className="reveal mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#ff8a4c] via-[#ff6b35] to-[#e85a1f] px-6 py-3 text-[14.5px] font-semibold text-white cta-glow"
              >
                Start your project <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:support@gictor.com"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-[14.5px] font-semibold text-gray-950 shadow-sm hover:bg-gray-50"
              >
                Book a call
              </a>
            </div>

            <div className="reveal mt-9 flex flex-wrap items-center justify-center gap-2.5">
              {props.statsPills.map((p) => (
                <span key={p.label} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-[12px] text-gray-700 backdrop-blur">
                  <span>{p.emoji}</span> {p.label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-[12px] text-gray-700 backdrop-blur">
                <span className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-orange-500 text-orange-500" />
                  ))}
                </span>
                <span className="font-semibold">4.9</span> from operators
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="bg-white section-pad">
        <div className="container-page">
          <div className="reveal mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">What you get</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl">
              {props.deliverablesHeader}
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {props.deliverables.map((d, i) => (
              <div
                key={d.title}
                className="reveal hover-lift relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${d.accent} opacity-20 blur-3xl`} />
                <div className="relative">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${d.bg} text-2xl`}>{d.emoji}</div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-gray-950">{d.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-gray-500">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative section-pad">
        <div className="absolute inset-0 bg-gray-50/60" />
        <div className="container-page relative">
          <div className="reveal mx-auto max-w-2xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">How it works</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl">{props.processHeader}</h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {props.process.map((p, i) => (
              <div
                key={p.title}
                className="reveal hover-lift rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-700">Step {i + 1}</span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">{p.duration}</span>
                </div>
                <div className="mt-5 text-3xl">{p.emoji}</div>
                <h3 className="mt-3 text-base font-bold tracking-tight text-gray-950">{p.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-500">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing + Who */}
      <section className="bg-white section-pad">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:gap-8">
            <div className="reveal rounded-3xl border border-gray-100 bg-white p-8 md:p-10 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Who this is for</div>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.02em] text-gray-950 md:text-3xl">
                Built for teams that ship, not plan.
              </h3>
              <ul className="mt-6 space-y-3">
                {props.whoItsFor.map((w) => (
                  <li key={w} className="flex items-start gap-2.5 text-[14.5px] text-gray-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-100 text-orange-600">
                      <Check className="h-3 w-3" />
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 p-8 text-white md:p-10">
              <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-orange-500/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-pink-500/20 blur-3xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur">
                  ✨ Flat monthly
                </span>
                <h3 className="mt-4 text-xl font-bold">{props.pricingHeadline}</h3>
                <div className="mt-5 flex items-end gap-1.5">
                  <span className="text-5xl font-black tracking-[-0.03em] md:text-6xl">{props.pricingPrice}</span>
                  <span className="pb-2 text-sm text-gray-400">{props.pricingCadence}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {props.pricingIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[14px] text-gray-200">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-orange-500/20 text-orange-300">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                  <a
                    href="mailto:support@gictor.com"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-100"
                  >
                    Book a call <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <Link
                    to="/signup"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                  >
                    Or DIY
                  </Link>
                </div>
                <p className="mt-5 text-[12px] text-gray-400">
                  Final price depends on volume and platform. Typical engagement covers 4 to 12 weeks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white pb-20 md:pb-28">
        <div className="container-page">
          <div className="reveal noise-overlay relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#ff8a4c] via-[#ff6b35] to-[#e85a1f] p-10 text-center text-white shadow-[0_40px_120px_-30px_rgba(255,107,53,0.5)] md:p-16">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-300/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pink-400/40 blur-3xl" />
            <div className="relative mx-auto max-w-3xl">
              <h2 className="text-3xl font-black tracking-[-0.03em] md:text-5xl lg:text-6xl">
                {props.finalCtaTitle.plain} <span className="italic font-black">{props.finalCtaTitle.italic}</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/85">
                {props.finalCtaSub}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="mailto:support@gictor.com"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-950 shadow-xl transition hover:scale-[1.02]"
                >
                  Book a call <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  Try the app
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
