const BRANDS = [
  "Lumen", "Aperture", "Flowstack", "Northpoint", "Helix", "Orbit",
  "Parallel", "Meridian", "Echo", "Vertex", "Prism", "Quantum",
];

export default function SocialProofBar() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <section className="relative border-y border-gray-100 bg-white py-10">
      <div className="container-page">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Trusted by 2,400+ brands shipping ads every week
        </p>
      </div>
      <div className="relative mt-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
        <div className="flex w-max animate-marquee gap-12 px-6">
          {row.map((b, i) => (
            <span
              key={`${b}-${i}`}
              className="select-none text-2xl font-black tracking-tight text-gray-300 md:text-[28px]"
              style={{ fontFamily: "Inter, sans-serif", letterSpacing: "-0.04em" }}
            >
              {b.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
