import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Gictor" className="h-8" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("use-cases")}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            Use Cases
          </button>
          <button
            onClick={() => scrollToSection("faq")}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            FAQ
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="text-sm text-gray-600 hover:text-gray-900" asChild>
            <Link to="/login">Log In</Link>
          </Button>
          <Button className="text-sm px-5 bg-gray-900 hover:bg-gray-800 text-white rounded-full" asChild>
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 pb-6 pt-2 space-y-4">
          <button onClick={() => scrollToSection("how-it-works")} className="block text-sm text-gray-600 hover:text-gray-900">How It Works</button>
          <button onClick={() => scrollToSection("features")} className="block text-sm text-gray-600 hover:text-gray-900">Features</button>
          <button onClick={() => scrollToSection("use-cases")} className="block text-sm text-gray-600 hover:text-gray-900">Use Cases</button>
          <button onClick={() => scrollToSection("faq")} className="block text-sm text-gray-600 hover:text-gray-900">FAQ</button>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="text-sm" asChild><Link to="/login">Log In</Link></Button>
            <Button className="text-sm bg-gray-900 text-white rounded-full" asChild><Link to="/signup">Get Started</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
}
