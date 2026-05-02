import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Play, ScanFace, Star } from "lucide-react";

const AVATARS = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/52.jpg",
  "https://randomuser.me/api/portraits/women/90.jpg",
];

export default function HeroSection() {
  const vslRef = useRef<HTMLDivElement>(null);
  const [vslVisible, setVslVisible] = useState(false);

  useEffect(() => {
    if (!vslRef.current || vslVisible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVslVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(vslRef.current);
    return () => observer.disconnect();
  }, [vslVisible]);

  const scrollToReel = () => {
    document.getElementById("reel-marquee")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative overflow-hidden bg-hero-radial pt-32 pb-20 md:pt-40 md:pb-24">
      {/* dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-dot-grid bg-grid-fade opacity-50" />
      {/* big orange blob */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-orange-200/30 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-40 h-[400px] w-[400px] rounded-full bg-pink-300/20 blur-[100px]" />

      <div className="container-page relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="reveal inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-1.5 text-[12.5px] font-medium text-gray-700 shadow-sm backdrop-blur">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-orange-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
            </span>
            <span className="font-semibold">New</span>
            <span className="text-gray-500">Clone yourself, or someone else</span>
            <ScanFace className="h-3.5 w-3.5 text-orange-500" />
          </div>

          {/* H1 */}
          <h1 className="reveal mt-8 text-[46px] font-black tracking-[-0.03em] text-gray-950 sm:text-6xl md:text-7xl lg:text-[84px]" style={{ animationDelay: "60ms" }}>
            Generate an{" "}
            <span className="text-gradient-orange">AI Influencer</span>
          </h1>

          <p className="reveal mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-gray-500 md:text-[19px]" style={{ animationDelay: "120ms" }}>
            Hyper-realistic talking head videos in minutes. No actors, no cameras, no editing. Ready for Meta, TikTok, and YouTube.
          </p>

          {/* CTAs */}
          <div className="reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "180ms" }}>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#ff8a4c] via-[#ff6b35] to-[#e85a1f] px-7 py-3.5 text-[15px] font-semibold text-white cta-glow transition hover:scale-[1.02]"
            >
              Start creating
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={scrollToReel}
              className="inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-5 py-3 text-[15px] font-semibold text-gray-950 shadow-sm transition hover:bg-gray-50"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gray-950 text-white">
                <Play className="h-3 w-3 fill-white" />
              </span>
              See examples
            </button>
          </div>

          {/* Trust row */}
          <div className="reveal mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4" style={{ animationDelay: "240ms" }}>
            <div className="flex -space-x-2">
              {AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-8 w-8 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-[13px] text-gray-600">
              <span className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                ))}
              </span>
              <span><span className="font-semibold text-gray-950">Rated 4.9</span> from 1,000+ brands</span>
            </div>
          </div>
        </div>

        {/* VSL */}
        <div id="reel-marquee" ref={vslRef} className="relative mx-auto mt-16 max-w-5xl">
          <div className="pointer-events-none absolute inset-x-10 -top-10 h-40 rounded-[40px] bg-gradient-to-r from-orange-300/40 via-pink-300/30 to-amber-200/40 blur-3xl" />
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-gray-200 bg-gray-950 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.35)]">
            {vslVisible ? (
              <iframe
                title="VSL"
                src="https://www.loom.com/embed/5c61f195ba0a4f4a954b4f5460cb6d31?hide_title=true&hide_owner=true&hide_share=true"
                frameBorder="0"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-gray-950">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/30">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-2xl">
                    <Play className="ml-1 h-6 w-6 fill-gray-950 text-gray-950" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
