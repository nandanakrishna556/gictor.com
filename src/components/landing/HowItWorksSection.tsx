const steps = [
  {
    number: "Step 1",
    title: "Choose Your Actor",
    description:
      "Pick from our library or generate a custom AI actor from scratch. You can even clone your own face and voice.",
  },
  {
    number: "Step 2",
    title: "Write Your Script",
    description:
      "Enter your own script or let AI generate a high-converting ad script tailored to your product and audience.",
  },
  {
    number: "Step 3",
    title: "Generate Your Video",
    description:
      "Bring it all to life with realistic lip-synced talking head video ads, ready to launch in minutes.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 px-6">
      <div className="max-w-6xl mx-auto bg-orange-50/60 rounded-[32px] py-20 px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-5">
            Video ads in 3 steps
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
            From idea to lifelike video, Gictor makes the process effortless,
            fast, and unbelievably real.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold mb-6">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-base text-gray-600 leading-relaxed mb-6">{step.description}</p>
              
              {/* PLACEHOLDER: Replace with actual screenshot/GIF */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 aspect-[4/3] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 mx-auto mb-3" />
                  <p className="text-base font-medium">Preview placeholder</p>
                  <p className="text-sm text-gray-400 mt-1">Add screenshot or GIF here</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
