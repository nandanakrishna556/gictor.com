import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofBar } from "@/components/landing/SocialProofBar";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { ToolConsolidationSection } from "@/components/landing/ToolConsolidationSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNav />
      <main>
        <HeroSection />
        <SocialProofBar />
        <HowItWorksSection />
        <FeaturesSection />
        <UseCasesSection />
        <ComparisonSection />
        <ToolConsolidationSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
