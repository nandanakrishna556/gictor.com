import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    title: "Custom AI Actors",
    description:
      "Create unique, fully customizable AI spokespersons. Your brand's face, available on demand.",
    image: "screenshot-custom-ai-actors.png",
  },
  {
    title: "Clone Yourself",
    description:
      "Upload your photo and voice. Create an AI version of yourself for unlimited content.",
    image: "screenshot-clone-yourself.png",
  },
  {
    title: "Humanized Scripts",
    description:
      "AI that writes like humans talk. Natural pauses, real emotions, authentic delivery.",
    image: "screenshot-humanized-scripts.png",
  },
  {
    title: "Realistic B-Roll",
    description:
      "Generate stunning B-roll footage. First-person and third-person perspectives that look authentic.",
    image: "screenshot-realistic-broll.png",
  },
  {
    title: "Motion Graphics",
    description:
      "Create animated visuals and motion graphics to enhance your video content.",
    image: "screenshot-motion-graphics.png",
  },
  {
    title: "Kanban Organization",
    description:
      "Organize all your projects and assets in an intuitive kanban board. Stay on top of every creative.",
    image: "screenshot-kanban-view.png",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need To Create
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed for speed and quality
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="overflow-hidden border-border bg-card hover:border-primary/30 transition-colors group"
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors">
                    <span className="text-lg">✨</span>
                  </div>
                  <p className="text-xs">{feature.image}</p>
                </div>
              </div>
              <CardContent className="pt-4">
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
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
