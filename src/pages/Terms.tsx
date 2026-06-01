import LegalPageLayout from "@/components/marketing/LegalPageLayout";

export default function Terms() {
  return (
    <LegalPageLayout
      pageTitle="Terms of Service — Gictor"
      pageDescription="The fair-use ground rules for using Gictor. Read once, know your rights, and get back to shipping."
      eyebrow="Terms of Service"
      eyebrowEmoji="📜"
      title="The fair-use ground rules."
      subtitle="Plain terms for using Gictor. Read once, know your rights, and get back to shipping."
      lastUpdated="April 22, 2026"
      contactEmail="legal@gictor.com"
      intro={`These Terms of Service ("Terms") govern your access to and use of the Gictor platform operated by Gictor Inc. ("Gictor", "we", "us"). By creating an account, accessing, or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.`}
      sections={[
        {
          id: "eligibility",
          emoji: "✅",
          title: "Eligibility",
          body: [
            "You must be at least 18 years old and legally able to enter into contracts to use Gictor. If you are using the Service on behalf of a company, you represent that you have authority to bind that company to these Terms.",
            "You agree to provide accurate, current information when creating your account and to keep it up to date. You are responsible for safeguarding your password and for all activity under your account.",
          ],
        },
        {
          id: "account",
          emoji: "👤",
          title: "Accounts and Subscriptions",
          body: [
            "Creating an account is free. Some features require a paid subscription. Subscription fees are billed in advance on a monthly basis and are non-refundable except as required by law or as explicitly stated in these Terms.",
            "You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. We do not prorate refunds for partial billing periods.",
            "We may change subscription pricing with at least 30 days' notice. Changes apply to your next renewal period.",
          ],
        },
        {
          id: "acceptable-use",
          emoji: "🚫",
          title: "Acceptable Use",
          body: [
            "You agree not to use the Service to:",
            { ul: [
              "Generate content that is unlawful, defamatory, harassing, or violates the rights of others",
              "Create deepfakes or impersonate real people without their explicit consent",
              "Generate sexual content involving minors or non-consensual sexual content of any person",
              "Produce content promoting violence, self-harm, terrorism, or illegal activity",
              "Spread misinformation, election interference, or fraudulent material",
              "Infringe on copyrights, trademarks, or other intellectual property",
              "Attempt to reverse-engineer the Service, scrape data, or circumvent usage limits",
              "Use the Service to build a competing AI video product",
            ] },
            "Violating these rules may result in immediate account suspension without refund. We reserve the right to remove offending content and cooperate with law enforcement where required.",
          ],
        },
        {
          id: "content-ownership",
          emoji: "🎬",
          title: "Content Ownership and License",
          body: [
            "**Your content:** You retain full ownership of the scripts, assets, and generated videos you create using Gictor, subject to the licenses you grant us below.",
            "**License to us:** You grant Gictor a worldwide, non-exclusive, royalty-free license to host, store, transmit, and display your content solely to operate and improve the Service. This license ends when you delete the content or your account.",
            "**Commercial use:** Videos you generate on a paid plan can be used commercially, including in paid ad campaigns. Free-plan videos include a small Gictor watermark and may not be used for paid advertising.",
            "**Our IP:** Gictor, the platform, templates, AI models, and branding remain our exclusive property. These Terms do not transfer any ownership of our IP to you.",
          ],
        },
        {
          id: "ai-likeness",
          emoji: "🎭",
          title: "AI Actors and Likeness Rights",
          body: [
            "When you clone a face or voice, you warrant that you have the full legal right to do so — either the likeness is your own, or you have a signed release from the person whose likeness you are using.",
            "You are solely responsible for any claims arising from unauthorized use of another person's likeness. Gictor will remove cloned creators promptly upon a verified takedown request from the affected person.",
            "Our stock AI actors are licensed for use within the Service. You may not extract, redistribute, or repurpose stock actor models outside of your Gictor-generated videos.",
          ],
        },
        {
          id: "payments",
          emoji: "💳",
          title: "Payments and Credits",
          body: [
            "Subscription fees and credit purchases are processed by Stripe. By providing payment information you authorize us (and Stripe) to charge that payment method for all fees owed.",
            "Credits purchased do not expire as long as your account is active. Unused credits are non-refundable and non-transferable between accounts.",
            "Failed payments may result in suspended access. You have 14 days to update your payment method before your data becomes subject to the deletion policy.",
          ],
        },
        {
          id: "termination",
          emoji: "🛑",
          title: "Suspension and Termination",
          body: [
            "We may suspend or terminate your account at any time, with or without notice, if you violate these Terms, if required by law, or if continued provision of the Service to you poses a material risk to us or other users.",
            "You may terminate your account at any time from the account settings. Upon termination, we will delete your data in accordance with our Privacy Policy.",
            "Provisions of these Terms that by their nature should survive termination (ownership, disclaimers, limitation of liability, indemnification, governing law) will survive.",
          ],
        },
        {
          id: "disclaimers",
          emoji: "⚠️",
          title: "Disclaimers",
          body: [
            `The Service is provided "as is" and "as available" without warranty of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that AI-generated outputs will be accurate, non-infringing, or fit for any particular purpose.`,
            "You use the Service at your own risk. You are solely responsible for reviewing AI-generated content before publishing or distributing it.",
          ],
        },
        {
          id: "liability",
          emoji: "⚖️",
          title: "Limitation of Liability",
          body: [
            "To the maximum extent permitted by law, Gictor and its officers, employees, and affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, revenue, data, or goodwill.",
            "Our total aggregate liability arising out of or relating to these Terms or the Service will not exceed the greater of (a) the amount you paid us in the twelve months preceding the claim or (b) one hundred US dollars ($100).",
          ],
        },
        {
          id: "indemnity",
          emoji: "🛡️",
          title: "Indemnification",
          body: [
            "You agree to defend, indemnify, and hold harmless Gictor from any claims, damages, losses, liabilities, and expenses (including attorneys' fees) arising from: (a) your use of the Service; (b) your content; (c) your violation of these Terms; or (d) your violation of any third-party right, including likeness, privacy, or IP rights.",
          ],
        },
        {
          id: "governing-law",
          emoji: "⚒️",
          title: "Governing Law and Disputes",
          body: [
            "These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles.",
            "Any dispute arising out of or relating to these Terms or the Service will be resolved by binding arbitration in Wilmington, Delaware, under the rules of the American Arbitration Association, except that either party may seek injunctive relief in court for IP or confidentiality claims.",
            "You waive the right to participate in a class action or class-wide arbitration.",
          ],
        },
        {
          id: "changes",
          emoji: "📝",
          title: "Changes to These Terms",
          body: [
            `We may modify these Terms from time to time. If changes are material, we will notify you by email and update the "Last updated" date above at least 14 days before they take effect.`,
            "Continued use of the Service after the effective date constitutes acceptance. If you do not agree, stop using the Service before the changes take effect.",
          ],
        },
        {
          id: "contact",
          emoji: "✉️",
          title: "Contact",
          body: [
            "Questions about these Terms? Email us at legal@gictor.com or write to: Gictor Inc., 2261 Market Street #4000, San Francisco, CA 94114, USA.",
          ],
        },
      ]}
    />
  );
}
