import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import Logo from "./Logo";

export default function LandingFooter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-gray-950 text-gray-300">
      {/* Top hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-32 top-32 h-[480px] w-[480px] rounded-full bg-blue-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-sky-500/10 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="container-page relative pt-20 pb-10">
        {/* Newsletter */}
        <div className="relative overflow-hidden rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent p-8 backdrop-blur-sm md:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300">
                ✨ Creator Newsletter
              </span>
              <h3 className="mt-4 text-2xl font-black tracking-[-0.02em] text-white md:text-3xl">
                The playbook for shipping viral AI ads.
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-400">
                One email a week. Winning hooks, real script teardowns, and the ad trends we see working right now. No fluff.
              </p>
            </div>
            <div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setSubmitted(true);
                }}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <input
                  type="email"
                  required
                  placeholder="you@brand.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-400/50 focus:bg-white/10"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-[#5b8bff] via-[#1e5bff] to-[#0040d6] px-6 py-3 text-sm font-semibold text-white cta-glow"
                >
                  {submitted ? "Subscribed ✓" : (<>Subscribe <ArrowRight className="h-3.5 w-3.5" /></>)}
                </button>
              </form>
              <p className="mt-3 text-[12px] text-gray-500">2,000+ operators already reading. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>

        {/* Trust row */}
        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-b border-white/5 pb-10 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-gray-500">
            <span className="font-semibold uppercase tracking-[0.14em] text-gray-400">Trusted by teams at</span>
            {["Lumen", "Aperture", "Flowstack", "Northpoint"].map((b) => (
              <span key={b} className="text-sm font-bold tracking-tight text-gray-300">{b}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: "⚡", label: "3 min render" },
              { icon: "🌍", label: "30+ languages" },
              { icon: "🛡️", label: "SOC 2 ready" },
            ].map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-gray-300">
                <span>{p.icon}</span> {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* Link grid */}
        <div className="grid gap-10 py-12 md:grid-cols-6">
          <div className="md:col-span-2">
            <Logo variant="light" asStatic />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-gray-400">
              Ship hyper-realistic AI video ads that sell. No actors, no cameras, no editing.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Twitter, href: "#" },
                { Icon: Instagram, href: "#" },
                { Icon: Youtube, href: "#" },
                { Icon: Linkedin, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  aria-label="Social link"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition hover:border-blue-400/40 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[12px] text-emerald-300">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </div>
          </div>

          <FooterCol
            title="Product"
            links={[
              { label: "Features", href: "/#features" },
              { label: "Pricing", href: "/#pricing" },
              { label: "FAQ", href: "/#faq" },
              { label: "Log in", href: "/login" },
            ]}
          />
          <FooterCol
            title="Services"
            links={[
              { label: "YouTube Videos", href: "/services/youtube-videos" },
              { label: "Media Buying", href: "/services/media-buying" },
              { label: "Short-form Content", href: "/services/short-form-content" },
            ]}
          />
          <FooterCol
            title="Resources"
            links={[
              { label: "Blog", href: "#" },
              { label: "Help Center", href: "#" },
              { label: "Contact", href: "mailto:support@gictor.com", external: true },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Cookie Policy", href: "/privacy#cookies" },
            ]}
          />
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/5 pt-8 text-[12px] text-gray-500 md:flex-row md:items-center">
          <span>© {year} Gictor Inc. All rights reserved.</span>
          <span className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-gray-300">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-300">Terms</Link>
            <span className="text-gray-600">·</span>
            <span>Built with 🧡 for operators going viral.</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            {l.external || l.href.startsWith("mailto:") || l.href.startsWith("#") ? (
              <a href={l.href} className="text-[14px] text-gray-400 transition hover:text-white">{l.label}</a>
            ) : (
              <Link to={l.href} className="text-[14px] text-gray-400 transition hover:text-white">{l.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
