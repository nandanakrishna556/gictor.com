export function SocialProofBar() {
  const stats = [
    { value: "10,000+", label: "Videos Generated" },
    { value: "<3 min", label: "Average Generation Time" },
    { value: "30+", label: "Languages Supported" },
    { value: "50+", label: "AI Actors Available" },
  ];

  return (
    <section className="py-14 px-6 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-base text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
