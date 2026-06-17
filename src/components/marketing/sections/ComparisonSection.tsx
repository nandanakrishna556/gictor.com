import { Check, X } from "lucide-react";

const OLD = [
  { step: "Find the right ugc creator", time: "1 to 3 days", cost: "$0 to $50+" },
  { step: "Research, brief, meetings, iterations", time: "1 to 3 days", cost: "$0 to $100+" },
  { step: "Ship the product for free", time: "5 to 14 days", cost: "$20 to $100+" },
  { step: "Contracts and legal headache", time: "Repeat", cost: "$100+ again" },
];

const NEW = [
  { step: "Generate or clone an AI actor", time: "3 min", cost: "~$1 per actor" },
  { step: "Prompt like you're texting a friend", time: "2 min", cost: "~$1 per actor" },
  { step: "Render a finished video", time: "~5 min", cost: "~$5 per video" },
  { step: "Iterate and scale the same day", time: "Unlimited", cost: "~$5 each" },
];

export default function ComparisonSection() {
  return (
    <section className="relative section-pad">
      <div className="absolute inset-0 bg-gray-50/60" />
      <div className="container-page relative">
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">⚡ Speed to Market</div>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl lg:text-6xl">
            Stop waiting. <span className="text-gradient-orange">Start selling.</span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500">
            Same ad, two paths. See how much time and money you actually save per video.
          </p>
        </div>

        <div className="relative mt-14 grid gap-6 md:grid-cols-2 md:gap-8">
          {/* VS badge */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gray-950 text-sm font-black text-white shadow-2xl ring-4 ring-white">
              VS
            </div>
          </div>

          {/* Old way */}
          <div className="reveal rounded-3xl border border-gray-200 bg-white p-7 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                🕒 The old way
              </span>
              <span className="text-2xl">🐌</span>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-400 line-through decoration-2">Traditional UGC</h3>

            <ul className="mt-6 space-y-3">
              {OLD.map((row) => (
                <li key={row.step} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rose-100 text-sky-600">
                    <X className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] text-gray-700">{row.step}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500">{row.time}</span>
                  <span className="text-[12.5px] font-semibold text-sky-600">{row.cost}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 text-center">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Total time</div>
                <div className="mt-1 text-base font-bold text-gray-400 line-through sm:text-lg">2+ weeks</div>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Cost per video</div>
                <div className="mt-1 break-words text-base font-bold leading-tight text-gray-400 line-through sm:text-lg">$300+</div>
              </div>
            </div>
          </div>

          {/* Gictor way */}
          <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5b8bff] via-[#1e5bff] to-[#0040d6] p-7 text-white shadow-[0_30px_80px_-20px_rgba(255,107,53,0.45)]">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur">
                  ✨ With Gictor
                </span>
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="mt-4 text-xl font-bold">AI video ads, live in minutes.</h3>

              <ul className="mt-6 space-y-3">
                {NEW.map((row) => (
                  <li key={row.step} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl bg-white/15 p-3 backdrop-blur">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-blue-600">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1 text-[14px]">{row.step}</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">{row.time}</span>
                    <span className="text-[12.5px] font-semibold">{row.cost}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/20 pt-5 text-center">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide opacity-80">Total time</div>
                  <div className="mt-1 text-base font-bold leading-tight sm:text-lg">~10 min ⚡</div>
                  <div className="mt-0.5 text-[11px] opacity-80">100× faster</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wide opacity-80">Cost per video</div>
                  <div className="mt-1 break-words text-base font-bold leading-tight sm:text-lg">~$5 to $10 💸</div>
                  <div className="mt-0.5 text-[11px] opacity-80">Save 95%+</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[12px] text-gray-500">
          Estimates based on a 30-second talking-head ad on the Creator plan. Your mileage will vary with script length and render settings.
        </p>
      </div>
    </section>
  );
}
