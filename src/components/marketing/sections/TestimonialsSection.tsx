import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Quote, ArrowRight } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "I was spending 6k a month on UGC creators. Switched to Gictor last quarter and my CPA dropped 34%. The AI actor we use now outperforms every human creator we tested.",
    name: "Sarah Kim",
    role: "Growth Lead",
    company: "Lumen Beauty",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    metric: "CPA −34%",
  },
  {
    quote:
      "Honestly I was skeptical. Tried it for one client campaign, shipped 40 ad variations in a day, won the account's biggest month ever. Now every client gets this treatment.",
    name: "Marcus Tate",
    role: "Founder",
    company: "Aperture Agency",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    metric: "40 ads/day",
  },
  {
    quote:
      "I cloned myself and my content now posts in English, Spanish, Portuguese, and Hindi. Grew from 800k to 2.3M in 9 weeks. I haven't filmed a single video since March.",
    name: "Priya Raghav",
    role: "Creator",
    company: "2.3M followers",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    metric: "+1.5M followers",
  },
  {
    quote:
      "We used to wait 3 weeks for new creative. Now we test 5 hooks on Monday and scale the winner by Friday. Our ROAS is up 2.1x across all our e-com brands.",
    name: "Diego Alvarez",
    role: "Head of Performance",
    company: "Northpoint Media",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    metric: "ROAS 2.1x",
  },
  {
    quote:
      "Our SaaS demo videos used to cost $1,200 each and take two weeks. Now I spin up localized explainers for every new market in under 10 minutes. Game changer.",
    name: "Emily Chen",
    role: "Head of Marketing",
    company: "Flowstack",
    avatar: "https://randomuser.me/api/portraits/women/90.jpg",
    metric: "$1.2k → $5",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => (a + 1) % TESTIMONIALS.length);
    }, 6500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-blue-50/50 to-white section-pad">
      <div className="container-page">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Left intro */}
          <div className="reveal md:col-span-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">💬 Loved by operators</div>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-gray-950 md:text-5xl">
              They swapped their creative stack. <em className="text-gradient-orange">You probably should too.</em>
            </h2>
            <p className="mt-5 text-[15.5px] leading-relaxed text-gray-500">
              Operators at DTC brands, agencies, SaaS, and creator studios have already replaced their entire production pipeline with Gictor.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <div className="flex -space-x-2">
                {TESTIMONIALS.map((t) => (
                  <img key={t.name} src={t.avatar} alt="" loading="lazy" className="h-9 w-9 rounded-full border-2 border-white object-cover" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                  ))}
                  <span className="ml-1 text-sm font-bold text-gray-950">4.9</span>
                </div>
                <div className="text-[12.5px] text-gray-500">From 2,000+ early customers</div>
              </div>
            </div>

            <Link
              to="/signup"
              className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Join them <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Right rotating cards */}
          <div className="reveal md:col-span-3">
            <div className="relative h-[420px] md:h-[360px]">
              {TESTIMONIALS.map((t, i) => {
                const offset = (i - active + TESTIMONIALS.length) % TESTIMONIALS.length;
                const isActive = offset === 0;
                const isNext = offset === 1;
                const isAfter = offset === 2;
                if (!isActive && !isNext && !isAfter) return null;
                const z = isActive ? 30 : isNext ? 20 : 10;
                const top = isActive ? 0 : isNext ? 10 : 20;
                const scale = isActive ? 1 : isNext ? 0.96 : 0.92;
                const opacity = isActive ? 1 : isNext ? 0.6 : 0.3;
                return (
                  <div
                    key={t.name}
                    className="absolute inset-x-0 transition-all duration-700"
                    style={{ zIndex: z, top, transform: `scale(${scale})`, opacity }}
                  >
                    <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.18)] md:p-9">
                      <Quote className="absolute right-5 top-5 h-12 w-12 fill-blue-100 text-blue-100" />
                      <div className="flex items-center gap-3">
                        <div className="flex">
                          {[0, 1, 2, 3, 4].map((s) => (
                            <Star key={s} className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                          ))}
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11.5px] font-bold text-emerald-700">{t.metric}</span>
                      </div>
                      <p className="relative mt-5 text-[16.5px] leading-relaxed text-gray-700 md:text-[18px]">
                        "{t.quote}"
                      </p>
                      <div className="mt-7 flex items-center gap-3">
                        <img src={t.avatar} alt="" className="h-11 w-11 rounded-full object-cover" loading="lazy" />
                        <div>
                          <div className="text-sm font-bold text-gray-950">{t.name}</div>
                          <div className="text-[12.5px] text-gray-500">{t.role} · {t.company}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* dots */}
            <div className="mt-6 flex items-center justify-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-7 bg-blue-500" : "w-1.5 bg-gray-300"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
