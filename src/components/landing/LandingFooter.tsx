import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="text-xl font-bold text-primary">
            Gictor
          </Link>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Product
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Support
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            © 2025 Gictor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
