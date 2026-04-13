const testimonials = [
  {
    quote: "We went from spending $2,000 per video to generating 50 variations for a fraction of the cost. Game changer for our ad testing.",
    name: "Sarah K.",
    role: "DTC Brand Owner",
    avatar: null,
  },
  {
    quote: "The AI actors are scarily realistic. Our clients can't tell the difference, and our ROAS has improved 3x since switching.",
    name: "Mark T.",
    role: "Performance Marketing Agency",
    avatar: null,
  },
  {
    quote: "I cloned myself and now my AI twin posts content daily while I focus on strategy. Best investment I've made as a creator.",
    name: "Priya R.",
    role: "Content Creator, 500K followers",
    avatar: null,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-orange-600 font-semibold text-sm mb-3 tracking-widest uppercase">
            Testimonials
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5">
            Loved by Brands and Creators
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-base text-gray-600 leading-relaxed mb-8 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                {/* PLACEHOLDER: Replace with real avatar images */}
                <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-base">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
