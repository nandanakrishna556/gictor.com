import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do the AI videos look realistic?",
    answer:
      "Yes. Our lip-sync technology produces natural results that are indistinguishable from traditionally filmed content. The best test? Watch our demo video above — that's AI-generated.",
  },
  {
    question: "Can people tell it's AI?",
    answer:
      "Your audience isn't running forensics on your ads. They're scrolling, and something either stops them or it doesn't. What matters is whether your message resonates — and that's what Gictor helps you test and perfect.",
  },
  {
    question: "Can I clone myself or use my own face?",
    answer:
      "Absolutely. Upload a photo and voice sample to create an AI version of yourself. Use it across unlimited videos. Many founders use this to scale their personal brand without being on camera every day.",
  },
  {
    question: "What if I already have scripts?",
    answer:
      "You can paste your own scripts for free. Use the AI humanizer to make any script sound more natural, or skip it entirely and go straight to video generation.",
  },
  {
    question: "How fast is video generation?",
    answer:
      "Most videos are ready in 2-5 minutes. Scripts generate in seconds. You can go from idea to testable video in under 10 minutes.",
  },
  {
    question: "Do I own the content I create?",
    answer:
      "Yes. Everything you generate is yours to use commercially however you want. No licensing restrictions, no usage fees, no surprises.",
  },
  {
    question: "What if I want to use real creators too?",
    answer:
      "Perfect strategy. Use Gictor to test messages and find winners. Once you know what converts, film it with real creators if that's what your brand needs. You'll walk into that shoot knowing exactly what works.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-lg mb-4 tracking-wide uppercase">FAQ</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Questions & Answers
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-xl px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline text-lg py-5 font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
