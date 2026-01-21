import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Sparkles, Zap } from "lucide-react";

export function HeroSection() {
  useEffect(() => {
    // Load Wistia scripts
    const playerScript = document.createElement("script");
    playerScript.src = "https://fast.wistia.com/player.js";
    playerScript.async = true;
    document.head.appendChild(playerScript);

    const embedScript = document.createElement("script");
    embedScript.src = "https://fast.wistia.com/embed/381oihz74j.js";
    embedScript.async = true;
    embedScript.type = "module";
    document.head.appendChild(embedScript);

    return () => {
      document.head.removeChild(playerScript);
      document.head.removeChild(embedScript);
    };
  }, []);

  return (
    <section className="pt-36 pb-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-5xl mx-auto text-center relative">
        <Badge variant="secondary" className="mb-8 gap-2 px-4 py-2 text-sm">
          <Zap className="h-4 w-4 text-primary" />
          AI-Powered Video Creation
        </Badge>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
          Your Next Winning Ad Is{" "}
          <span className="text-primary relative">
            One Test Away
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 10C50 4 150 2 298 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
          Test more messages. Find winners faster. Scale what works.{" "}
          <span className="text-foreground font-medium">Create studio-quality UGC videos in minutes</span> with AI.
        </p>

        <div
          className="max-w-4xl mx-auto mb-12 rounded-2xl overflow-hidden border border-border shadow-elevated"
          dangerouslySetInnerHTML={{
            __html: `<wistia-player media-id="381oihz74j" aspect="1.7777777777777777"></wistia-player>`,
          }}
        />

        <div className="flex flex-col items-center gap-4">
          <Button size="lg" className="text-lg px-10 py-7 rounded-xl shadow-primary-glow" asChild>
            <Link to="/signup">
              <Sparkles className="h-5 w-5 mr-2" />
              Create Free Account
            </Link>
          </Button>
          <span className="text-muted-foreground">
            No credit card required
          </span>
        </div>
      </div>
    </section>
  );
}
