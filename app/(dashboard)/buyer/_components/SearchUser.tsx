import SafeImage from "@/app/_components/SafeImage";
import { slugify } from "@/app/_utils/slugify";
import { SuggestedCandidate } from "@/app/_utils/types/payload";
import { useRouter } from "next/navigation";

const SearchUser = ({ item }: { item: SuggestedCandidate }) => {
  const router = useRouter();
  const goToProfile = () => {
    router.push(`/buyer/profile/${slugify(item?.full_name)}_${item?.user_id}`);
  };
  return (
    <div
      onClick={goToProfile}
      className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer transition-colors rounded-xl group"
    >
      <div className="relative w-10 h-10 shrink-0">
        {item?.profile ? (
          <SafeImage
            src={item.profile}
            alt="Profile"
            width={40}
            height={40}
            className="w-full h-full rounded-xl object-cover border-2 border-white"
            style={{
              boxShadow:
                "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
            }}
          />
        ) : (
          <div
            className="w-full h-full rounded-xl bg-white border border-white flex items-center justify-center text-[13px] text-black"
            style={{
              boxShadow:
                "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
            }}
          >
            {item?.full_name?.slice(0, 2).toUpperCase() || "NA"}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] text-black leading-tight transition-colors">
          {item?.full_name}
        </span>
        <span className="text-[13px] text-[#747474]">
          @{item?.user_id?.slice(0, 10) || "N/A"}
        </span>
      </div>
    </div>
  );
};

export default SearchUser;
