import { Card, CardContent } from "@/components/ui/card";
import { User, Copy, FileText, Film, Wand2, LayoutGrid } from "lucide-react";

const features = [
  {
    icon: User,
    title: "Custom AI Actors",
    description:
      "Create unique, fully customizable AI spokespersons. Your brand's face, available on demand.",
    image: "screenshot-custom-ai-actors.png",
  },
  {
    icon: Copy,
    title: "Clone Yourself",
    description:
      "Upload your photo and voice. Create an AI version of yourself for unlimited content.",
    image: "screenshot-clone-yourself.png",
  },
  {
    icon: FileText,
    title: "Humanized Scripts",
    description:
      "AI that writes like humans talk. Natural pauses, real emotions, authentic delivery.",
    image: "screenshot-humanized-scripts.png",
  },
  {
    icon: Film,
    title: "Realistic B-Roll",
    description:
      "Generate stunning B-roll footage. First-person and third-person perspectives that look authentic.",
    image: "screenshot-realistic-broll.png",
  },
  {
    icon: Wand2,
    title: "Motion Graphics",
    description:
      "Create animated visuals and motion graphics to enhance your video content.",
    image: "screenshot-motion-graphics.png",
  },
  {
    icon: LayoutGrid,
    title: "Kanban Organization",
    description:
      "Organize all your projects and assets in an intuitive kanban board. Stay on top of every creative.",
    image: "screenshot-kanban-view.png",
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
              <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-center text-muted-foreground relative">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm">{feature.image}</p>
                </div>
              </div>
              <CardContent className="pt-6 pb-6">
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
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
