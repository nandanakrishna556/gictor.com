import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    step: 1,
    title: "Write or Generate Your Script",
    description:
      "Start with an idea. The AI writes hooks that stop the scroll, structures your message, and hits the emotional beats. One click humanizes it so it sounds like a real person talking — not AI.",
    bullets: [
      "Generate scripts from prompts",
      "Recreate viral ad frameworks",
      "One-click humanizer for natural delivery",
    ],
    image: "screenshot-script-generator.png",
  },
  {
    step: 2,
    title: "Create Your AI Actor",
    description:
      "Build completely custom AI spokespersons from a photo and voice sample. Clone yourself or create unique brand ambassadors. Use them unlimited times with no licensing fees.",
    bullets: [
      "Fully customizable AI actors",
      "Clone your own face and voice",
      "Unlimited usage, no extra fees",
    ],
    image: "screenshot-ai-actor-creator.png",
  },
  {
    step: 3,
    title: "Generate & Test",
    description:
      "Full video in minutes. Perfect lip-sync that's indistinguishable from reality. Ready to run. Test it, learn from it, iterate — all in the same afternoon.",
    bullets: [
      "Studio-quality output",
      "Natural lip-sync technology",
      "Export and run immediately",
    ],
    image: "screenshot-video-output.png",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-lg mb-4 tracking-wide uppercase">How It Works</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Three Steps to Your Next Winner
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From idea to ready-to-test video in minutes, not weeks
          </p>
        </div>

        <div className="space-y-20">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <div className="inline-flex items-center gap-3 mb-6">
                  <span className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    {step.step}
                  </span>
                  <span className="text-primary font-semibold text-lg">Step {step.step}</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-5 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{step.description}</p>
                <ul className="space-y-4">
                  {step.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-lg text-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Card
                className={`overflow-hidden border-border bg-card ${
                  index % 2 === 1 ? "lg:order-1" : ""
                }`}
              >
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🖼️</span>
                    </div>
                    <p className="text-base">{step.image}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
