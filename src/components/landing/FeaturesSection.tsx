import { User, Copy, FileText, Film, Wand2, LayoutGrid } from "lucide-react";

import screenshotCustomAiActors from "@/assets/screenshot-custom-ai-actors.webp";
import screenshotCloneYourself from "@/assets/screenshot-clone-yourself.webp";
import screenshotHumanizedScripts from "@/assets/screenshot-humanized-scripts.webp";
import screenshotRealisticBroll from "@/assets/screenshot-realistic-broll.webp";
import screenshotMotionGraphics from "@/assets/screenshot-motion-graphics.webp";
import screenshotKanbanView from "@/assets/screenshot-kanban-view.webp";

const features = [
  {
    icon: User,
    title: "50+ AI Actors",
    description: "Diverse, realistic AI spokespersons for every audience and campaign style.",
    image: screenshotCustomAiActors,
  },
  {
    icon: Copy,
    title: "Clone Yourself",
    description: "Upload a photo and voice sample to create your AI twin for unlimited content.",
    image: screenshotCloneYourself,
  },
  {
    icon: FileText,
    title: "AI Script Writer",
    description: "Scripts that sound like real people talk — with natural pauses and emotional hooks.",
    image: screenshotHumanizedScripts,
  },
  {
    icon: Film,
    title: "Realistic B-Roll",
    description: "AI-generated B-roll footage from first-person and third-person perspectives.",
    image: screenshotRealisticBroll,
  },
  {
    icon: Wand2,
    title: "Motion Graphics",
    description: "Animated visuals and graphics to enhance your video content automatically.",
    image: screenshotMotionGraphics,
  },
  {
    icon: LayoutGrid,
    title: "Project Management",
    description: "Organize assets in folders with kanban boards. Stay on top of every creative.",
    image: screenshotKanbanView,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            Powerful Features
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Everything You Need to Create
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            One platform. Every tool. No switching between apps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="aspect-[3/2] bg-gray-50 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
