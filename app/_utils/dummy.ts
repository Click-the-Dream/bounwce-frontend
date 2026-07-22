import { FiShoppingCart } from "react-icons/fi";
import { GoPeople } from "react-icons/go";
import { AiOutlineBarChart } from "react-icons/ai";
import { TbCurrencyNaira } from "react-icons/tb";
import { Message } from "./types/buyer";
import { Event } from "./types/event";

export const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports" },
  { value: "books", label: "Books" },
];

export const availabilityOptions = [
  { value: "in-stock", label: "In Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
  { value: "pre-order", label: "Pre-Order" },
];

export // dummy data to display the vendor data cards
const vendorData = [
  {
    label: "Total Revenue",
    amount: `₦ ${"20,000"}`,
    icon: TbCurrencyNaira,
    analysis: "12.5% from last month",
    trendStatus: "up",
  },
  {
    label: "Total Orders",
    amount: "89",
    icon: FiShoppingCart,
    analysis: "8.2% from last month",
    trendStatus: "up",
  },
  {
    label: "Total Customers",
    amount: "76",
    icon: GoPeople,
    analysis: "15.3% from last month",
    trendStatus: "up",
  },
  {
    label: "Total Revenue",
    amount: "5,000",
    icon: AiOutlineBarChart,
    analysis: "2.5 % from last month",
    trendStatus: "down",
  },
];
export const orders = [
  {
    id: "#ORD-002",
    status: "Processing",
    tag: "Needs Review", // pink tag like screenshot
    customer: "Jane Doe",
    item: "Blue Cotton Jean",
    date: "Oct 27, 2025 • 11:55AM",
    action: { primary: "Review Products" },

    placedDate: "October 27, 2025",
    customerInfo: {
      name: "Jane Doe",
      phone: "08152161484",
      address: "Pepsi",
    },

    items: [
      {
        id: 1,
        name: "Leather Blue Jean",
        qty: 2,
        price: "₦3,000",
        total: "₦6,000",
        image:
          "https://images.pexels.com/photos/3756341/pexels-photo-3756341.jpeg",
      },
      {
        id: 2,
        name: "Red Polo Shirt",
        qty: 2,
        price: "₦2,000",
        total: "₦4,000",
        image:
          "https://images.pexels.com/photos/532588/pexels-photo-532588.jpeg",
      },
    ],

    summary: {
      subtotal: "₦10,000",
      shipping: "(Free)",
      total: "₦10,000",
    },

    timeline: [
      {
        id: 1,
        label: "Order Placed - Payment Verified",
        date: "Oct 27, 2025 • 11:55AM",
        completed: true,
      },
    ],
  },

  {
    id: "#ORD-002",
    status: "Processing",
    customer: "Jane Doe",
    item: "Blue Cotton Jean (3)",
    date: "Oct 27, 2025 • 11:55AM",
    action: { decline: true, primary: "Accept" },

    placedDate: "October 27, 2025",
    customerInfo: {
      name: "Jane Doe",
      phone: "08152161484",
      address: "Pepsi",
    },

    items: [
      {
        id: 1,
        name: "Leather Blue Jean",
        qty: 2,
        price: "₦3,000",
        total: "₦6,000",
        image:
          "https://images.pexels.com/photos/3756341/pexels-photo-3756341.jpeg",
      },
      {
        id: 2,
        name: "Red Polo Shirt",
        qty: 1,
        price: "₦2,000",
        total: "₦2,000",
        image:
          "https://images.pexels.com/photos/532588/pexels-photo-532588.jpeg",
      },
    ],

    summary: {
      subtotal: "₦8,000",
      shipping: "(Free)",
      total: "₦8,000",
    },

    timeline: [
      {
        id: 1,
        label: "Order Placed - Payment Verified",
        date: "Oct 27, 2025 • 11:55AM",
        completed: true,
      },
    ],
  },

  {
    id: "#ORD-002",
    status: "Shipped",
    customer: "Jane Doe",
    item: "Blue Cotton Jean (3)",
    date: "Oct 27, 2025 • 11:55AM",
    waiting: "Waiting for buyer’s confirmation",

    placedDate: "October 27, 2025",
    customerInfo: {
      name: "Jane Doe",
      phone: "08152161484",
      address: "Pepsi",
    },

    items: [
      {
        id: 1,
        name: "Blue Cotton Jean",
        qty: 3,
        price: "₦5,000",
        total: "₦15,000",
        image:
          "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg",
      },
    ],

    summary: {
      subtotal: "₦15,000",
      shipping: "(Free)",
      total: "₦15,000",
    },

    timeline: [
      {
        id: 1,
        label: "Order Placed - Payment Verified",
        date: "Oct 27, 2025 • 11:55AM",
        completed: true,
      },
      {
        id: 2,
        label: "Order Shipped",
        date: "Oct 28, 2025 • 09:20AM",
        completed: true,
      },
    ],
  },

  {
    id: "#ORD-002",
    status: "Completed",
    customer: "Jane Doe",
    item: "Blue Cotton Jean",
    date: "Oct 27, 2025 • 11:55AM",
    confirmed: true,

    placedDate: "October 27, 2025",
    customerInfo: {
      name: "Jane Doe",
      phone: "08152161484",
      address: "Pepsi",
    },

    items: [
      {
        id: 1,
        name: "Blue Cotton Jean",
        qty: 1,
        price: "₦5,000",
        total: "₦5,000",
        image:
          "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg",
      },
    ],

    summary: {
      subtotal: "₦5,000",
      shipping: "(Free)",
      total: "₦5,000",
    },

    timeline: [
      {
        id: 1,
        label: "Order Placed - Payment Verified",
        date: "Oct 27, 2025 • 11:55AM",
        completed: true,
      },
      {
        id: 2,
        label: "Order Shipped",
        date: "Oct 28, 2025 • 09:20AM",
        completed: true,
      },
      {
        id: 3,
        label: "Delivered & Completed",
        date: "Oct 30, 2025 • 02:15PM",
        completed: true,
      },
    ],
  },
  {
    id: "#ORD-002",
    status: "Ready for Shipment",
    customer: "Jane Doe",
    item: "Blue Cotton Jean (3)",
    date: "Oct 27, 2025 • 11:55AM",
    action: { primary: "Mark as Shipped" },

    placedDate: "October 27, 2025",
    customerInfo: {
      name: "Jane Doe",
      phone: "08152161484",
      address: "Pepsi",
    },

    items: [
      {
        id: 1,
        name: "Blue Cotton Jean",
        qty: 3,
        price: "₦5,000",
        total: "₦15,000",
        image:
          "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg",
      },
    ],

    summary: {
      subtotal: "₦15,000",
      shipping: "(Free)",
      total: "₦15,000",
    },

    timeline: [
      {
        id: 1,
        label: "Order Placed - Payment Verified",
        date: "Oct 27, 2025 • 11:55AM",
        completed: true,
      },
      {
        id: 2,
        label: "Packed & Ready for Shipment",
        date: "Oct 28, 2025 • 01:10PM",
        completed: true,
      },
    ],
  },
  {
    id: "#ORD-002",
    status: "Processing",
    customer: "Jane Doe",
    item: "Blue Cotton Jean",
    date: "Oct 27, 2025 • 11:55AM",
    action: { decline: true, primary: "Accept" },

    placedDate: "October 27, 2025",
    customerInfo: {
      name: "Jane Doe",
      phone: "08152161484",
      address: "Pepsi",
    },

    items: [
      {
        id: 1,
        name: "Blue Cotton Jean",
        qty: 1,
        price: "₦5,000",
        total: "₦5,000",
        image:
          "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg",
      },
    ],

    summary: {
      subtotal: "₦5,000",
      shipping: "(Free)",
      total: "₦5,000",
    },

    timeline: [
      {
        id: 1,
        label: "Order Placed - Payment Verified",
        date: "Oct 27, 2025 • 11:55AM",
        completed: true,
      },
    ],
  },
];

export const loadingSteps = [
  "Scanning nearby connections...",
  "Matching shared interests...",
  "Ranking best people for you...",
];

export const placeholders = [
  "Search people near you...",
  "Find designers, founders, creatives...",
  "Discover matches by interest...",
  "Explore nearby connections...",
];
