const tools = [
  { name: "Actors / UGC Creators", cost: "$500+/video" },
  { name: "Runway / Pika", cost: "$35/mo" },
  { name: "ChatGPT / Claude", cost: "$20/mo" },
  { name: "ElevenLabs", cost: "$27/mo" },
  { name: "CapCut Pro", cost: "$10/mo" },
  { name: "Stock footage", cost: "$30/mo" },
];

const gictorFeatures = [
  "Custom AI actor generation",
  "Clone your face and voice",
  "AI-generated B-Roll",
  "Realistic lip-synced speech",
  "30+ languages supported",
  "High-converting ad scripts",
];

export function ToolConsolidationSection() {
  const totalCost = "$600+";

  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            All-in-One
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5">
            Replace Your Entire Stack
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Stop paying for 6 different tools. Get everything in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Old stack */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-400 mb-8 uppercase tracking-wide">Your current stack</h3>
            <div className="space-y-5 mb-8">
              {tools.map((tool, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-base text-gray-500">{tool.name}</span>
                  <span className="text-base text-gray-400 font-medium">{tool.cost}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-5 flex items-center justify-between">
              <span className="text-base font-bold text-gray-600">Total wasted</span>
              <span className="text-xl font-bold text-red-500 line-through">{totalCost}/mo</span>
            </div>
          </div>

          {/* Gictor */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-white relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
            <h3 className="text-lg font-bold text-orange-400 mb-8 uppercase tracking-wide relative">
              With Gictor
            </h3>
            <div className="space-y-4 mb-8 relative">
              {gictorFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-base text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-5 flex items-center justify-between relative">
              <span className="text-base font-bold text-gray-300">Starting at</span>
              <span className="text-xl font-bold text-orange-400">$30/mo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
