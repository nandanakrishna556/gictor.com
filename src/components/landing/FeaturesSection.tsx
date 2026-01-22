import { Card, CardContent } from "@/components/ui/card";
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
    title: "Custom AI Actors",
    description:
      "Create unique, fully customizable AI spokespersons. Your brand's face, available on demand.",
    image: screenshotCustomAiActors,
  },
  {
    icon: Copy,
    title: "Clone Yourself",
    description:
      "Upload your photo and voice. Create an AI version of yourself for unlimited content.",
    image: screenshotCloneYourself,
  },
  {
    icon: FileText,
    title: "Humanized Scripts",
    description:
      "AI that writes like humans talk. Natural pauses, real emotions, authentic delivery.",
    image: screenshotHumanizedScripts,
  },
  {
    icon: Film,
    title: "Realistic B-Roll",
    description:
      "Generate stunning B-roll footage. First-person and third-person perspectives that look authentic.",
    image: screenshotRealisticBroll,
  },
  {
    icon: Wand2,
    title: "Motion Graphics",
    description:
      "Create animated visuals and motion graphics to enhance your video content.",
    image: screenshotMotionGraphics,
  },
  {
    icon: LayoutGrid,
    title: "Kanban Organization",
    description:
      "Organize all your projects and assets in an intuitive kanban board. Stay on top of every creative.",
    image: screenshotKanbanView,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 bg-card/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-lg mb-4 tracking-wide uppercase">Features</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Everything You Need To Create
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Powerful tools designed for speed and quality
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="overflow-hidden border-border bg-background hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="aspect-[3/2] bg-muted flex items-center justify-center relative overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
