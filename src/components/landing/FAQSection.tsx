import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What languages and accents are supported?",
    answer:
      "We support 29+ languages including English, Spanish, French, German, Portuguese, and more. Each language offers multiple accent options and voice styles to match your target audience perfectly.",
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
    question: "Can I use these videos anywhere?",
    answer:
      "Yes. Download your videos in standard formats and use them anywhere — Meta Ads, TikTok, YouTube, email campaigns, landing pages, or your website. No restrictions on where you publish.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 px-6">
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
