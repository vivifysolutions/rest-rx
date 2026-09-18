export const LEGAL_LAST_UPDATED = "September 3, 2026";

export const LEGAL_ENTITY = "Rest & Rx, LLC";
export const SUPPORT_EMAIL = "support@restandrx.com";
export const SITE_ORIGIN = "https://restandrx.com";
export const ACCOUNT_DELETION_PATH = "/delete-account";
export const ACCOUNT_DELETION_URL = `${SITE_ORIGIN}${ACCOUNT_DELETION_PATH}`;
export const PRIVACY_URL = `${SITE_ORIGIN}/privacy`;
export const TERMS_URL = `${SITE_ORIGIN}/terms`;
export const COMMUNITY_GUIDELINES_URL = `${SITE_ORIGIN}/community-guidelines`;

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export const PRIVACY_POLICY = {
  title: "Privacy Policy",
  summary:
    "How Rest & Rx collects, uses, and protects information for healthcare professionals and students using our wellness app and website.",
  meta: {
    legalEntity: LEGAL_ENTITY,
    website: "restandrx.com",
    contact: SUPPORT_EMAIL,
  },
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        `Rest & Rx is a physician-founded wellness community for adult healthcare professionals and students, operated by ${LEGAL_ENTITY} (“we,” “us”). This policy covers restandrx.com, the Rest & Rx mobile app, and related services. It describes what the product actually collects and how that information is used.`,
      ],
    },
    {
      heading: "2. Information we collect",
      paragraphs: [
        "We collect the information needed to run your account, verify healthcare affiliation, personalize wellness content, and keep the community safe.",
      ],
      bullets: [
        "Account: name, email, password (stored by Firebase Authentication), and optional profile photo",
        "Contact and professional details: phone number, professional role, specialty, and National Provider Identifier (NPI) when your role requires or you choose to provide it",
        "Healthcare verification: a work-credential photo (for example a badge) and an identity photo you upload for affiliation review, plus camera or photo-library access if you take or choose that photo in the app",
        "Profile preferences: affirmations, self-care interests, wellness goals, and optional spiritual-content setting",
        "Health and fitness information you choose to log: wellness check-ins, including mood, sleep quality, self-care actions, optional written reflections, and goal or habit progress",
        "Community content: posts, comments, group membership, suggestion-box notes, and reports you submit",
        "Location, when you allow it, to surface nearby events, discounts, and offerings (when the app is in use)",
        "Device and diagnostics: crash logs and performance data via Sentry, and product-interaction analytics via Firebase Analytics / Google Analytics",
        "Push notification tokens if you enable notifications",
      ],
    },
    {
      heading: "3. How we use information",
      paragraphs: [
        "We use this information to operate your account, review healthcare-affiliation applications, show discounts, events, retreats, and resources, run community features, send the notifications you opted into, moderate reports, prevent abuse, and improve the product.",
        "Rest & Rx is a wellness and community tool. It is not a medical device, not a HIPAA covered entity, and does not provide diagnosis, treatment, or clinical care. Wellness check-ins are not a medical record.",
      ],
    },
    {
      heading: "4. Health and fitness information",
      paragraphs: [
        "Mood, sleep, self-care actions, reflections, and goal check-ins are health and fitness information you voluntarily create. We use them only to show you your own history, personalize wellness content, and operate features you choose (such as streaks or shared goals). We do not sell this information, do not use it for cross-context advertising, and do not send it to Apple Health, HealthKit, or Android Health Connect.",
      ],
    },
    {
      heading: "5. Verification photos and identifiers",
      paragraphs: [
        "Identity photos, work-credential photos, and NPI numbers are used only to review healthcare affiliation. They are not shown as a public profile gallery. We do not use facial recognition or other biometric identifiers. We may retain verification materials for a limited time after a decision for security, fraud prevention, or legal reasons.",
      ],
    },
    {
      heading: "6. Sharing",
      paragraphs: [
        "We do not sell your personal information. We do not share it for cross-context behavioral advertising. We share data with service providers that help us run the product, under instructions from us:",
      ],
      bullets: [
        "Google Firebase — authentication, cloud storage for photos you upload, cloud messaging / push notifications, and analytics",
        "Sentry — crash and diagnostic reporting",
        "Hosting, email, and similar infrastructure vendors needed to operate the website and API",
      ],
    },
    {
      heading: "7. Analytics, cookies, and tracking",
      paragraphs: [
        "The website may use cookies or similar technologies to keep you signed in and understand basic usage. You can control cookies in your browser.",
        "On iOS, we may ask for permission under Apple’s App Tracking Transparency framework so we can measure product usage with Firebase Analytics. If you decline, the app still works and we do not collect that analytics. Crash reports and the features you use still operate. We do not use your information to show third-party ads or to track you across other companies’ apps for advertising.",
      ],
    },
    {
      heading: "8. Retention and deletion",
      paragraphs: [
        `You can delete your account in the app under Profile → Delete Account, or on the web at ${ACCOUNT_DELETION_URL}. Sign in on that page with the same email and password you use in the app. Deletion removes your account record and associated personal data from our primary systems, including community posts where we can unlink them, subject to limited retention needed for security, abuse prevention, or law.`,
        `If you cannot sign in, email ${SUPPORT_EMAIL} from the address on the account and ask us to delete it.`,
      ],
    },
    {
      heading: "9. Your rights",
      paragraphs: [
        `Depending on where you live, you may have rights to access, correct, or delete personal information, or to object to certain processing. Contact ${SUPPORT_EMAIL}. We process information in the United States.`,
        "California residents may email that address for CCPA/CPRA requests, including the right to know, delete, correct, and not be discriminated against for exercising those rights. We do not sell or share personal information for cross-context advertising. If that ever changes, we will update this policy and provide the required opt-out first.",
      ],
    },
    {
      heading: "10. Children",
      paragraphs: [
        "Rest & Rx is for adults 18 and older. It is not directed to children, and we do not knowingly collect personal information from anyone under 18. If you believe a minor has created an account, contact us and we will delete it.",
      ],
    },
    {
      heading: "11. Changes and contact",
      paragraphs: [
        `We may update this policy and will revise the “Last updated” date. Material changes will be posted on this page. Questions: ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
};

export const TERMS_OF_SERVICE = {
  title: "Terms of Use",
  summary: `The agreement between you and ${LEGAL_ENTITY}.`,
  meta: {
    legalEntity: LEGAL_ENTITY,
    website: "restandrx.com",
    contact: SUPPORT_EMAIL,
  },
  sections: [
    {
      heading: "1. Using Rest & Rx",
      paragraphs: [
        `By creating an account or using the app or website, you agree to these Terms, our Privacy Policy, and our Community Guidelines. Rest & Rx, operated by ${LEGAL_ENTITY}, provides wellness content, community, events, and partner discounts for healthcare professionals and students. If you do not agree, do not use the service.`,
      ],
    },
    {
      heading: "2. Accounts and eligibility",
      paragraphs: [
        "You must be 18 or older. The app is not available to anyone under 18. Some features require a reviewed healthcare-affiliation application. You are responsible for your login credentials and for the accuracy of information you submit, including professional details and verification photos.",
        `You may delete your account at any time in the app under Profile → Delete Account, on the web at ${ACCOUNT_DELETION_URL}, or by emailing ${SUPPORT_EMAIL}.`,
      ],
    },
    {
      heading: "3. Not medical care",
      paragraphs: [
        "Rest & Rx is not medical care, therapy, emergency services, or a substitute for a licensed clinician. Content, check-ins, affirmations, and resources are for general wellness and community support only. If you are in crisis, contact emergency services or the Suicide & Crisis Lifeline at 988.",
      ],
    },
    {
      heading: "4. Community and content",
      paragraphs: [
        `You keep ownership of content you post and grant ${LEGAL_ENTITY} a license to host and display it to operate the service. Do not post illegal, harassing, hateful, or sexual content, or confidential patient information. We may remove content or suspend accounts that violate these Terms or the Community Guidelines.`,
        `The app includes user-generated posts and comments. You can report objectionable content from the app. Our team reviews reports and aims to act promptly. Published contact for safety and support: ${SUPPORT_EMAIL}.`,
      ],
    },
    {
      heading: "5. Partner offers",
      paragraphs: [
        "Discounts, events, and retreats may be offered by third parties. Booking and payment, if any, happen with that partner, not inside Rest & Rx, unless we clearly say otherwise. We are not responsible for a partner’s products, services, or policies.",
      ],
    },
    {
      heading: "6. Disclaimer and liability",
      paragraphs: [
        `The service is provided “as is.” To the maximum extent permitted by law, ${LEGAL_ENTITY} is not liable for indirect or consequential damages, or for the acts of other users or partners. Our aggregate liability will not exceed one hundred U.S. dollars (US$100).`,
      ],
    },
    {
      heading: "7. Changes and contact",
      paragraphs: [
        `We may update these Terms and will revise the “Last updated” date. Continued use means you accept the updated Terms. Questions: ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
};

export const COMMUNITY_GUIDELINES = {
  title: "Community Guidelines",
  summary:
    "Standards for using Rest & Rx community features — aligned with our Terms of Use and store safety requirements for user-generated content.",
  meta: {
    legalEntity: LEGAL_ENTITY,
    website: "restandrx.com",
    contact: SUPPORT_EMAIL,
  },
  sections: [
    {
      heading: "Who this space is for",
      paragraphs: [
        "Rest & Rx is for adult healthcare professionals and students (18+). Keep the space supportive of people who work in healthcare.",
      ],
    },
    {
      heading: "Be respectful",
      paragraphs: [
        "No harassment, hate speech, threats, or targeted attacks. Disagree without demeaning others.",
      ],
    },
    {
      heading: "Protect patients and privacy",
      paragraphs: [
        "Do not post confidential patient information, identifiable clinical details, or anything that would violate professional privacy duties.",
      ],
    },
    {
      heading: "No prohibited content",
      paragraphs: [
        "Don’t post pornography, sexual services, scams, illegal activity, or content that exploits or endangers anyone. The platform is for adults 18 and older.",
      ],
    },
    {
      heading: "Report content",
      paragraphs: [
        "Use Report on posts and comments that violate these guidelines. Bad-faith or malicious reports intended to harass other members are themselves a violation.",
        `Our team reviews reports and may remove content or suspend accounts. Contact: ${SUPPORT_EMAIL}.`,
      ],
    },
  ],
};
