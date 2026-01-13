import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function FinalCTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Your Next Winner Is Waiting
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
          You have ideas you haven't tested. Angles you haven't explored. Hooks
          that might be the one. Stop waiting. Start finding.
        </p>

        <div className="flex flex-col items-center gap-3">
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <Link to="/login">Create Free Account</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            No credit card required. Setup in 2 minutes.
          </span>
        </div>
      </div>
    </section>
  );
}
