import { useState } from "react";
import { ChevronDown } from "lucide-react";

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
    a: "Not at all. Gictor handles everything from script to final video. You can add B-roll and captions all within the platform. No editing software needed.",
  },
  {
    q: "What platforms can I use the videos on?",
    a: "Videos are optimized for TikTok, Instagram Reels, YouTube Shorts, Facebook Ads, and Meta Ads. You can export in any aspect ratio and resolution you need.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! You can create a free account and start generating videos immediately. No credit card required.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            FAQ
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5">
            Common Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-base font-semibold text-gray-900 pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-base text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
