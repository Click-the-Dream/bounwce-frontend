export interface CartProductImage {
  url: string;
}

export interface CartProduct {
  cartId: string | number;
  id: string | number;
  name: string;
  amount: number;
  quantity: number;
  status?: "saved" | "active";
  images: CartProductImage[];
}

export interface Cart {
  storeName: string;
  items: CartProduct[];
}

export interface CartItemProps {
  cart: Cart;
  openItem: string | number | null;
  toggleItem: (cartId: string | number) => void;
  saveForLater: (cartId: string | number) => void;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  rating: number;
  amount: number;
  images: { url: string }[];
}
