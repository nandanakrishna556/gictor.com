import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import gictorLogo from "@/assets/gictor-logo.png";

export function LandingNav() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
        <Link to="/">
          <img src={gictorLogo} alt="Gictor" className="h-8 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("features")}
            className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("use-cases")}
            className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Use Cases
          </button>
          <button
            onClick={() => scrollToSection("pricing")}
            className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Pricing
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-base" asChild>
            <Link to="/login">Log In</Link>
          </Button>
          <Button className="text-base px-5" asChild>
            <Link to="/signup">Start Free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
