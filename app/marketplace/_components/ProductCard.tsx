"use client";
import { FaStar } from "react-icons/fa6";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import useCart from "@/app/hooks/use-cart";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/app/_utils/formatters";
import AuthModal from "@/app/_components/AuthModal";
import ProductImageDisplay from "./ProductImageDisplay";
import { useMarketStore } from "@/app/context/StoreContext";

const ProductCard = ({
  product,
}: {
  product: {
    id: number;
    name: string;
    category: string;
    rating: number;
    amount: number;
    images: { url: string }[];
  };
}) => {
  const { authDetails } = useAuth();
  const { carts } = useMarketStore();
  const { addToCart, removeFromCart } = useCart();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Check if user is authenticated
  const isAuthenticated = !!authDetails?.access_token;

  // Professional Guard Function
  const checkAuth = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  if (!product) return null;

  const productInCart = carts?.find(
    (cart: { product: { id: number } }) => cart.product.id === product?.id,
  );

  const handleCardClick = (e: any) => {
    // Prevent navigation if clicking buttons
    if (e.target.closest("button")) return;

    if (!checkAuth(e)) return;

    router.push(`/marketplace/products/${product?.id}`);
  };

  const handleCartAction = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>,
    action: string,
  ) => {
    e.stopPropagation(); // Stop clicking the card

    if (!checkAuth(e)) return;

    if (action === "add") {
      addToCart.mutate({ product_id: product?.id, quantity: 1 });
    } else {
      // REMOVE LOGIC
      if (!!productInCart) {
        removeFromCart.mutate(productInCart?.id);
      }
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="min-w-25 w-62.5 group relative flex flex-col bg-white
        rounded-xl border border-gray-200
        transition-all duration-300
        hover:shadow-lg hover:-translate-y-1 cursor-pointer
      "
      >
        {/* Image wrapper */}
        <div className="overflow-hidden rounded-t-xl h-32 md:h-48">
          <ProductImageDisplay
            images={product?.images}
            height="h-full"
            showThumbnails={false}
          />
        </div>

        <section className="px-4 py-4 flex flex-col flex-1">
          <h2 className="font-medium text-sm mb-1 line-clamp-1">
            {product?.name}
          </h2>

          <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2 line-clamp-1">
            <span>{product?.category}</span>
            <span className="flex items-center gap-1 text-yellow-500">
              <FaStar size={12} /> {(product?.rating || 3)?.toFixed(1)}
            </span>
          </div>

          <p className="mb-1 text-[13px] font-semibold">
            {formatCurrency(product?.amount)}
          </p>

          {/* Action */}
          <div className="mt-auto flex justify-end">
            {productInCart?.product?.id ? (
              <button
                disabled={removeFromCart.isPending}
                onClick={(e) => handleCartAction(e, "remove")}
                className="
                opacity-0 translate-y-3 pointer-events-none
                group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
                transition-all duration-300
                bg-gray-400 hover:bg-gray-500
                text-white text-[10px] md:text-xs
                py-1 px-2 md:p-2 rounded-md
              "
              >
                {removeFromCart.isPending
                  ? "Processing..."
                  : "Remove from Cart"}
              </button>
            ) : (
              <button
                disabled={addToCart.isPending}
                onClick={(e) => handleCartAction(e, "add")}
                className="
                opacity-0 translate-y-3 pointer-events-none
                group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto
                transition-all duration-300
                bg-orange hover:bg-orange-600
                text-white text-[10px] md:text-xs
                py-1 px-2 md:p-2 rounded-md
                disabled:opacity-50
              "
              >
                {addToCart.isPending ? "Processing..." : "Add to Cart"}
              </button>
            )}
          </div>
        </section>
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};

export default ProductCard;
