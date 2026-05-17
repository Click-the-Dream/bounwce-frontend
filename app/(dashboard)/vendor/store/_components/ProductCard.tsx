"use client";

import { TbEdit } from "react-icons/tb";
import { RiDeleteBin6Line } from "react-icons/ri";
import useProduct from "@/app/hooks/use-product";
import ProductImageDisplay from "@/app/marketplace/_components/ProductImageDisplay";
import { formatCurrency } from "@/app/_utils/formatters";

const ProductCard = ({ product, status }: any) => {
  const { toggleProductState } = useProduct();
  const images = product?.images || [];

  const handleProductState = async () => {
    toggleProductState.mutate(product?.id);
  };

  return (
    <div className="w-full border-[0.83px] border-[#0000001A] rounded-lg overflow-hidden shadow-sm flex flex-col">
      <div className="flex-1 h-full">
        <ProductImageDisplay
          height="max-h-62.2"
          images={product?.images}
          showThumbnails={false}
        />
      </div>

      {/* PRODUCT DETAILS */}
      <div className="flex-1 h-full border-t-[0.83px] border-[#0000001A] px-5 py-4 bg-white flex flex-col justify-between">
        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <h1 className="uppercase text-[12px] font-medium">
              {product?.name}
            </h1>
            <p
              className={`rounded-[9px] px-3.25 py-0.5 text-[9px] font-bold ${
                product?.state === "draft"
                  ? "bg-gray-400 text-white"
                  : "bg-[#38C066] text-white"
              }`}
            >
              {product?.state === "draft" ? "Draft" : "Live"}
            </p>
          </div>

          <p className="text-[#000000] text-[11px] line-clamp-2">
            {product?.description}
          </p>
          <p className="text-[11px] flex justify-between">
            <span className="font-medium">Category:</span>
            <span>{product?.category}</span>
          </p>
          <p className="text-[11px] flex justify-between">
            <span className="font-medium">Price:</span>
            <span>{formatCurrency(product?.amount || 0)}</span>
          </p>
          <p className="text-[11px] flex justify-between">
            <span className="font-medium">Stock:</span>
            <span>{product?.stock}</span>
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 justify-between flex-wrap">
          <div className="flex gap-3">
            <button className="cursor-pointer text-[10px] font-semibold border rounded-[6.75px] border-[#00000036] px-2 py-1 flex gap-1 items-center">
              <TbEdit /> Edit
            </button>

            <button
              onClick={handleProductState}
              disabled={toggleProductState.isPending}
              className={`cursor-pointer text-[10px] font-semibold border rounded-[6.75px] border-[#00000036] px-2 py-1 ${
                product?.state === "draft"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {toggleProductState.isPending
                ? "Processing..."
                : product?.state === "draft"
                  ? "Publish"
                  : "Unpublish"}
            </button>
          </div>

          <button className="cursor-pointer text-[10px] font-semibold border rounded-[6.75px] border-[#00000036] px-2 py-1">
            <RiDeleteBin6Line />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
