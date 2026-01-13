import { Clock, DollarSign, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const problems = [
  {
    icon: Clock,
    title: "Slow Turnaround",
    description:
      "Waiting weeks for new creatives while your ads fatigue and performance tanks.",
  },
  {
    icon: DollarSign,
    title: "Expensive Guessing",
    description:
      "Every creative is a gamble. Most don't work. But you won't know until you've spent the budget.",
  },
  {
    icon: TrendingDown,
    title: "Can't Keep Up",
    description:
      "Competitors testing 30+ creatives a month. You're stuck testing a handful.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 px-6 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Creative Testing Takes Too Long
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your best ad has a shelf life. When performance drops, you need new
            winners fast. But every test costs time and money.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <Card
              key={index}
              className="bg-background border-border hover:border-primary/30 transition-colors"
            >
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                  <problem.icon className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
