import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const oldWay = [
  "Guess which angle might work",
  "Wait weeks for production",
  "Find out it doesn't convert",
  "Repeat the expensive cycle",
];

const newWay = [
  "Test 20 angles in a day",
  "Find winners in hours, not weeks",
  "Know what converts before you scale",
  "Iterate and improve continuously",
];

export function ComparisonSection() {
  return (
    <section id="pricing" className="py-24 px-6 bg-card/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-lg mb-4 tracking-wide uppercase">The Difference</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            The New Playbook
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Test cheap. Scale what wins.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-border bg-background">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-muted-foreground font-bold">
                The Old Way
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-5">
                {oldWay.map((item, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <X className="h-5 w-5 text-destructive" />
                    </div>
                    <span className="text-lg text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-background shadow-primary-glow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-4 relative">
              <CardTitle className="text-2xl text-primary font-bold">
                The Gictor Way
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <ul className="space-y-5">
                {newWay.map((item, index) => (
                  <li key={index} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-lg font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
