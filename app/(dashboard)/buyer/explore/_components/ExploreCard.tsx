import Image from "next/image";
import userImg from "../../../../assets/buyer/user.jpg";
import { PlusIcon } from "lucide-react";

const ExploreCard = ({ name, handle, bio, followers, posts, badges }: any) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col max-w-65">
      <div className="p-1.5 pb-0">
        {/* Header Image */}
        <div className="relative h-32.5 w-full rounded-[20px] bg-gray-100 ">
          <img
            src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=400&q=80"
            alt="background"
            className="w-full h-full object-cover rounded-[20px]"
          />
          <button className="cursor-pointer w-20.25 h-7.5 absolute top-1.5 right-1.75 bg-white hover:bg-gray-100 text-gray-800 px-3 py-1 rounded-[50px] text-xs flex justify-around items-center gap-1 shadow-sm transition-colors">
            Connect <PlusIcon className="shrink-0 size-2.5" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-2.5">
          <div className="relative -mt-[30.5px] mb-2">
            <Image
              src={userImg.src}
              alt="Profile"
              width={60}
              height={61}
              className="w-15.75 h-15.25 rounded-[20px] border-2 border-white bg-gray-100 object-cover"
              style={{
                boxShadow:
                  "0px 0px 4px 1px #00000040, 1px -6px 4px 3px #00000040 inset",
              }}
            />
          </div>

          <h3 className="font-medium text-black text-[13px] leading-tight">
            {name}
          </h3>
          <p className="text-[#888888] text-[13px] mb-3.75">{handle}</p>

          <p className="text-[#888888] text-xs leading-relaxed mb-[8.73px]">
            {bio}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="flex-1 grid grid-cols-3 divide-x-[0.53px] divide-[#00000033] border-t-[0.53px] border-[#00000033]">
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
      </div>
    </div>
  );
};

export default ExploreCard;
