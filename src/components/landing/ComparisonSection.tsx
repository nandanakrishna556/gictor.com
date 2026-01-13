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
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The New Playbook
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Test cheap. Scale what wins.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-muted-foreground">
                The Old Way
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {oldWay.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <X className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-card shadow-primary-glow">
            <CardHeader>
              <CardTitle className="text-xl text-primary">
                The Gictor Way
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {newWay.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span>{item}</span>
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
