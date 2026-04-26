import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FinalCTASection() {
  return (
    <section className="bg-white section-pad">
      <div className="container-page">
        <div className="reveal noise-overlay relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#ff8a4c] via-[#ff6b35] to-[#e85a1f] p-10 text-center text-white shadow-[0_40px_120px_-30px_rgba(255,107,53,0.5)] md:p-16 lg:p-20">
          {/* blobs */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-300/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pink-400/40 blur-3xl" />
          {/* grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 30%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 30%, transparent 80%)",
            }}
          />

          <div className="relative mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[12px] font-semibold backdrop-blur">
              ✨ Plans from $29/mo. Cancel anytime.
            </span>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.03em] md:text-6xl lg:text-7xl">
              Your first AI ad is
              <br />
              <span className="italic font-black">3 minutes away.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/85">
              Join thousands of brands using Gictor to produce high-converting video ads at scale.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-950 shadow-xl transition hover:scale-[1.02]"
              >
                Start creating <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Log in
              </Link>
            </div>

            <p className="mt-7 text-[12.5px] text-white/80">
              Setup in 2 minutes · Cancel anytime · Credits never expire.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
