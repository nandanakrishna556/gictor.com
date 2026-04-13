import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Film, Mic, PenTool, BarChart3, Layers } from "lucide-react";

const benefits = [
  {
    icon: PenTool,
    title: "Script Writing",
    description: "Our team crafts high-converting scripts tailored to your product and audience, designed to hook viewers in the first 3 seconds.",
  },
  {
    icon: Film,
    title: "AI Video Production",
    description: "We generate hyper-realistic talking head videos using Gictor's AI actors, complete with natural lip-sync and authentic expressions.",
  },
  {
    icon: Mic,
    title: "Professional Voiceovers",
    description: "Choose from 30+ languages and accents. Every voiceover sounds natural and matches the AI actor's lip movements perfectly.",
  },
  {
    icon: Layers,
    title: "Post-Production",
    description: "Full editing, B-roll integration, motion graphics, captions, and music. Delivered ready to publish.",
  },
  {
    icon: BarChart3,
    title: "Performance Optimization",
    description: "We test multiple hooks, scripts, and angles to find the highest-converting combination for your audience.",
  },
];

const whyUs = [
  "Hyper-realistic AI actors that look and sound human",
  "50x faster than traditional video production",
  "Test dozens of ad variations in a single day",
  "Fraction of the cost of hiring real actors or creators",
  "Full-service from script to final deliverable",
  "Optimized for YouTube pre-roll, mid-roll, and in-feed",
];

export default function ServiceYouTube() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />
      <main>
        {/* Hero */}
        <section className="pt-44 pb-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-orange-600 font-bold text-base mb-4 tracking-widest uppercase">YouTube Video Ads</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08] mb-7">
              YouTube Ads That
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                Stop the Scroll
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Full-service YouTube video ad production powered by AI. From script to final cut, we handle everything so you can focus on scaling.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="text-base px-9 py-4 h-auto bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold" asChild>
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="ghost" className="text-base px-9 py-4 h-auto rounded-full font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50" asChild>
                <Link to="mailto:support@gictor.com">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-28 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-5">
                Everything included in your package
              </h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
                A complete done-for-you YouTube ad production service powered by our AI technology.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center mb-5">
                    <benefit.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-base text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section className="py-28 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                  Why brands choose Gictor for YouTube ads
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  We combine cutting-edge AI video technology with creative strategy to deliver YouTube ads that actually convert.
                </p>
                <Button className="text-base px-8 py-3.5 h-auto bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold" asChild>
                  <Link to="/signup">Start your project</Link>
                </Button>
              </div>
              <div className="space-y-4">
                {whyUs.map((point, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-lg text-gray-700 font-medium">{point}</span>
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
              Ready to Scale Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                YouTube Ads?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
              Let us handle the production. You focus on growing your brand.
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
