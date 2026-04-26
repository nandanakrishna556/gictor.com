import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How realistic do the AI actors look?",
    a: "Our AI actors use state-of-the-art video generation technology with natural lip-syncing, realistic body movements, and authentic expressions. Many users report that viewers can't tell the difference from real content.",
  },
  {
    q: "How long does it take to generate a video?",
    a: "Most videos are ready in under 3 minutes. The exact time depends on length and complexity, but our pipeline is optimized for speed without compromising quality.",
  },
  {
    q: "Can I clone my own face and voice?",
    a: "Yes. Upload a photo and a short voice sample, and we'll create an AI version of you. Your clone can deliver any script in your likeness, perfect for scaling personal brand content.",
  },
  {
    q: "What languages are supported?",
    a: "We support 30+ languages with native-sounding accents and lip-syncing. Localize your ads for different markets instantly, no translators or voice actors needed.",
  },
  {
    q: "Do I need video editing experience?",
    a: "Not at all. Gictor handles everything from script to final video. No editing software needed.",
  },
  {
    q: "How does pricing work?",
    a: "Plans start at $29/month for the Starter (10 credits) and scale up to Creator and Pro for higher-volume teams. You can cancel anytime, and your credits never expire.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section id="faq" className="relative bg-white section-pad">
      <div className="container-page">
        <div className="reveal mx-auto max-w-2xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">FAQ</div>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl lg:text-6xl">
            Got questions? <span className="text-gradient-orange">Got answers.</span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-gray-500">
            Still curious? Drop us a line, we'd love to help.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={cn(
                  "reveal overflow-hidden rounded-2xl border bg-white transition",
                  isOpen ? "border-orange-200 shadow-[0_10px_30px_-15px_rgba(255,107,44,0.3)]" : "border-gray-100"
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15.5px] font-semibold text-gray-950">{f.q}</span>
                  <Plus
                    className={cn(
                      "h-5 w-5 shrink-0 transition-all duration-300",
                      isOpen ? "rotate-45 text-orange-500" : "text-gray-400"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid overflow-hidden transition-all duration-300",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="min-h-0">
                    <p className="px-6 pb-5 text-[14.5px] leading-relaxed text-gray-500">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
