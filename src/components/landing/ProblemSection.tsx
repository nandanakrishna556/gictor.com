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
    <section className="py-24 px-6 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-lg mb-4 tracking-wide uppercase">The Problem</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Creative Testing Takes Too Long
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your best ad has a shelf life. When performance drops, you need new
            winners fast. But every test costs time and money.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <Card
              key={index}
              className="bg-background border-border hover:border-destructive/30 transition-all duration-300 group"
            >
              <CardContent className="pt-8 pb-8">
                <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-6 group-hover:bg-destructive/20 transition-colors">
                  <problem.icon className="h-7 w-7 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{problem.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
