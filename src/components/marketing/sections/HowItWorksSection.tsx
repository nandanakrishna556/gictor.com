import { Users, FileText, Sparkles, Check } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Choose your actor",
    desc: "Generate a custom ai actor from scratch. Even clone your own face and voice in under a minute or clone someone else.",
    Icon: Users,
  },
  {
    n: "02",
    title: "Write your prompt",
    desc: "Enter your own script or let AI generate a high-converting ad script tailored to your product and audience.",
    Icon: FileText,
  },
  {
    n: "03",
    title: "Generate your video",
    desc: "Realistic lip-synced talking head ads, ugc videos, clips ready to launch in minutes. Export for Meta, TikTok, or YouTube.",
    Icon: Sparkles,
  },
];

const PORTRAIT_GRADIENTS = [
  "from-sky-400 to-indigo-600",
  "from-blue-400 to-red-500",
  "from-sky-400 to-blue-600",
  "from-blue-400 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600",
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-white section-pad">
      <div className="container-page">
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">How it works</div>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl lg:text-6xl">
            Video ads in <span className="text-gradient-orange">3 steps</span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500">
            From idea to lifelike video. Effortless, fast, unbelievably real.
          </p>
        </div>

        <div className="relative mt-16">
          {/* connector */}
          <div className="pointer-events-none absolute left-0 right-0 top-24 hidden h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent md:block" />

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, idx) => (
              <div key={s.n} className="reveal" style={{ animationDelay: `${idx * 80}ms` }}>
                <Step n={s.n} title={s.title} desc={s.desc} Icon={s.Icon} index={idx} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  n, title, desc, Icon, index,
}: {
  n: string; title: string; desc: string; Icon: typeof Users; index: number;
}) {
  return (
    <div className="hover-lift relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.12)]">
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#5b8bff] to-[#0040d6] text-white shadow-[0_6px_16px_-4px_rgba(255,107,53,0.5)]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-5xl font-black text-gray-100">{n}</span>
      </div>
      <h3 className="mt-4 text-xl font-bold tracking-tight text-gray-950">{title}</h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-gray-500">{desc}</p>

      {/* visual */}
      <div className="mt-5 aspect-[4/3] overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-3">
        {index === 0 && <ActorGrid />}
        {index === 1 && <ScriptMock />}
        {index === 2 && <VideoMock />}
      </div>
    </div>
  );
}

function ActorGrid() {
  return (
    <div className="grid h-full grid-cols-3 gap-1.5">
      {PORTRAIT_GRADIENTS.map((g, i) => (
        <div
          key={i}
          className={`relative rounded-xl bg-gradient-to-br ${g} ${i === 4 ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-50" : ""}`}
        >
          {i === 4 && (
            <div className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-blue-500 text-white shadow-md">
              <Check className="h-3 w-3" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScriptMock() {
  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
        <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
          <Sparkles className="h-2.5 w-2.5" /> AI generate
        </span>
      </div>
      <div className="mt-3 flex-1 space-y-1.5">
        <div className="h-2 w-3/4 rounded-full bg-gray-200" />
        <div className="h-2 w-full rounded-full bg-gray-200" />
        <div className="h-2 w-2/3 rounded-full bg-blue-300" />
        <div className="h-2 w-5/6 rounded-full bg-gray-200" />
        <div className="h-2 w-1/2 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

function VideoMock() {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden rounded-xl bg-gray-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,107,53,0.4),transparent_60%)]" />
      <div className="relative grid h-12 w-12 place-items-center rounded-full bg-white/90 shadow-xl">
        <div className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[10px] border-y-transparent border-l-gray-950" />
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-2/3 rounded-full bg-blue-500" />
        </div>
        <span className="text-[10px] font-semibold text-white">1:24</span>
      </div>
    </div>
  );
}
