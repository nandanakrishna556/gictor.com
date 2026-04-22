import LegalPageLayout from "@/components/marketing/LegalPageLayout";

export default function Privacy() {
  return (
    <LegalPageLayout
      pageTitle="Privacy Policy — Gictor"
      pageDescription="How Gictor collects, uses, and protects your personal information. Plain-language privacy policy with your rights and our practices."
      eyebrow="Privacy Policy"
      eyebrowEmoji="🔒"
      title="We take your privacy seriously."
      subtitle="Plain-language breakdown of what we collect, why we collect it, and how you stay in control."
      lastUpdated="April 22, 2026"
      contactEmail="privacy@gictor.com"
      intro={`This Privacy Policy applies to Gictor Inc. ("Gictor", "we", "us", or "our") and describes how we handle personal information when you use our website at gictor.com and our AI video generation platform (together, the "Service"). By using the Service, you agree to the practices described here. If you do not agree, please stop using the Service and contact us to delete your account.`}
      sections={[
        {
          id: "information-we-collect",
          emoji: "📋",
          title: "Information We Collect",
          body: [
            "We collect information in three ways: information you give us directly, information generated automatically when you use the Service, and information from third parties.",
            "**Information you provide:** When you create an account we collect your name, email address, and a hashed password. If you subscribe to a paid plan we collect billing details (processed by Stripe, we never store raw card numbers). When you submit a support request we collect the content of your message.",
            "**Information generated automatically:** When you use the Service, our servers record your IP address, browser type and version, operating system, referring URL, pages visited, time spent on pages, and feature interactions. We also store the prompts, scripts, and generated video assets you create inside the platform.",
            "**Information from third parties:** If you sign in with Google or another OAuth provider, we receive your name, email address, and profile photo from that provider. We do not receive your password.",
          ],
        },
        {
          id: "how-we-use-it",
          emoji: "⚙️",
          title: "How We Use Your Information",
          body: [
            "We use the information we collect to:",
            { ul: [
              "Create and manage your account and authenticate your sessions",
              "Deliver, operate, and improve the Service",
              "Process payments and send billing-related communications",
              "Send transactional emails (receipts, password resets, usage alerts)",
              "Send optional product newsletters and marketing emails (you can unsubscribe at any time)",
              "Detect and prevent fraud, abuse, and security incidents",
              "Comply with legal obligations",
              "Aggregate and anonymize usage data to improve our AI models and product",
            ] },
            "We do not sell your personal information to any third party, ever.",
          ],
        },
        {
          id: "sharing",
          emoji: "🔗",
          title: "How We Share Your Information",
          body: [
            "We share your information only in the following limited circumstances:",
            "**Service providers:** We work with vendors who help us operate the platform, including cloud infrastructure (AWS), payment processing (Stripe), email delivery (Resend), error monitoring (Sentry), and analytics (PostHog). These vendors are contractually bound to use your data only to provide services to us.",
            "**Legal requirements:** We may disclose information if required by law, subpoena, or other legal process, or if we believe in good faith that disclosure is necessary to protect the rights, property, or safety of Gictor, our users, or the public.",
            "**Business transfers:** If Gictor is acquired, merges with another company, or sells substantially all of its assets, your information may be transferred as part of that transaction. We will notify you by email or prominent notice on our website before your information is transferred under a different privacy policy.",
            "**With your consent:** We share your information for any other purpose with your explicit consent.",
          ],
        },
        {
          id: "cookies",
          emoji: "🍪",
          title: "Cookies and Tracking",
          body: [
            "We use cookies and similar technologies to keep you signed in, remember your preferences, and understand how people use the Service.",
            `**Essential cookies** are required for the Service to function (authentication tokens, CSRF protection). These cannot be disabled.`,
            `**Analytics cookies** help us understand which features are used and how we can improve. We use PostHog for self-hosted, privacy-friendly analytics. You can opt out of analytics cookies in your account settings or by enabling "Do Not Track" in your browser.`,
            "**Marketing cookies** allow us to measure the effectiveness of our advertising. These are only set if you visit our website via an ad campaign. You can opt out at any time via the cookie preferences link in the footer.",
            "Most browsers allow you to refuse or delete cookies. Doing so may affect your ability to use certain features of the Service.",
          ],
        },
        {
          id: "data-retention",
          emoji: "🗄️",
          title: "Data Retention",
          body: [
            "We retain your account information and content for as long as your account is active, plus a 90-day grace period after deletion to allow for accidental recovery requests.",
            "After the grace period, we permanently delete your personal information from our production systems within 30 days. Anonymized, aggregated data (e.g. platform usage statistics) may be retained indefinitely.",
            "Billing records are retained for 7 years to comply with tax and accounting regulations, even after account deletion.",
            "You can request early deletion of your data at any time by emailing privacy@gictor.com. We will confirm the deletion within 10 business days.",
          ],
        },
        {
          id: "security",
          emoji: "🛡️",
          title: "Security",
          body: [
            "We use industry-standard security measures to protect your information, including:",
            { ul: [
              "TLS encryption for all data in transit",
              "AES-256 encryption for sensitive data at rest",
              "SOC 2 Type II compliant infrastructure",
              "Role-based access controls limiting employee access to production data",
              "Regular penetration testing and vulnerability scanning",
            ] },
            "Despite these measures, no system is 100% secure. If you believe your account has been compromised, contact us immediately at security@gictor.com.",
            "We will notify affected users within 72 hours of becoming aware of a data breach that poses a risk to their rights or freedoms, in accordance with applicable law.",
          ],
        },
        {
          id: "your-rights",
          emoji: "✅",
          title: "Your Rights",
          body: [
            "Depending on where you live, you may have the following rights regarding your personal information:",
            "**Access:** Request a copy of the personal information we hold about you.",
            "**Correction:** Request that we correct inaccurate or incomplete information.",
            "**Deletion:** Request that we delete your personal information, subject to legal retention requirements.",
            "**Portability:** Request a machine-readable export of your data.",
            "**Objection / Restriction:** Object to or request restriction of certain processing activities, including direct marketing.",
            "**Withdraw consent:** Where we rely on your consent to process data, you can withdraw that consent at any time.",
            `To exercise any of these rights, email privacy@gictor.com with the subject line "Privacy Request". We will respond within 30 days. We will need to verify your identity before acting on requests.`,
            "If you are located in the European Economic Area, you also have the right to lodge a complaint with your local data protection authority.",
          ],
        },
        {
          id: "international",
          emoji: "🌍",
          title: "International Transfers",
          body: [
            "Gictor is based in the United States. If you access the Service from outside the US, your information will be transferred to and processed in the US, where data protection laws may differ from those in your country.",
            "For transfers from the European Economic Area, United Kingdom, or Switzerland, we rely on Standard Contractual Clauses approved by the European Commission to ensure your data receives adequate protection.",
          ],
        },
        {
          id: "children",
          emoji: "👶",
          title: "Children's Privacy",
          body: [
            "The Service is intended for users who are at least 18 years old. We do not knowingly collect personal information from anyone under 18. If you believe we have inadvertently collected information from a minor, please contact privacy@gictor.com and we will delete it promptly.",
          ],
        },
        {
          id: "changes",
          emoji: "📝",
          title: "Changes to This Policy",
          body: [
            `We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email (sent to the address on your account) and update the "Last updated" date at the top of this page at least 14 days before the changes take effect.`,
            "Your continued use of the Service after the effective date of an updated policy constitutes your acceptance of the changes. If you do not agree with the changes, you must stop using the Service before they take effect.",
          ],
        },
      ]}
    />
  );
}
