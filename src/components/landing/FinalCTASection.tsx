import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function FinalCTASection() {
  return (
    <section className="py-32 px-6 bg-gray-900 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 tracking-tight leading-tight">
          Ready to Create Your
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
            First AI Ad?
          </span>
        </h2>
        <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
          Join thousands of brands using Gictor to produce
          high-converting video ads at scale.
        </p>

        <div className="flex flex-col items-center gap-5 text-left">
          <Button
            className="text-lg px-10 py-5 h-auto bg-orange-600 text-white hover:bg-orange-700 rounded-full shadow-lg group font-semibold"
            asChild
          >
            <Link to="/signup">
              Start Creating Free
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <span className="text-gray-500 text-lg">
            No credit card required. Setup in 2 minutes.
          </span>
        </div>
      </div>
    </section>
  );
}
