export type Page =
  | "overview"
  | "users"
  | "vendors"
  | "stores"
  | "orders"
  | "settings";
export type UserStatus = "active" | "pending" | "suspended" | "banned";
export type VendorStatus = "verified" | "pending" | "suspended" | "rejected";
export type StoreStatus = "active" | "pending" | "inactive";
export type OrderStatus =
  | "delivered"
  | "processing"
  | "cancelled"
  | "refunded"
  | "shipped";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: UserStatus;
  initials: string;
  joined: string;
  orders: number;
  spent: number;
}
export interface Vendor {
  id: string;
  name: string;
  email: string;
  category: string;
  status: VendorStatus;
  stores: number;
  revenue: number;
  initials: string;
  joined: string;
  rating: number;
}
export interface Store {
  id: string;
  name: string;
  vendor: string;
  location: string;
  products: number;
  status: StoreStatus;
  revenue: number;
  created: string;
  rating: number;
}
export interface Order {
  id: string;
  customer: string;
  store: string;
  vendor: string;
  amount: number;
  status: OrderStatus;
  items: number;
  date: string;
}
