import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],
  Resources: [
    { label: "Blog", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "mailto:support@gictor.com" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="py-16 px-6 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <img src="/logo.png" alt="Gictor" className="h-8 mb-4" />
            <p className="text-[14px] text-gray-500 leading-relaxed">
              Create hyper-realistic AI talking head video ads that convert. No actors, no cameras, no editing.
            </p>
          </div>
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-[14px] font-bold text-gray-900 uppercase tracking-wide mb-4">{section}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("#") ? (
                      <button
                        onClick={() => {
                          const id = link.href.replace("#", "");
                          if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        {link.label}
                      </button>
                    ) : link.href.startsWith("mailto") ? (
                      <a href={link.href} className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-8 text-center">
          <p className="text-[13px] text-gray-400">
            &copy; {new Date().getFullYear()} Gictor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
