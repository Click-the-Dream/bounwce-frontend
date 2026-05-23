import { Loader2, PlusIcon } from "lucide-react";
import { ConnectStatus, SuggestedCandidate } from "@/app/_utils/types/payload";
import { useRouter } from "next/navigation";
import { LuClock } from "react-icons/lu";
import { slugify } from "@/app/_utils/slugify";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import UserImage from "../../_components/UserImage";

type Props = SuggestedCandidate & {
  onConnect: (id: string) => void;
  connectStatus?: ConnectStatus;
};

const interests = ["Reading", "Cooking", "Fitness"];
const ExploreCard = ({
  full_name,
  user_id,
  shared_interests,
  score,
  profile_pic,
  onConnect,
  connectStatus = "idle",
}: Props) => {
  const router = useRouter();

  const goToProfile = () => {
    router.push(`/app/profile/${slugify(full_name)}_${user_id}`);
  };
  const isLoading = connectStatus === "loading";
  const isConnected = connectStatus === "connected";
  const isPending = connectStatus === "pending";

  const isDisabled = isLoading || isConnected || isPending;

  return (
    <div
      onClick={goToProfile}
      className="cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col w-full hover:shadow-md transition"
    >
      <div className="p-1.5 pb-0">
        {/* Header Image */}
        <div className="relative h-32.5 w-full rounded-[20px] bg-gray-100 ">
          <img
            src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=400&q=80"
            alt="background"
            className="w-full h-full object-cover rounded-[20px]"
          />

          <button
            disabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled) onConnect(user_id);
            }}
            className={`cursor-pointer absolute top-1.5 right-1.75 px-2 min-w-20.25 h-7.5 rounded-[50px] text-xs flex items-center justify-center gap-1 shadow-sm transition disabled:cursor-not-allowed ${
              isConnected
                ? "bg-green-50/70 text-green-700 cursor-not-allowed"
                : isPending
                  ? "bg-yellow-50 text-yellow-700 cursor-not-allowed"
                  : "bg-white hover:bg-gray-100 text-gray-800"
            }
  `}
          >
            {isConnected
              ? "Connected"
              : isLoading
                ? "Sending..."
                : isPending
                  ? "Pending"
                  : "Connect"}

            {isConnected ? (
              <IoCheckmarkDoneCircleSharp />
            ) : isPending ? (
              <LuClock className="shrink-0 size-2.5" />
            ) : isLoading ? (
              <Loader2 className="shrink-0 size-2.5 animate-spin" />
            ) : (
              <PlusIcon className="shrink-0 size-2.5" />
            )}
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-2.5">
          <div className="relative -mt-[30.5px] mb-2 w-max">
            <UserImage
              user={{
                id: user_id,
                full_name,
                profile_pic,
              }}
              size={61}
              style={{
                boxShadow:
                  "0px 0px 4px 1px #00000040, 1px -6px 4px 3px #00000040 inset",
              }}
            />
          </div>

          <h3 className="font-medium text-black text-[13px] leading-tight">
            {full_name}
          </h3>
          <p className="text-[#888888] text-[13px]"> @{user_id?.slice(0, 8)}</p>

          {/* <p className="text-[#888888] text-xs leading-relaxed mb-[8.73px]">
            {bio}
          </p> */}
        </div>
      </div>
      <div className="flex-1 flex gap-2 mt-2 border-t-[0.53px] border-[#00000033] mx-4 pt-1.5">
        <p className="text-xs text-[#888888]">Followers:</p>{" "}
        <span className="font-medium text-[13px]">{Math.max(0, score)}</span>
      </div>
      <div className="flex-1 flex flex-wrap gap-2 mt-3.5 mb-5.75 px-4">
        {shared_interests?.length > 0 ? (
          shared_interests.slice(0, 3)?.map((interest, index) => (
            <span
              key={index}
              className="px-2.5 py-0.5 border-[0.53px] border-[#8D8D8D] rounded-full text-xs text-[#747474]"
            >
              {interest}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">No interests in common</span>
        )}
      </div>

      {/* Stats Grid */}
      {/* <div className="flex-1 grid grid-cols-3 divide-x-[0.53px] divide-[#00000033] border-t-[0.53px] border-[#00000033]">
        <div className="flex flex-col items-center justify-center pt-[13.26px] pb-5.75">
          <span className="font-bold text-black text-[13px]">{followers}</span>
          <span className="text-xs text-[#888888]">followers</span>
        </div>
        <div className="flex flex-col items-center justify-center pt-[13.26px] pb-5.75">
          <span className="font-bold text-black text-[13px]">{posts}</span>
          <span className="text-xs text-[#888888]">Post</span>
        </div>
        <div className="flex flex-col items-center justify-center pt-[13.26px] pb-5.75">
          <span className="font-bold text-black text-[13px]">{badges}</span>
          <span className="text-xs text-[#888888]">Badges</span>
        </div>
      </div> */}
    </div>
  );
};

export default ExploreCard;
