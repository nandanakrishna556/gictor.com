import { Check, X } from "lucide-react";

const oldWay = [
  { step: "Hire actors or UGC creators", time: "1-2 weeks" },
  { step: "Wait for content delivery", time: "2-4 weeks" },
  { step: "Discover it doesn't convert", time: "$$$ wasted" },
  { step: "Start the cycle again", time: "Repeat" },
];

const newWay = [
  { step: "Choose an AI actor", time: "10 seconds" },
  { step: "Write or generate a script", time: "30 seconds" },
  { step: "Generate your video", time: "~3 minutes" },
  { step: "Test, iterate, and scale", time: "Same day" },
];

export function ComparisonSection() {
  return (
    <section className="py-28 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            Speed to Market
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5">
            Stop Waiting. Start Selling.
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Go from idea to live ad the same day. No samples, no delays, no risk.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Old way */}
          <div className="bg-white rounded-2xl p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-400 mb-8">The Old Way</h3>
            <ul className="space-y-6">
              {oldWay.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                      <X className="h-4 w-4 text-red-400" />
                    </div>
                    <span className="text-base text-gray-500">{item.step}</span>
                  </div>
                  <span className="text-sm text-gray-400 font-medium whitespace-nowrap">{item.time}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-base text-gray-400">
                Weeks of delay. Missed trends. Wasted budget.
              </p>
            </div>
          </div>

          {/* New way */}
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
            <h3 className="text-xl font-bold text-orange-400 mb-8 relative">With Gictor</h3>
            <ul className="space-y-6 relative">
              {newWay.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-orange-400" />
                    </div>
                    <span className="text-base text-gray-200">{item.step}</span>
                  </div>
                  <span className="text-sm text-orange-400 font-semibold whitespace-nowrap">{item.time}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-gray-700 relative">
              <p className="text-base text-gray-400">
                Start selling today. Scale what works.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
