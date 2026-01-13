import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const useCases = [
  {
    emoji: "🛍️",
    title: "DTC Brands",
    description:
      "Test more angles, find winners faster. Stop burning budget on creatives that don't convert. Know what works before you scale.",
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
      "Fresh creatives on demand. No more waiting on production while your ads fatigue. Test new angles the same day you think of them.",
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
      "Deliver more value to clients without scaling headcount. Rapid prototyping, unlimited revisions, faster turnaround.",
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
      "Look like a big brand on a bootstrap budget. Create professional video ads without a production team or massive spend.",
    bullets: [
      "Professional quality on any budget",
      "No production team needed",
      "Launch campaigns in hours",
    ],
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-20 px-6 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built For Teams Who Move Fast
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how different teams use Gictor to scale their video production
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <Card
              key={index}
              className="border-border bg-background hover:border-primary/30 transition-colors"
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{useCase.emoji}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {useCase.description}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 ml-16">
                  {useCase.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
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
