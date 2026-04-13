import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Smartphone, Scissors, Calendar, Globe, TrendingUp } from "lucide-react";

const services = [
  {
    icon: Smartphone,
    title: "Vertical-First Production",
    description: "Every video is shot in 9:16 format, optimized for TikTok, Instagram Reels, and YouTube Shorts from the start.",
  },
  {
    icon: Scissors,
    title: "Full Post-Production",
    description: "Professional editing with captions, transitions, music, sound effects, and motion graphics. Delivered ready to post.",
  },
  {
    icon: Calendar,
    title: "Content Calendars",
    description: "We plan and produce your content calendar so you can post consistently without lifting a finger.",
  },
  {
    icon: Globe,
    title: "Multi-Language Content",
    description: "Reach global audiences with AI actors that speak 30+ languages natively. Localize your best-performing content instantly.",
  },
  {
    icon: TrendingUp,
    title: "Trend-Driven Strategy",
    description: "We monitor platform trends and create content that rides the algorithm. Stay relevant without spending hours on research.",
  },
];

const formats = [
  "TikTok organic and paid content",
  "Instagram Reels and Stories",
  "YouTube Shorts",
  "Snapchat Spotlight",
  "Product demos and unboxings",
  "Testimonial-style content",
];

export default function ServiceShortForm() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />
      <main>
        {/* Hero */}
        <section className="pt-44 pb-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-orange-600 font-bold text-base mb-4 tracking-widest uppercase">Short-form Content</p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08] mb-7">
              Short-form Content
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
                That Goes Viral
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Done-for-you TikTok, Reels, and Shorts content powered by AI actors. We script, produce, edit, and deliver scroll-stopping videos at scale.
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

        {/* Services */}
        <section className="py-28 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-5">
                End-to-end short-form production
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto leading-relaxed text-xl">
                From ideation to posting, we handle every step of your short-form content strategy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {services.map((service, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center mb-5">
                    <service.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 text-xl">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Formats */}
        <section className="py-28 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                  Content for every platform and format
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  We create platform-native content that feels organic, not like an ad. Built to perform on every short-form channel.
                </p>
                <Button className="text-base px-8 py-3.5 h-auto bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold" asChild>
                  <Link to="/signup">Start creating</Link>
                </Button>
              </div>
              <div className="space-y-4">
                {formats.map((format, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-lg text-gray-700 font-medium">{format}</span>
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
              Ready to Dominate
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                Short-form?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-xl mx-auto leading-relaxed">
              Let us produce your TikToks, Reels, and Shorts while you focus on your business.
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
