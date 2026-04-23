import { Link } from "react-router-dom";
import { ScanFace, Mic, Globe, Layers, Film, Users, User, Check, ArrowRight } from "lucide-react";

export default function FeaturesSection() {
  return (
    <section id="features" className="relative section-pad">
      <div className="absolute inset-0 bg-gray-50/60" />
      <div className="absolute inset-0 bg-dot-grid bg-grid-fade opacity-40" />
      <div className="container-page relative">
        <div className="reveal flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Features</div>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl lg:text-6xl">
              Everything to make ads <span className="text-gradient-orange">that convert.</span>
            </h2>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Start free trial <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-6 md:auto-rows-[minmax(180px,auto)]">
          {/* Big dark hero card */}
          <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-7 text-white md:col-span-4 md:row-span-2 md:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-1/3 h-56 w-56 rounded-full bg-pink-500/20 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-semibold backdrop-blur">
                  📋 Clone Yourself
                </span>
                <h3 className="mt-5 text-3xl font-black tracking-[-0.02em] md:text-[40px] md:leading-[1.05]">
                  Upload a selfie. <br /> Get an AI twin in 60s.
                </h3>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-gray-300">
                  Scale your personal brand. Post daily without ever filming again. Voice + face, indistinguishable from the real you.
                </p>
                <ul className="mt-6 space-y-2">
                  {[
                    "Face cloning from 1 photo",
                    "Voice cloning from 30s audio",
                    "Unlimited scripts + languages",
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-[14px] text-gray-300">
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-orange-500/20 text-orange-400">
                        <Check className="h-3 w-3" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stacked tilted cards */}
              <div className="relative hidden h-56 w-44 md:block">
                <div className="absolute right-8 top-2 h-44 w-32 rotate-[-10deg] rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 shadow-2xl" />
                <div className="absolute right-2 top-6 h-44 w-32 rotate-[6deg] rounded-2xl bg-gradient-to-br from-orange-400 to-amber-600 shadow-2xl" />
                <div className="absolute right-16 top-10 h-44 w-32 rotate-[-2deg] rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-2xl" />
              </div>
            </div>
          </div>

          <BentoCard className="md:col-span-2" Icon={ScanFace} title="Custom AI Actors" desc="Generate hyper-realistic actors tailored to your brand from scratch." />
          <BentoCard className="md:col-span-2" Icon={Mic} title="Realistic Lip-Sync" desc="Precise sync that fools the eye and the ear." />
          <BentoCard
            className="md:col-span-2 bg-gradient-to-br from-orange-50 to-white border-orange-100"
            Icon={Globe}
            title="30+ Languages"
            desc="Global audiences with native accents."
            footer={
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["EN", "ES", "FR", "DE", "PT", "JP", "+24"].map((c) => (
                  <span key={c} className="rounded-full border border-orange-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-orange-700">{c}</span>
                ))}
              </div>
            }
          />
          <BentoCard
            className="md:col-span-3"
            Icon={Layers}
            title="Full Ad Pipeline"
            desc="Script → actor → voice → video. All in one canvas."
            footer={
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
                {["Script", "Actor", "Voice", "Video"].map((s, i, arr) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 ${i === arr.length - 1 ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-700"}`}>{s}</span>
                    {i < arr.length - 1 && <span className="text-gray-400">→</span>}
                  </div>
                ))}
              </div>
            }
          />
          <BentoCard className="md:col-span-2" Icon={Film} title="AI B-Roll" desc="Cinematic B-roll auto-generated for every ad." />
          <BentoCard className="md:col-span-2" Icon={Users} title="Actor Library" desc="Diverse pre-built actors for every niche." />
          <BentoCard className="md:col-span-2" Icon={User} title="AI Avatar Generator" desc="Unique avatars via our image model." />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  className = "",
  Icon,
  title,
  desc,
  footer,
}: {
  className?: string;
  Icon: typeof ScanFace;
  title: string;
  desc: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className={`reveal hover-lift relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.08)] ${className}`}>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#ff8a4c] to-[#e85a1f] text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="mt-4 text-lg font-bold tracking-tight text-gray-950">{title}</h4>
      <p className="mt-1.5 text-[14px] leading-relaxed text-gray-500">{desc}</p>
      {footer}
    </div>
  );
}
