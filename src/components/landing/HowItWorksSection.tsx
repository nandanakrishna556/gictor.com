import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <section id="how-it-works" className="py-20 px-6 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From idea to ready-to-test video in three simple steps
          </p>
        </div>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className={`grid lg:grid-cols-2 gap-10 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                <Badge variant="secondary" className="mb-4">
                  Step {step.step}
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground mb-6">{step.description}</p>
                <ul className="space-y-3">
                  {step.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-foreground">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Card
                className={`overflow-hidden border-border bg-background ${
                  index % 2 === 1 ? "lg:order-1" : ""
                }`}
              >
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">🖼️</span>
                    </div>
                    <p className="text-sm">{step.image}</p>
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
