import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center relative">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight">
          Your Next Winner Is{" "}
          <span className="text-primary">Waiting</span>
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          You have ideas you haven't tested. Angles you haven't explored. Hooks
          that might be <span className="text-foreground font-medium italic">the one</span>. Stop waiting. Start finding.
        </p>

        <div className="flex flex-col items-center gap-4">
          <Button size="lg" className="text-lg px-10 py-7 rounded-xl shadow-primary-glow group" asChild>
            <Link to="/signup">
              <Sparkles className="h-5 w-5 mr-2" />
              Create Free Account
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <span className="text-muted-foreground">
            No credit card required. Setup in 2 minutes.
          </span>
        </div>
      </div>
    </section>
  );
}
