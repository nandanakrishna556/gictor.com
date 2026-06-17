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
    <section className="landing-hero relative bg-white pt-28 pb-16 md:pt-32 md:pb-20">
      <div className="container-page relative">
        {/* Blue hero card */}
        <div className="noise-overlay relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#5b8bff] via-[#1e5bff] to-[#0040d6] px-6 py-20 text-center text-white shadow-[0_50px_140px_-40px_rgba(30,91,255,0.55)] md:px-12 md:py-28 lg:py-32">
          {/* ambient blobs */}
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-sky-300/40 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-400/40 blur-[100px]" />
          {/* grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 65% 55% at 50% 45%, #000 30%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 45%, #000 30%, transparent 80%)",
            }}
          />

          <div className="relative mx-auto max-w-4xl">
            {/* Badge */}
            <div className="reveal inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[12.5px] font-semibold text-white backdrop-blur ring-1 ring-white/20">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              New
              <span className="font-medium text-white/80">Clone yourself, or someone else</span>
              <ScanFace className="h-3.5 w-3.5" />
            </div>

            {/* H1 with serif italic accent */}
            <h1
              className="reveal mt-8 text-[46px] font-black tracking-[-0.03em] sm:text-6xl md:text-7xl lg:text-[88px]"
              style={{ animationDelay: "60ms" }}
            >
              Generate an
              <br />
              <em className="font-serif-accent">AI Influencer</em>
            </h1>

            <p
              className="reveal mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-white/85 md:text-[19px]"
              style={{ animationDelay: "120ms" }}
            >
              Hyper-realistic talking head videos in minutes. No actors, no cameras, no editing. Ready for Meta, TikTok, and YouTube.
            </p>

            {/* CTAs */}
            <div
              className="reveal mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "180ms" }}
            >
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-bold text-gray-950 shadow-xl transition hover:scale-[1.02]"
              >
                Start creating
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={scrollToReel}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-white/10 px-5 py-3 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-gray-950">
                  <Play className="h-3 w-3 fill-gray-950" />
                </span>
                See examples
              </button>
            </div>

            {/* Trust row */}
            <div
              className="reveal mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
              style={{ animationDelay: "240ms" }}
            >
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
              <div className="flex items-center gap-2 text-[13px] text-white/85">
                <span className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-white text-white" />
                  ))}
                </span>
                <span><span className="font-semibold text-white">Rated 4.9</span> from 1,000+ brands</span>
              </div>
            </div>
          </div>
        </div>

        {/* VSL */}
        <div id="reel-marquee" ref={vslRef} className="relative mx-auto mt-12 max-w-5xl">
          <div className="pointer-events-none absolute inset-x-10 -top-10 h-40 rounded-[40px] bg-gradient-to-r from-blue-300/40 via-indigo-300/30 to-sky-200/40 blur-3xl" />
          <div className="relative aspect-video overflow-hidden rounded-3xl border border-gray-200 bg-gray-950 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.35)]">
            {vslVisible ? (
              <iframe
                title="Demo"
                src="https://player.vimeo.com/video/1188607283?badge=0&autopause=0&player_id=0&app_id=58479"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
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
