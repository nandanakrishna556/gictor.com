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
    <section className="relative pt-40 pb-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-[48px] md:text-[56px] lg:text-[64px] font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
          Create AI Talking Head Ads
          <br />
          That Actually Convert
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Generate hyper-realistic talking head video ads in minutes.
          No actors, no cameras, no editing. Ready for Meta, TikTok, and YouTube.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            onClick={() => document.getElementById("demo-video")?.scrollIntoView({ behavior: "smooth" })}
            className="flex items-center gap-3 px-8 py-3.5 rounded-full border border-gray-200 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Play className="h-4 w-4 text-gray-500" />
            Watch demo
          </button>
          <Button
            size="lg"
            className="text-[15px] px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold shadow-none"
            asChild
          >
            <Link to="/signup">
              Start Creating Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Scrolling video showcase */}
        <div className="flex justify-center gap-4 mb-24 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-[160px] md:w-[200px] aspect-[9/16] rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm flex-shrink-0"
            >
              {/* PLACEHOLDER: Replace with actual AI video thumbnails */}
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
          className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-gray-200 shadow-xl"
          dangerouslySetInnerHTML={{
            __html: `<style>wistia-player[media-id='v3ecln3xzv']:not(:defined) { background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/v3ecln3xzv/swatch'); display: block; filter: blur(5px); padding-top:56.25%; }</style><wistia-player media-id="v3ecln3xzv" aspect="1.7777777777777777"></wistia-player>`,
          }}
        />
      </div>
    </section>
  );
}
