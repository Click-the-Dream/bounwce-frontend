"use client";
import { SetStateAction, useEffect, useState } from "react";
import { BsTruck } from "react-icons/bs";
import { FiShield, FiShoppingCart } from "react-icons/fi";
import { LuBox, LuStore } from "react-icons/lu";
import { CiStar } from "react-icons/ci";
import { IoClose } from "react-icons/io5";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useMemo } from "react";
import { BiMinus, BiPlus } from "react-icons/bi";
import { useParams, useRouter } from "next/navigation";
import useProduct from "@/app/hooks/use-product";
import useCart from "@/app/hooks/use-cart";
import { onPrompt } from "@/app/_utils/notification";
import { useMarketStore } from "@/app/context/StoreContext";
import ProductSkeleton from "./ProductSkeleton";
import ErrorState from "./ErrorState";
import Navbar from "@/app/_components/Navbar";
import Header from "./Header";
import ProductImageDisplay from "../../_components/ProductImageDisplay";
import ratingsIcon from "../../../assets/icons/ratings-icon.svg";
import stockIcon from "../../../assets/icons/stock-icon.svg";
import { formatCurrency } from "@/app/_utils/formatters";
import VendorFeatureCard from "./VendorFeatureCard";
import { useAuth } from "@/app/context/AuthContext";
import AuthModal from "@/app/_components/AuthModal";

const ProductDetails = () => {
  const { productId } = useParams();
  const router = useRouter();
  const { carts } = useMarketStore();
  const { authDetails, showAuthModal, setShowAuthModal } = useAuth();
  const isAuthenticated = Boolean(authDetails?.access_token);
  const { useGetProductById } = useProduct();
  const { data: product, isLoading, isError } = useGetProductById(productId);
  const { addToCart, updateCart, removeFromCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const vendorInfo = { name: "" };
  const productInCart = useMemo(() => {
    return carts?.find(
      (item: { product: { id: any } }) => item?.product?.id === product?.id,
    );
  }, [carts, product]);

  useEffect(() => {
    setQuantity(productInCart?.quantity || 1);
  }, [productInCart]);

  useEffect(() => {
    if (product === undefined) return;

    if (!product || !productId) {
      onPrompt({
        title: "Product not found",
        message: "The product you are looking for does not exist.",
      });

      router.replace("/marketplace");
    }
  }, [product, productId]);

  const specifications = useMemo(() => {
    if (!product) return [];
    return [
      { label: "Category", value: product?.category },
      { label: "Stock", value: `${product?.stock} items available` },
      { label: "Availability", value: "in stock" },
      { label: "Rating", value: `${product?.rating || 3}/5.0 (203 reviews)` },
    ];
  }, [product]);

  if (isLoading) return <ProductSkeleton />;

  // 3. Handle Error or Missing Product
  if (isError || (!product && !isLoading)) {
    return <ErrorState />;
  }

  const handleQuantity = (qauntity: number) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    updateCart.mutate(
      { cartId: productInCart?.id, data: { quantity: Math.max(1, qauntity) } },
      {
        onSuccess: (data: { data: { quantity: SetStateAction<number> } }) =>
          setQuantity(data?.data?.quantity),
      },
    );
  };

  const handleRemove = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    removeFromCart.mutate(productInCart?.id);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    addToCart.mutate({ product_id: product?.id, quantity });
  };

  return (
    <div className="bg-[#ECECF080] min-h-screen ">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 pb-8">
        <Header title="Product Details" />

        {/* main layout */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* left side - image gallery */}
          <div className="flex flex-col w-full md:w-[50%]">
            <div
              onClick={() => setIsModalOpen(true)}
              className="w-full rounded-md flex items-center justify-center"
            >
              <ProductImageDisplay
                images={product?.images}
                height="h-[500px]"
                thumbSize="h-24"
              />
            </div>
          </div>

          {/* right side - product details */}
          <div className="w-full md:w-[50%]">
            <div className="flex flex-col gap-3 items-start mb-5">
              <span className="border border-[#0000001A] px-2 py-1 rounded-2xl text-[8px]">
                {product.category}
              </span>
              <span className="text-[12px] font-semibold">{product.name}</span>
              <span className="flex gap-2 items-center text-gray-400">
                <img src={ratingsIcon.src} />
                {product.rating} (203 Reviews)
              </span>
              <span className="flex gap-2 items-center">
                <img src={stockIcon.src} />
                {product?.stock} items in stock
              </span>
              <span className="text-[28px] font-semibold">
                {formatCurrency(product?.amount)}
              </span>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              <h1 className="text-[15px] font-semibold">Description</h1>
              <p className="text-gray-400 text-[12px]">
                Bluetooth Speaker - High quality product from TechGadgets.
                Perfect for your needs with excellent durability and
                performance. This item has been carefully selected and verified
                by our team.
              </p>
            </div>

            <div className="mb-5">
              <h1 className="text-[12px] font-medium mb-2">Features</h1>
              <ul className="list-disc ml-4 text-[12px] text-gray-400 flex flex-col gap-1">
                <li>High Quality Material</li>
                <li>Fast Delivery</li>
                <li>Verified Vendor</li>
                <li>Secure Payment</li>
              </ul>
            </div>

            <div className="bg-white rounded-md p-4 mb-5">
              {!!productInCart ? (
                <div className="flex gap-4 items-center">
                  <div className="flex gap-5 items-center">
                    <button
                      disabled={
                        updateCart.isPending || removeFromCart.isPending
                      }
                      onClick={() => {
                        if (quantity > 1) {
                          handleQuantity(quantity - 1);
                        } else {
                          handleRemove();
                        }
                      }}
                      className="bg-black text-white p-2 rounded-md text-[12px]"
                    >
                      {updateCart.isPending || removeFromCart.isPending ? (
                        <AiOutlineLoading3Quarters className="animate-spin text-sm" />
                      ) : (
                        <BiMinus className="text-sm" />
                      )}
                    </button>

                    <span className="text-[13px]">{quantity}</span>

                    <button
                      disabled={
                        quantity >= 99 ||
                        updateCart.isPending ||
                        removeFromCart.isPending
                      }
                      onClick={() => handleQuantity(quantity + 1)}
                      className="bg-black text-white p-2 rounded-md text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateCart.isPending ? (
                        <AiOutlineLoading3Quarters className="animate-spin text-sm" />
                      ) : (
                        <BiPlus className="text-sm" />
                      )}
                    </button>
                  </div>

                  <p className="text-[12px] text-[#00000082]">
                    ({quantity} item(s) added)
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex gap-7 items-center border border-[#0000001A] rounded-md text-[12p] p-2">
                    <button
                      disabled={quantity === 1}
                      onClick={() =>
                        setQuantity((prev) => Math.min(1, prev - 1))
                      }
                      className="disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>

                    <span>{quantity}</span>

                    <button
                      onClick={() =>
                        setQuantity((prev) => Math.min(99, prev + 1))
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    disabled={addToCart.isPending}
                    onClick={handleAddToCart}
                    className="flex justify-center items-center gap-2 bg-black text-white flex-1 rounded-md text-[12px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addToCart.isPending ? (
                      <AiOutlineLoading3Quarters className="animate-spin" />
                    ) : (
                      <FiShoppingCart />
                    )}
                    <span>Add to cart</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-2">
              <VendorFeatureCard icon={BsTruck} feature={"Fast Delivery"} />
              <VendorFeatureCard icon={FiShield} feature={"Secure Payment"} />
              <VendorFeatureCard icon={LuBox} feature={"Quality Product"} />
            </div>
          </div>
        </div>

        {/* specifications and vendor information */}
        <div className="flex flex-col md:flex-row gap-4 items-start w-full max-w-5xl mx-auto px-6">
          {/* specifications */}
          <div className="w-full bg-white rounded-lg p-4 flex-1">
            <h1 className="text-[14px] font-medium mb-6">Specifications</h1>
            <div className="flex flex-col gap-5">
              {specifications?.map((spec) => (
                <div key={spec.label}>
                  <div className="flex justify-between items-center text-[13px] mb-2">
                    <span className="text-gray-400">{spec.label}</span>
                    <span className="font-medium">{spec.value}</span>
                  </div>
                  <hr className="h-[0.53px] border-[#0000001A]" />
                </div>
              ))}
            </div>
          </div>

          {/* vendor information */}
          <div className="w-full bg-white px-7 py-5 rounded-lg flex-1">
            <h1 className="text-[12.68px] mb-3">Vendor Information</h1>
            <div className="flex gap-3 items-center">
              <div>
                {/* <img src="" /> */}
                <div className="bg-[#ECECF0] text-[19px] p-2 rounded-full w-12.5 flex justify-center">
                  PE
                </div>
              </div>

              <div className="text-[12px] flex flex-col gap-1 items-start">
                <p className="flex gap-2">
                  <span className="text-[12px] font-medium">
                    {vendorInfo.name || "Vendor"}
                  </span>
                  --
                  <span className="text-gray-400">Joined: March 2024</span>
                </p>
                <p className="flex gap-1 items-center text-gray-400">
                  <CiStar className="text-[#FDC700]" />
                  <span>{product?.rating || 3}</span>
                  <span>(203 reviews)</span>
                </p>
                <p className="flex gap-1 items-center text-gray-400">
                  <LuStore />
                  <span>45 Products</span>
                </p>
                <button>Visit Store</button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal implementation */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
            <div className="bg-white w-full max-w-175 h-125 rounded-[23px] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-2 shrink-0">
                <h1 className="text-[14px] font-medium">Product Images</h1>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <IoClose size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                <ProductImageDisplay
                  images={product?.images}
                  thumbSize="w-20 h-20"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default ProductDetails;
