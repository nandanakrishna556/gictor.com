import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "How realistic do the AI actors look?",
    a: "Our AI actors use state-of-the-art video generation technology. They feature natural lip-syncing, realistic body movements, and authentic expressions. Many of our users report that viewers can't tell the difference from real content.",
  },
  {
    q: "How long does it take to generate a video?",
    a: "Most videos are ready in under 3 minutes. The exact time depends on video length and complexity, but our pipeline is optimized for speed without compromising quality.",
  },
  {
    q: "Can I clone my own face and voice?",
    a: "Yes! Upload a photo and a voice sample, and we'll create an AI version of you. Your clone can then deliver any script in your likeness, perfect for scaling personal brand content.",
  },
  {
    q: "What languages are supported?",
    a: "We support 30+ languages with native-sounding accents and lip-syncing. This means you can localize your ads for different markets instantly without hiring translators or voice actors.",
  },
  {
    q: "Do I need video editing experience?",
    a: "Not at all. Gictor handles everything from script to final video. No editing software needed.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! You can create a free account and explore the platform. No credit card required to get started.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-5">
            Got questions? We've got answers
          </h2>
          <p className="text-gray-600 leading-relaxed text-xl">
            Don't hesitate to drop us a line if you have any questions or need help.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4 text-xl">{faq.q}</span>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {openIndex === i ? (
                    <Minus className="h-4 w-4 text-gray-600" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-600" />
                  )}
                </div>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-gray-600 leading-relaxed text-lg">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
