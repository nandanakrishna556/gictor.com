import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function TestimonialsSection() {
  return (
    <section className="py-28 px-6 bg-orange-50/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-10 md:gap-16">
          {/* Left: headline + CTA */}
          <div className="md:w-2/5">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
              Join 1,000+ businesses going viral with AI actors
            </h2>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 py-3.5 h-auto text-base font-semibold" asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>

          {/* Right: testimonial card */}
          <div className="md:w-3/5">
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="flex gap-6 items-start">
                {/* PLACEHOLDER: Replace with real testimonial photo */}
                <div className="w-24 h-28 rounded-xl bg-gray-200 flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300" />
                </div>
                <div>
                  <svg className="w-8 h-8 text-orange-200 mb-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-base text-gray-600 leading-relaxed mb-5">
                    We went from spending $2,000 per video to generating 50 variations for a fraction of the cost. The AI actors are incredibly realistic, and our ROAS improved 3x since switching.
                  </p>
                  <p className="text-base font-bold text-gray-900">Sarah K.</p>
                  <p className="text-base text-gray-500">DTC Brand Owner</p>
                </div>
              </div>

              {/* Dots for multiple testimonials */}
              <div className="flex justify-center gap-2 mt-6">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
