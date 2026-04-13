import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const popularFeatures = [
  {
    title: "Ad Pipeline",
    description: "Go from script to final video in a single streamlined pipeline. No switching between tools.",
    linkText: "Learn more",
  },
  {
    title: "AI Actor Generator",
    description: "Generate custom AI actors from scratch with realistic faces, voices, and expressions.",
    linkText: "Learn more",
  },
  {
    title: "Clone Yourself",
    description: "Create an AI version of yourself. Scale your personal brand without ever filming again.",
    linkText: "Learn more",
  },
];

export function PopularFeaturesSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div>
            <h2 className="text-[36px] md:text-[44px] font-bold text-gray-900 tracking-tight mb-3">
              Most popular features
            </h2>
            <p className="text-lg text-gray-500">
              Check out our most popular features that help you create ads in minutes.
            </p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-7 py-3 text-[15px] font-semibold self-start md:self-auto" asChild>
            <Link to="/signup">Try it free</Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {popularFeatures.map((feature, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow group">
              {/* PLACEHOLDER: Replace with actual feature image */}
              <div className="aspect-[4/3] bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="w-20 h-20 rounded-2xl bg-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium">Feature image</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-[15px] text-gray-500 leading-relaxed mb-4">{feature.description}</p>
                <span className="text-[15px] text-orange-600 font-semibold group-hover:underline cursor-pointer">
                  {feature.linkText} &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
