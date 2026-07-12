export const PARTNER_DISCOVERY_CALL_URL =
  "https://restandrx.hbportal.co/schedule/68c5123d3cb4940021987caf";

export const EXPERT_CONTENT_RESOURCE_OPTIONS = [
  {
    value: "Quick Rx",
    label: "Quick Rx",
    description:
      "Short, swipeable portrait slides in the app — share tips, prompts, or visual guides as image cards members flip through one at a time.",
  },
  {
    value: "Audio",
    label: "Audio",
    description: "Guided audio, meditations, or podcasts for members to listen on the go.",
  },
  {
    value: "Video",
    label: "Video",
    description: "Video lessons, demos, or talks members can watch in the app.",
  },
  {
    value: "Article",
    label: "Article",
    description: "Written guides, checklists, or long-form resources members can read.",
  },
] as const;

export const EXPERT_CONTENT_RESOURCE_VALUES = EXPERT_CONTENT_RESOURCE_OPTIONS.map(
  (option) => option.value,
);

export const PARTNERSHIP_PATHWAYS = [
  {
    title: "App Partnerships",
    description:
      "Brands and businesses can be featured within the Rest & Rx™ app as recommended wellness resources for healthcare professionals. These listings range from complimentary community listings to featured placements with additional visibility.",
  },
  {
    title: "Wellness Box Partnerships",
    description:
      "Brands may participate in curated Rest & Rx™ wellness boxes sent directly to healthcare professionals. These opportunities range from gifting collaborations to paid featured placements or category exclusivity.",
  },
  {
    title: "Retreat and Experience Partnerships",
    description:
      "We are also partnering with select brands and wellness spaces for Rest & Rx™ semi-annual retreats and community wellness experiences. These partnerships can include gifting opportunities, sponsored experiences, or exclusive brand activations.",
  },
] as const;

export const APP_PARTNERSHIP_PRICING_NOTE =
  "Below are the current app partnership options we're offering (one-time cost for 6 months from the launch in July 2026–December 2026):";

export type AppDiscountTierDetail = {
  value: "complimentary" | "preferred" | "featured";
  label: string;
  summary: string;
  intro: string;
  includes: string[];
  note?: string;
};

export const APP_DISCOUNT_TIER_DETAILS: AppDiscountTierDetail[] = [
  {
    value: "complimentary",
    label: "Complimentary Rest & Rx™ Partner (+ $100 processing fee)",
    summary: "Free app inclusion for aligned community partners",
    intro:
      "This option is designed for aligned businesses who want to be recognized as a trusted community resource within the Rest & Rx™ ecosystem.",
    includes: [
      "Business listing within the Rest & Rx™ app as a recommended resource, offering a special discount, package, product, or invitation for healthcare workers",
      "Inclusion in a Rest & Rx™ community round up or directory feature via our social media channels",
      "Consideration for future collaborations and activations",
    ],
    note: "We can also list specific events your business may be hosting. If the event is free, then this would fall under the complimentary local partner tier. If the event is a paid event, we would love to offer our Rest & Rx users a discounted offer.",
  },
  {
    value: "preferred",
    label: "Preferred Rest & Rx™ Partner",
    summary: "Paid app inclusion with increased visibility and storytelling",
    intro: "Designed for businesses seeking more visibility and storytelling.",
    includes: [
      "Everything in the Complimentary Rest & Rx™ Partner tier, plus:",
      "Feature within a Rest & Rx™ wellness moment or curated highlight via our social media channels and our newsletter",
      "Custom call to action connecting healthcare workers directly to your business",
    ],
  },
  {
    value: "featured",
    label: "Featured Rest & Rx™ Partner",
    summary: "Paid app inclusion with the most visibility for your brand",
    intro:
      "This tier is for businesses looking for deeper visibility and priority positioning within the Rest & Rx™ community.",
    includes: [
      "Everything in the Preferred Rest & Rx™ Partner tier, plus:",
      "2 featured posts including a dedicated partnership post as detailed below:",
      "Dedicated collaboration post on Dr. Helene's Instagram (55k followers) and Rest & Rx™ Instagram with your business",
      "Dedicated post on Dr. Helene's TikTok (70k followers with 9.1% average engagement rate) and Rest & Rx™ TikTok with your business",
      "Priority placement within Rest & Rx™ content and highlights on the app, newsletter, and digital posts",
      "Priority consideration for in person activations and future community events",
    ],
  },
];
