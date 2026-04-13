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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Gictor" className="h-8" />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <button onClick={() => scrollToSection("how-it-works")} className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Demo
          </button>
          <button onClick={() => scrollToSection("features")} className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Features
          </button>
          <button onClick={() => scrollToSection("pricing")} className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Pricing
          </button>
          <button onClick={() => scrollToSection("faq")} className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors font-medium">
            FAQ
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-[15px] text-gray-600 hover:text-gray-900 font-medium" asChild>
            <Link to="/login">Log In</Link>
          </Button>
          <Button className="text-[15px] px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold" asChild>
            <Link to="/signup">Get started</Link>
          </Button>
        </div>

        <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-6 pb-6 pt-2 space-y-4">
          <button onClick={() => scrollToSection("how-it-works")} className="block text-[15px] text-gray-600 hover:text-gray-900">Demo</button>
          <button onClick={() => scrollToSection("features")} className="block text-[15px] text-gray-600 hover:text-gray-900">Features</button>
          <button onClick={() => scrollToSection("pricing")} className="block text-[15px] text-gray-600 hover:text-gray-900">Pricing</button>
          <button onClick={() => scrollToSection("faq")} className="block text-[15px] text-gray-600 hover:text-gray-900">FAQ</button>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="text-[15px]" asChild><Link to="/login">Log In</Link></Button>
            <Button className="text-[15px] bg-orange-600 hover:bg-orange-700 text-white rounded-full" asChild><Link to="/signup">Get started</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
}
