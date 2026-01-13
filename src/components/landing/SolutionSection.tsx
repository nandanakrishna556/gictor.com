import { Card } from "@/components/ui/card";

export function SolutionSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Test Any Message In Minutes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gictor lets you generate full video ads from just an idea. Find out
            what works before you spend real money on production.
          </p>
        </div>

        <Card className="overflow-hidden border-border bg-card">
          <div className="aspect-video bg-muted flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-sm">screenshot-dashboard-overview.png</p>
              <p className="text-xs mt-1">
                Main dashboard showing project kanban view
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
