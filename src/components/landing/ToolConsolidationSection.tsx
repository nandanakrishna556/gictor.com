const tools = [
  { name: "UGC Creators", cost: "$500+/video" },
  { name: "Runway / Pika", cost: "$35/mo" },
  { name: "ChatGPT / Claude", cost: "$20/mo" },
  { name: "ElevenLabs", cost: "$27/mo" },
  { name: "CapCut Pro", cost: "$10/mo" },
  { name: "Stock footage", cost: "$30/mo" },
];

const gictorFeatures = [
  "AI script generation",
  "50+ realistic AI actors",
  "Clone your face & voice",
  "AI-generated B-Roll",
  "Motion graphics",
  "Lip-synced speech",
  "30+ languages",
  "Project management",
];

export function ToolConsolidationSection() {
  const totalCost = "$600+";

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            All-in-One
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Replace Your Entire Stack
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Stop paying for 6 different tools. Get everything in one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Old stack */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h3 className="text-base font-bold text-gray-400 mb-6 uppercase tracking-wide">Your current stack</h3>
            <div className="space-y-4 mb-6">
              {tools.map((tool, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{tool.name}</span>
                  <span className="text-sm text-gray-400 font-medium">{tool.cost}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">Total wasted</span>
              <span className="text-lg font-bold text-red-500 line-through">{totalCost}/mo</span>
            </div>
          </div>

          {/* Gictor */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-white relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
            <h3 className="text-base font-bold text-orange-400 mb-6 uppercase tracking-wide relative">
              With Gictor
            </h3>
            <div className="space-y-3 mb-6 relative">
              {gictorFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-700 pt-4 flex items-center justify-between relative">
              <span className="text-sm font-bold text-gray-300">Starting at</span>
              <span className="text-lg font-bold text-orange-400">$30/mo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
