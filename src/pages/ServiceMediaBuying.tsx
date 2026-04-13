import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Target, TrendingUp, BarChart3, Zap, RefreshCw } from "lucide-react";

const services = [
  {
    icon: Target,
    title: "Campaign Strategy",
    description: "We build custom media buying strategies based on your goals, budget, and target audience across Meta, TikTok, YouTube, and Google.",
  },
  {
    icon: Zap,
    title: "AI-Powered Creatives",
    description: "Generate dozens of ad variations with Gictor's AI actors. Test multiple hooks, scripts, and angles to find your winning creative.",
  },
  {
    icon: BarChart3,
    title: "Performance Management",
    description: "Daily monitoring, bid optimization, audience refinement, and budget allocation to maximize your ROAS at every stage of the funnel.",
  },
  {
    icon: RefreshCw,
    title: "Creative Iteration",
    description: "Continuous A/B testing and rapid creative refreshes. When ad fatigue hits, we spin up new variations in hours, not weeks.",
  },
  {
    icon: TrendingUp,
    title: "Scaling & Reporting",
    description: "Transparent weekly reports with actionable insights. We scale what works and cut what doesn't, so every dollar is optimized.",
  },
];

const platforms = [
  "Meta Ads (Facebook + Instagram)",
  "TikTok Ads",
  "YouTube Ads",
  "Google Ads",
  "Snapchat Ads",
  "Pinterest Ads",
];

export default function ServiceMediaBuying() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />
      <main>
        {/* Hero */}
        <section className="pt-44 pb-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-orange-600 font-bold text-base mb-4 tracking-widest uppercase">Media Buying</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08] mb-7">
              Performance Ads
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                That Print Money
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Done-for-you media buying with AI-generated creatives. We manage your campaigns from strategy to scale across every major platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="text-base px-9 py-4 h-auto bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold" asChild>
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="ghost" className="text-base px-9 py-4 h-auto rounded-full font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50" asChild>
                <Link to="mailto:support@gictor.com">Book a Call</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-28 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-5">
                Full-stack media buying
              </h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
                From creative production to campaign management, we handle every piece of the puzzle.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center mb-5">
                    <service.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="py-28 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                  We run ads across every major platform
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  One team, all platforms. We know what works on each channel and optimize accordingly.
                </p>
                <Button className="text-base px-8 py-3.5 h-auto bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold" asChild>
                  <Link to="/signup">Get a free audit</Link>
                </Button>
              </div>
              <div className="space-y-4">
                {platforms.map((platform, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-lg text-gray-700 font-medium">{platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6 bg-gray-900 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 tracking-tight leading-tight">
              Ready to Scale
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                Your Ad Spend?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
              Let our team manage your campaigns while AI handles the creative. Maximum ROAS, minimum effort.
            </p>
            <Button className="text-lg px-10 py-5 h-auto bg-orange-600 text-white hover:bg-orange-700 rounded-full font-semibold" asChild>
              <Link to="/signup">
                Get Started
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
