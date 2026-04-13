import screenshotHumanizedScripts from "@/assets/screenshot-humanized-scripts.webp";
import screenshotCustomAiActors from "@/assets/screenshot-custom-ai-actors.webp";
import screenshotKanbanView from "@/assets/screenshot-kanban-view.webp";

const steps = [
  {
    number: "01",
    title: "Write or Generate Your Script",
    description:
      "Enter your own script or let AI generate one that sounds natural — with real pauses, emotions, and hooks that grab attention.",
    image: screenshotHumanizedScripts,
  },
  {
    number: "02",
    title: "Choose Your AI Actor",
    description:
      "Pick from 50+ realistic AI actors or create a custom one. Clone your own face and voice for unlimited content at scale.",
    image: screenshotCustomAiActors,
  },
  {
    number: "03",
    title: "Generate & Export",
    description:
      "Your video is ready in under 3 minutes. Add B-roll, motion graphics, and captions — then export directly for any platform.",
    image: screenshotKanbanView,
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            Simple 3-Step Process
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            From Idea to Video in Minutes
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            No camera. No actors. No editing skills. Just results.
          </p>
        </div>

        <div className="space-y-20">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12`}
            >
              <div className="flex-1 max-w-md">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 font-bold text-lg mb-6">
                  {step.number}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-base text-gray-500 leading-relaxed">{step.description}</p>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-gray-50">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
