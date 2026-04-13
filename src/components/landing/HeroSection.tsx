import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { useEffect } from "react";

export function HeroSection() {
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
      document.head.removeChild(playerScript);
      document.head.removeChild(embedScript);
    };
  }, []);

  return (
    <section className="relative pt-36 pb-24 px-6 overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/60 via-white to-white pointer-events-none" />

      <div className="max-w-5xl mx-auto text-center relative">
        {/* Announcement badge */}
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 text-sm font-semibold px-5 py-2.5 rounded-full mb-8 border border-orange-100">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Now with AI-Powered B-Roll Generation
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.05]">
          AI Talking Head Ads
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
            That Actually Convert
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          Generate hyper-realistic talking head video ads in minutes.
          No actors, no camera, no editing. Just results.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Button
            size="lg"
            className="text-base px-8 py-6 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all group"
            asChild
          >
            <Link to="/signup">
              Start Creating Free
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <button
            onClick={() => document.getElementById("demo-video")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-2 text-base text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <Play className="h-4 w-4 text-gray-600 ml-0.5" />
            </div>
            Watch Demo
          </button>
        </div>

        {/* Video showcase grid */}
        <div className="flex justify-center gap-3 md:gap-4 mb-16 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-[140px] md:w-[180px] aspect-[9/16] rounded-2xl bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border border-gray-200/60 shadow-sm"
              style={{ transform: `rotate(${(i - 3) * 3}deg)` }}
            >
              {/* PLACEHOLDER: Replace with actual AI video thumbnails/GIFs */}
              <div className="text-center p-3">
                <div className="w-12 h-12 rounded-full bg-gray-300/60 mx-auto mb-2" />
                <div className="h-2 w-16 bg-gray-300/60 rounded mx-auto mb-1" />
                <div className="h-2 w-10 bg-gray-300/60 rounded mx-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* VSL Video */}
        <div
          id="demo-video"
          className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-gray-200 shadow-2xl"
          dangerouslySetInnerHTML={{
            __html: `<style>wistia-player[media-id='v3ecln3xzv']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/v3ecln3xzv/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style><wistia-player media-id="v3ecln3xzv" aspect="1.7777777777777777"></wistia-player>`,
          }}
        />
      </div>
    </section>
  );
}
