import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, Youtube, BarChart3, Zap } from "lucide-react";

const services = [
  { label: "YouTube Videos", href: "/services/youtube-videos", description: "Full-service YouTube ad production with AI actors", icon: Youtube },
  { label: "Media Buying", href: "/services/media-buying", description: "Performance-driven ad buying across all platforms", icon: BarChart3 },
  { label: "Short-form Content", href: "/services/short-form-content", description: "TikTok, Reels, and Shorts content at scale", icon: Zap },
];

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setServicesOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setServicesOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Gictor" className="h-8" />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <button onClick={() => scrollToSection("how-it-works")} className="text-gray-700 hover:text-gray-900 transition-colors font-medium text-lg">
            Demo
          </button>

          {/* Services dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors font-medium text-lg">
              Services
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} />
            </button>

            {servicesOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 min-w-[520px]">
                  <h3 className="font-bold text-gray-900 mb-1 text-2xl">Our Services</h3>
                  <p className="text-gray-500 mb-5 text-lg">End-to-end video production and distribution powered by AI.</p>
                  <div className="space-y-1">
                    {services.map((service) => (
                      <Link
                        key={service.href}
                        to={service.href}
                        className="flex items-start gap-4 px-4 py-4 rounded-xl hover:bg-gray-50 transition-colors group"
                        onClick={() => setServicesOpen(false)}
                      >
                        <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-orange-100 transition-colors">
                          <service.icon className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block text-xl">{service.label}</span>
                          <span className="text-gray-500 leading-snug text-lg">{service.description}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => scrollToSection("pricing")} className="text-gray-700 hover:text-gray-900 transition-colors font-medium text-lg">
            Pricing
          </button>
          <button onClick={() => scrollToSection("faq")} className="text-gray-700 hover:text-gray-900 transition-colors font-medium text-lg">
            FAQ
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="text-base text-gray-700 hover:text-gray-900 font-medium px-5 py-2.5" asChild>
            <Link to="/login">Log In</Link>
          </Button>
          <Button className="text-base px-7 py-3 h-auto bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold" asChild>
            <Link to="/signup">Get started</Link>
          </Button>
        </div>

        <button className="md:hidden p-2 text-gray-700" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 pb-6 pt-2 space-y-4">
          <button onClick={() => scrollToSection("how-it-works")} className="block text-base text-gray-700 hover:text-gray-900 font-medium">Demo</button>
          <div>
            <p className="text-base text-gray-700 font-medium mb-2">Services</p>
            <div className="pl-4 space-y-2">
              {services.map((service) => (
                <Link
                  key={service.href}
                  to={service.href}
                  className="block text-base text-gray-600 hover:text-gray-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {service.label}
                </Link>
              ))}
            </div>
          </div>
          <button onClick={() => scrollToSection("pricing")} className="block text-base text-gray-700 hover:text-gray-900 font-medium">Pricing</button>
          <button onClick={() => scrollToSection("faq")} className="block text-base text-gray-700 hover:text-gray-900 font-medium">FAQ</button>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="text-base" asChild><Link to="/login">Log In</Link></Button>
            <Button className="text-base bg-orange-600 hover:bg-orange-700 text-white rounded-full px-7 py-3 h-auto" asChild><Link to="/signup">Get started</Link></Button>
          </div>
        </div>
      )}
    </nav>
  );
}
