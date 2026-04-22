import { useEffect, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import LandingNav from "@/components/marketing/LandingNav";
import LandingFooter from "@/components/marketing/LandingFooter";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

export type LegalSection = {
  id: string;
  title: string;
  emoji: string;
  /** Array of paragraphs. Strings starting with "ul:" followed by JSON array become a list. */
  body: (string | { ul: string[] })[];
};

export type LegalPageProps = {
  eyebrow: string;
  eyebrowEmoji: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  contactEmail: string;
  intro: string;
  sections: LegalSection[];
  pageTitle: string;
  pageDescription: string;
};

// Simple inline markdown for **bold**
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-950">{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

export default function LegalPageLayout(props: LegalPageProps) {
  useScrollReveal();
  const [activeId, setActiveId] = useState(props.sections[0]?.id ?? "");

  useEffect(() => {
    document.title = props.pageTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", props.pageDescription);
    window.scrollTo({ top: 0 });
  }, [props.pageTitle, props.pageDescription]);

  // scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    props.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [props.sections]);

  return (
    <div className="min-h-screen bg-white text-gray-950 antialiased">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-radial pt-32 pb-16">
        <div className="pointer-events-none absolute inset-0 bg-dot-grid bg-grid-fade opacity-40" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-orange-200/30 blur-[120px]" />
        <div className="container-page relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-1.5 text-[12.5px] font-semibold text-gray-700 shadow-sm backdrop-blur">
              <span>{props.eyebrowEmoji}</span> {props.eyebrow}
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-[-0.03em] text-gray-950 md:text-6xl">
              {props.title}
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-gray-500">{props.subtitle}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] text-gray-600">
                Last updated: <span className="font-semibold text-gray-950">{props.lastUpdated}</span>
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] text-gray-600">
                Questions? <a href={`mailto:${props.contactEmail}`} className="font-semibold text-orange-600 hover:underline">{props.contactEmail}</a>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-white pb-20 pt-10">
        <div className="container-page">
          <div className="grid gap-10 md:grid-cols-[240px_1fr] md:gap-14">
            {/* TOC */}
            <aside className="md:sticky md:top-24 md:self-start">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">On this page</div>
              <ul className="mt-4 space-y-1 border-l border-gray-100">
                {props.sections.map((s) => {
                  const active = activeId === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={cn(
                          "-ml-px block border-l-2 py-1.5 pl-4 text-[13px] transition",
                          active
                            ? "border-orange-500 font-semibold text-orange-600"
                            : "border-transparent text-gray-500 hover:text-gray-950"
                        )}
                      >
                        {s.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Content */}
            <div className="min-w-0">
              <p className="text-[15.5px] leading-relaxed text-gray-600">{props.intro}</p>

              <div className="mt-12 space-y-12">
                {props.sections.map((s) => (
                  <section key={s.id} id={s.id} className="scroll-mt-24">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-50 text-xl">
                        {s.emoji}
                      </span>
                      <h2 className="text-2xl font-bold tracking-tight text-gray-950">{s.title}</h2>
                    </div>
                    <div className="prose prose-gray mt-5 max-w-none text-[15px] leading-relaxed text-gray-600">
                      {s.body.map((b, i) => {
                        if (typeof b === "string") {
                          return <p key={i} className="mb-4 last:mb-0">{renderInline(b)}</p>;
                        }
                        return (
                          <ul key={i} className="mb-4 list-disc space-y-1.5 pl-5 marker:text-orange-500">
                            {b.ul.map((item) => (
                              <li key={item}>{renderInline(item)}</li>
                            ))}
                          </ul>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-16 rounded-3xl border border-gray-100 bg-gray-50 p-6 md:p-8">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-base font-bold text-gray-950">Still have questions?</h3>
                    <p className="mt-1 text-[14px] text-gray-500">
                      Email us at{" "}
                      <a href={`mailto:${props.contactEmail}`} className="font-semibold text-orange-600 hover:underline">
                        {props.contactEmail}
                      </a>
                      .
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    <ArrowUp className="h-3.5 w-3.5" /> Back to top
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
