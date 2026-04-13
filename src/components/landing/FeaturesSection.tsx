import { User, Copy, Mic, Film, Globe, Users, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Sparkles,
    title: "Custom AI Actors",
    description: "Generate hyper-realistic AI actors from scratch to match your brand perfectly.",
  },
  {
    icon: Copy,
    title: "Clone Yourself",
    description: "Upload a photo and voice sample to create your AI twin and scale your personal brand.",
  },
  {
    icon: Mic,
    title: "Realistic Lip-Sync",
    description: "Natural-sounding voices with precise lip-sync that looks and sounds completely authentic.",
  },
  {
    icon: User,
    title: "AI Avatar Generator",
    description: "Create unique AI avatars with the most realistic AI image generator available.",
  },
  {
    icon: Globe,
    title: "30+ Languages",
    description: "Reach global audiences with multilingual voiceovers and native-sounding accents.",
  },
  {
    icon: Users,
    title: "Actor Library",
    description: "Choose from a diverse range of realistic AI actors to suit every audience and niche.",
  },
  {
    icon: Film,
    title: "AI B-Roll",
    description: "Automatically generate cinematic B-roll footage to complement your talking head ads.",
  },
  {
    icon: Layers,
    title: "Full Pipeline",
    description: "From script to final video, manage your entire ad creation workflow in one place.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-6">
          <div>
            <h2 className="text-[36px] md:text-[44px] font-bold text-gray-900 tracking-tight leading-tight mb-3">
              Build winning ads with
              <br />
              powerful features
            </h2>
            <p className="text-lg text-gray-500 max-w-lg">
              Everything you need to create talking head video ads that look real and actually convert.
            </p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-7 py-3 text-[15px] font-semibold self-start md:self-auto" asChild>
            <Link to="/signup">Start your free trial</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group"
            >
              <div className="h-11 w-11 rounded-xl bg-orange-50 flex items-center justify-center mb-5">
                <feature.icon className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{feature.title}</h3>
              <p className="text-[14px] text-gray-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
