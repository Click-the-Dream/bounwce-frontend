import {
  Check,
  Image as ImageIcon,
  Loader2,
  MessageCircleReply,
  MoreHorizontal,
  PlusCircle,
  Send,
} from "lucide-react";
import React, { useState } from "react";
import userImg from "../../../../assets/buyer/user.jpg";
import Image from "next/image";
import SwitchAccountCard from "./SwitchAccountCard";
import IdentityCardSkeleton from "./IdentityCardSkeleton";
import useMatch from "@/app/hooks/use-match";

type Props = {
  data: any;
  isOwnProfile?: boolean;
  isLoading?: boolean;
};

const IdentityCard: React.FC<Props> = ({ data, isOwnProfile, isLoading }) => {
  const { createMatchRequest } = useMatch();

  const [sent, setSent] = useState(false);

  if (isLoading) return <IdentityCardSkeleton />;

  const handleConnect = () => {
    if (sent || createMatchRequest.isPending) return;

    createMatchRequest.mutate(
      { target_user_id: data.user_id },
      {
        onSuccess: () => {
          setSent(true);
        },
      },
    );
  };

  return (
    <div className="bg-[#F7F7F7] p-3.75 w-full h-full">
      {/* PROFILE IMAGE */}
      <div className="relative w-15.75 h-15.25 mb-3.25">
        <Image
          src={userImg.src}
          alt="Profile"
          width={60}
          height={61}
          loading="eager"
          className="rounded-[20px] border-2 border-white bg-gray-100 object-cover w-15 h-15.25"
          style={{
            boxShadow:
              "0px 0px 4px 1px #00000040, 1px -6px 4px 3px #00000040 inset",
          }}
        />

        <div className="w-5 h-5 absolute -bottom-1 -right-1 bg-[#D9D9D9] p-1.5 rounded-md shadow-md border border-white flex items-center justify-center">
          <ImageIcon size={10} />
        </div>
      </div>

      {/* NAME */}
      <h2 className="text-[18px] font-medium text-black leading-tight">
        {data.name}
      </h2>

      <p className="text-[#888888] text-[13px] mb-4">@{data.handle}</p>

      {/* ACTIONS */}
      <div className="flex gap-2 mb-5.5 items-center">
        {isOwnProfile ? (
          <button className="cursor-pointer max-w-17.5 h-6.5 flex-1 bg-[#D0D0D0] border border-white outline outline-[#747474] hover:bg-[#dedede] text-[#747474] p-2 rounded-full text-xs flex items-center justify-center transition-all">
            <Send className="size-3.5 mr-1.75" /> Share
          </button>
        ) : (
          <>
            <button
              onClick={handleConnect}
              disabled={sent || createMatchRequest.isPending}
              className={`cursor-pointer max-w-22 h-7.5 flex-1 border border-[#F4F4F4] outline-[0.83px] p-2 rounded-full text-xs font-medium flex items-center justify-center transition-all
                ${
                  sent
                    ? "bg-green-500 text-white cursor-not-allowed"
                    : "bg-orange text-white hover:bg-[#ee3d15]"
                }
              `}
            >
              {sent ? (
                <>
                  <Check className="size-4 mr-1.75" />
                  Sent
                </>
              ) : (
                <>
                  {createMatchRequest.isPending ? (
                    <Loader2 className="size-4 animate-spin mr-1.75" />
                  ) : (
                    <PlusCircle fill="#8a0202" className="size-4 mr-1.75" />
                  )}
                  Connect
                </>
              )}
            </button>
            <button className="cursor-pointer max-w-23.25 h-7.5 flex-1 bg-[#D0D0D0] border border-white outline outline-[#747474] hover:bg-[#dedede] text-[#747474] p-2 rounded-full text-xs flex items-center justify-center transition-all">
              <MessageCircleReply className="size-3.5 mr-1.75" /> Message
            </button>

            <button className="cursor-pointer ml-auto bg-[#D9D9D9] flex items-center justify-center text-black rounded-full hover:bg-[#c6c4c4] transition-colors w-6 h-6">
              <MoreHorizontal className="size-3" />
            </button>
          </>
        )}
      </div>

      {/* STATS */}
      <div className="flex justify-between text-[13px] mb-5 text-[#888888]">
        <span>
          <b className="font-normal">{data.followers}</b> followers
        </span>
        <span>
          <b className="font-normal">{data.badges}</b> Badges earned
        </span>
      </div>

      {/* BIO */}
      <p className="text-[13px] text-black leading-4.5 w-[90%] border-b-[0.53px] border-[#00000033] pb-2.75 mb-11.5">
        {data.bio}
      </p>

      {/* SWITCH ACCOUNT */}
      {isOwnProfile && <SwitchAccountCard />}
    </div>
  );
};
export default IdentityCard;
