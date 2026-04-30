import {
  Image as ImageIcon,
  MessageCircleReply,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react";
import React from "react";
import userImg from "../../../../assets/buyer/user.jpg";
import Image from "next/image";
import SwitchAccountCard from "./SwitchAccountCard";

const IdentityCard: React.FC<{ data: any }> = ({ data }) => (
  <div className="bg-[#F7F7F7] p-3.75 w-full h-full">
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
      <div
        className="w-5 h-5 absolute flex items-center justify-center -bottom-1 -right-1 bg-[#D9D9D9] p-1.5 rounded-md shadow-md border border-white"
        style={{
          boxShadow:
            "0px 0px 0.5px 0px #00000040, 0px 1px 6px -1px #00000040 inset",
        }}
      >
        <ImageIcon size={10} className="text-black" />
      </div>
    </div>

    <h2 className="text-[18px] font-bold text-gray-900 leading-tight">
      {data.name}
    </h2>
    <p className="text-[#888888] text-[13px] mb-4">{data.handle}</p>

    <div className="flex gap-2 mb-5.5 items-center">
      <button className="cursor-pointer max-w-22 h-7.5 flex-1 bg-orange outline-[0.83px] outline-orange border border-[#F4F4F4] hover:bg-[#ee3d15] text-white p-2 rounded-full text-xs font-medium flex items-center justify-center transition-all">
        <PlusCircle fill="#8a0202" className="size-4 mr-1.75" /> Connect
      </button>
      <button className="cursor-pointer max-w-23.25 h-7.5 flex-1 bg-[#D0D0D0] border border-white outline outline-[#747474] hover:bg-[#dedede] text-[#747474] p-2 rounded-full text-xs flex items-center justify-center transition-all">
        <MessageCircleReply className="size-3.5 mr-1.75" /> Message
      </button>
      <button className="cursor-pointer ml-auto bg-[#D9D9D9] flex items-center justify-center text-black rounded-full hover:bg-[#c6c4c4] transition-colors w-6 h-6">
        <MoreHorizontal className="size-3" />
      </button>
    </div>

    <div className="flex justify-between text-[13px] mb-5 text-[#888888]">
      <span className="">
        <b className="font-normal">{data.followers}</b> followers
      </span>
      <span className="">
        <b className="font-normal">{data.badges}</b> Badges earned
      </span>
    </div>

    <p className="text-[13px] text-black leading-4.5 w-[90%] border-b-[0.53px] border-[#00000033] pb-2.75 mb-11.5">
      {data.bio}
    </p>

    <SwitchAccountCard />
  </div>
);

export default IdentityCard;
