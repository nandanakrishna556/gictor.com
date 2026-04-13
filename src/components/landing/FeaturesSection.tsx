import { User, Copy, Film, Mic } from "lucide-react";

import screenshotCustomAiActors from "@/assets/screenshot-custom-ai-actors.webp";
import screenshotCloneYourself from "@/assets/screenshot-clone-yourself.webp";
import screenshotRealisticBroll from "@/assets/screenshot-realistic-broll.webp";
import screenshotKanbanView from "@/assets/screenshot-kanban-view.webp";

const features = [
  {
    icon: User,
    title: "Generate Custom AI Actors",
    description: "Create hyper-realistic AI actors from scratch. Choose their appearance, voice, and personality to match your brand perfectly.",
    image: screenshotCustomAiActors,
  },
  {
    icon: Copy,
    title: "Clone Yourself",
    description: "Upload a photo and voice sample to create your AI twin. Scale your personal brand without ever stepping in front of a camera again.",
    image: screenshotCloneYourself,
  },
  {
    icon: Mic,
    title: "Realistic Lip-Synced Speech",
    description: "Natural-sounding voices with precise lip-sync. Choose from 30+ languages with native accents that sound completely authentic.",
    image: screenshotKanbanView,
  },
  {
    icon: Film,
    title: "AI-Generated B-Roll",
    description: "Automatically generate cinematic B-roll footage to complement your talking head ads and boost engagement.",
    image: screenshotRealisticBroll,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            Powerful Features
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5">
            Everything You Need to Create
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            One platform. Every tool. No switching between apps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="aspect-[16/10] bg-gray-50 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-base text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
