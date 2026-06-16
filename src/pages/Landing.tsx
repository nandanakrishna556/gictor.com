import { useEffect } from "react";
import LandingNav from "@/components/marketing/LandingNav";
import LandingFooter from "@/components/marketing/LandingFooter";
import HeroSection from "@/components/marketing/sections/HeroSection";
import SocialProofBar from "@/components/marketing/sections/SocialProofBar";
import HowItWorksSection from "@/components/marketing/sections/HowItWorksSection";
import FeaturesSection from "@/components/marketing/sections/FeaturesSection";
import UseCasesSection from "@/components/marketing/sections/UseCasesSection";
import ComparisonSection from "@/components/marketing/sections/ComparisonSection";
import TestimonialsSection from "@/components/marketing/sections/TestimonialsSection";
import PricingSection from "@/components/marketing/sections/PricingSection";
import FAQSection from "@/components/marketing/sections/FAQSection";
import FinalCTASection from "@/components/marketing/sections/FinalCTASection";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function Landing() {
  useScrollReveal();

  useEffect(() => {
    document.title = "Gictor — AI video ads in minutes";
    const desc = "Generate hyper-realistic AI talking-head video ads in minutes. No actors, no cameras, no editing. Ready for Meta, TikTok, and YouTube.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="landing-root min-h-screen bg-white text-gray-950 antialiased">
      <LandingNav />
      <main>
        <HeroSection />
        <SocialProofBar />
        <HowItWorksSection />
        <FeaturesSection />
        <UseCasesSection />
        <ComparisonSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
