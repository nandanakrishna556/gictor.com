const steps = [
  {
    number: "Step 1",
    title: "Select an Actor",
    description:
      "Choose from our library of realistic AI actors or generate a custom one from scratch. You can even clone your own face and voice.",
    placeholder: "actor-selector",
  },
  {
    number: "Step 2",
    title: "Write Your Script",
    description:
      "Enter your own script or let AI generate a high-converting ad script tailored to your product and audience.",
    placeholder: "script-editor",
  },
  {
    number: "Step 3",
    title: "Generate Your Video",
    description:
      "Bring it all to life with stunning, realistic talking head ads in minutes. Download and launch across any platform.",
    placeholder: "video-generation",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 px-6 bg-blue-50/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5">
            AI Video Ads in 3 Steps
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            From idea to lifelike video, Gictor makes the process effortless, fast, and unbelievably real.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                {step.number}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-base text-gray-500 leading-relaxed mb-8">{step.description}</p>
              
              {/* PLACEHOLDER: Replace with actual screenshot/GIF/video */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 aspect-[4/3] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 mx-auto mb-3" />
                  <p className="text-sm font-medium">Preview placeholder</p>
                  <p className="text-xs text-gray-400 mt-1">Add screenshot or GIF here</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
