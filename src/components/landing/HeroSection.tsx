import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function HeroSection() {
  useEffect(() => {
    // Load Wistia scripts
    const playerScript = document.createElement("script");
    playerScript.src = "https://fast.wistia.com/player.js";
    playerScript.async = true;
    document.head.appendChild(playerScript);

    const embedScript = document.createElement("script");
    embedScript.src = "https://fast.wistia.com/embed/f031icq2kl.js";
    embedScript.async = true;
    embedScript.type = "module";
    document.head.appendChild(embedScript);

    return () => {
      document.head.removeChild(playerScript);
      document.head.removeChild(embedScript);
    };
  }, []);

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <Badge variant="secondary" className="mb-6 gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Video Creation
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          Your Next Winning Ad Is{" "}
          <span className="text-primary">One Test Away</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Test more messages. Find winners faster. Scale what works. Create
          studio-quality UGC videos in minutes with AI.
        </p>

        <div
          className="max-w-4xl mx-auto mb-10 rounded-xl overflow-hidden border border-border shadow-elevated"
          dangerouslySetInnerHTML={{
            __html: `<wistia-player media-id="f031icq2kl" aspect="1.793103448275862"></wistia-player>`,
          }}
        />

        <div className="flex flex-col items-center gap-3">
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <Link to="/login">Create Free Account</Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            No credit card required
          </span>
        </div>
      </div>
    </section>
  );
}
