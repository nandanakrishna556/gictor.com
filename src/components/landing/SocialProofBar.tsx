export function SocialProofBar() {
  const stats = [
    { value: "10,000+", label: "Videos Generated" },
    { value: "2.5 min", label: "Average Generation Time" },
    { value: "30+", label: "Languages Supported" },
  ];

  return (
    <section className="py-16 px-6 bg-white border-y border-gray-200">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-8 md:gap-16">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-none mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium text-lg">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
