import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const useCases = [
  {
    emoji: "🛍️",
    title: "DTC Brands",
    description:
      "Test more angles, find winners faster. Stop burning budget on creatives that don't convert.",
    bullets: [
      "Test 20+ hooks per week",
      "Iterate on winning formulas",
      "Scale proven messages",
    ],
  },
  {
    emoji: "📊",
    title: "Media Buyers",
    description:
      "Fresh creatives on demand. No more waiting on production while your ads fatigue.",
    bullets: [
      "Same-day creative testing",
      "Combat creative fatigue fast",
      "Data-driven iterations",
    ],
  },
  {
    emoji: "🏢",
    title: "Agencies",
    description:
      "Deliver more value to clients without scaling headcount. Rapid prototyping, unlimited revisions.",
    bullets: [
      "Prototype concepts instantly",
      "Unlimited client revisions",
      "Scale without hiring",
    ],
  },
  {
    emoji: "🚀",
    title: "Founders & Startups",
    description:
      "Look like a big brand on a bootstrap budget. Create professional video ads without a production team.",
    bullets: [
      "Professional quality on any budget",
      "No production team needed",
      "Launch campaigns in hours",
    ],
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-lg mb-4 tracking-wide uppercase">Use Cases</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Built For Teams Who Move Fast
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            See how different teams use Gictor to scale their video production
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="border-border bg-card hover:border-primary/30 transition-all duration-300 group"
            >
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start gap-5 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <span className="text-3xl">{useCase.emoji}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 ml-[84px]">
                  {useCase.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-3 text-lg">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
