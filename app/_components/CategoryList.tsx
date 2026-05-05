"use client";
import { useRouter } from "next/navigation";
//import useProduct from "../hooks/use-product";
const categories = [
  {
    name: "Weekend date",
    suggestion: "Looking for someone to go out with this weekend.",
  },
  {
    name: "Gym partner",
    suggestion: "Need a gym partner nearby to stay consistent.",
  },
  {
    name: "Food spot",
    suggestion: "Looking for somewhere nice to eat.",
  },
  {
    name: "Networking event",
    suggestion: "Looking for a social or  business event to attend.",
  },
];
const CategoryList = ({ setQuery }: any) => {
  const router = useRouter();
  // const { useGetProductCategories } = useProduct();
  // const { data: categories = [] } = useGetProductCategories();

  const handleCategoryClick = (cat: any) => {
    setQuery(cat?.suggestion);
    // router.push(`/marketplace?category=${encodeURIComponent(cat?.name || "")}`);
  };

  return (
    <div className="flex flex-wrap justify-center gap-3.5 mt-5 max-w-162.5">
      {categories?.map((cat: any, index: number) => (
        <button
          key={index}
          onClick={() => handleCategoryClick(cat)}
          className="cursor-pointer px-5 py-2 text-[12px] font-medium border-[0.5px] border-[#BDBDBD] rounded-full bg-white hover:bg-white/50 transition-all text-gray-700 active:scale-95"
        >
          {cat?.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryList;
