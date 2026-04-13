import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const headlines = [
  "Clone yourself with AI",
  "Generate an AI influencer",
  "Create winning ads with AI",
];

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % headlines.length);
        setIsAnimating(false);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const playerScript = document.createElement("script");
    playerScript.src = "https://fast.wistia.com/player.js";
    playerScript.async = true;
    document.head.appendChild(playerScript);

    const embedScript = document.createElement("script");
    embedScript.src = "https://fast.wistia.com/embed/v3ecln3xzv.js";
    embedScript.async = true;
    embedScript.type = "module";
    document.head.appendChild(embedScript);

    return () => {
      try { document.head.removeChild(playerScript); } catch (_) {}
      try { document.head.removeChild(embedScript); } catch (_) {}
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.innerHTML = `<style>wistia-player[media-id='v3ecln3xzv']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/v3ecln3xzv/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style><wistia-player media-id="v3ecln3xzv" aspect="1.7777777777777777"></wistia-player>`;
    }
  }, []);

  return (
    <section className="relative pt-44 pb-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08] mb-7 h-[1.2em] overflow-hidden">
          <span
            key={currentIndex}
            className={`inline-block transition-all duration-400 ${
              isAnimating
                ? "opacity-0 translate-y-6"
                : "opacity-100 translate-y-0"
            }`}
          >
            {headlines[currentIndex]}
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          Generate hyper-realistic talking head video ads in minutes.
          No actors, no cameras, no editing. Ready for Meta, TikTok, and YouTube.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <button
            onClick={() => document.getElementById("demo-video")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-3 px-9 py-4 rounded-full border-2 border-gray-200 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <Play className="h-5 w-5 text-gray-600" />
            Watch demo
          </button>
          <Button
            className="text-base px-9 py-4 h-auto bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold shadow-none"
            asChild
          >
            <Link to="/signup">
              Start Creating Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Scrolling video showcase */}
        <div className="flex justify-center gap-4 mb-24 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-[160px] md:w-[200px] aspect-[9/16] rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-sm flex-shrink-0"
            >
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-3" />
                <div className="h-2 w-16 bg-gray-200 rounded mx-auto mb-1.5" />
                <div className="h-2 w-10 bg-gray-200 rounded mx-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* VSL Video */}
        <div
          id="demo-video"
          ref={videoRef}
          className="max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl"
        />
      </div>
    </section>
  );
}
