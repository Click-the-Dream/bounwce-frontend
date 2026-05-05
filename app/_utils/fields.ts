import { IoColorPaletteOutline, IoRocketOutline } from "react-icons/io5";
import { BsBox, BsTruck } from "react-icons/bs";
import {
  FaXTwitter,
  FaInstagram,
  FaTiktok,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa6";

export const brandingSteps = [
  {
    icon: IoColorPaletteOutline,
    key: "branding",
    label: "Branding",
    desc: "Business details & verification",
    fields: ["store_description", "store_logo", "store_banner"],
  },
  {
    icon: BsBox,
    key: "products",
    label: "Products",
    desc: "Add your first product or service",
    fields: ["products"],
  },
  {
    icon: BsTruck,
    key: "shipping",
    label: "Shipping",
    desc: "Set up delivery options",
    fields: ["shipping"],
  },
  {
    icon: IoRocketOutline,
    key: "publish",
    label: "Publish",
    desc: "Make your catalogue live",
  },
];

export const onboardingTree = {
  2: {
    // Main tabs under step 2
    store: ["store_info"],
    contact: ["contact_info"],
    verification: ["id_verification"],
    payout: ["payout_info"],
  },
  3: {
    // Inner sub-steps under GettingStarted
    branding: ["branding_info"],
    products: ["products_info"],
    shipping: ["shipment_info"],
    publish: ["publish_info"],
  },
  4: {
    // Step 4 is just success
    success: [],
  },
};

export const socialLinks = [
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@bouwnceofficial?_r=1&_t=ZS-94bAoiIcJv7",
    icon: FaTiktok,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/bouwnceofficial?igsh=MXQzdmN6cTNvcThvaQ==",
    icon: FaInstagram,
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/bouwnce-official/",
    icon: FaLinkedinIn,
  },
  {
    name: "X (Twitter)",
    url: "https://x.com/bouwnceofficial?s=21",
    icon: FaXTwitter,
  },
  // {
  //   name: "YouTube",
  //   url: "https://youtube.com/@bouwnceofficial?",
  //   icon: FaYoutube,
  // },
];

export const navLinks = [
  { name: "Stores", path: "/stores" },
  { name: "Marketplace", path: "/marketplace" },
];

export const referralOptions = [
  { label: "LinkedIn", value: "linkedin" },
  { label: "TikTok", value: "tiktok" },
  { label: "Instagram", value: "instagram" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Friend / Referral", value: "referral" },
  { label: "Google Search", value: "google" },
  { label: "Other", value: "other" },
];
