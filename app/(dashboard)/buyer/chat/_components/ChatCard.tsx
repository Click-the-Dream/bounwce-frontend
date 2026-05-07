"use client";
import SafeImage from "@/app/_components/SafeImage";
import { useParams, useRouter } from "next/navigation";

const ChatCard = ({ chatUser }: any) => {
  const { chatId } = useParams();
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/buyer/chat/${chatUser.id}`)}
      key={chatUser?.id}
      className={`flex items-center gap-3 pt-3.25 pb-4.75 px-1 cursor-pointer hover:bg-gray-50 border-b-[0.53px] border-[#00000033] h-15.75 ${chatId === chatUser.id ? "bg-gray-100" : ""}`}
    >
      <div
        className="relative shrink-0 rounded-[10px]  border border-white"
        style={{
          boxShadow:
            "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
        }}
      >
        {chatUser.profile ? (
          <SafeImage
            src={chatUser.profile.url}
            alt="Profile"
            width={40}
            height={40}
            className="w-9.25 h-9.25 rounded-[10px] object-cover"
          />
        ) : (
          <div className="w-9.25 h-9.25 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-black">
            {chatUser.full_name?.slice(0, 2) || "NA"}
          </div>
        )}
        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-[0.83px] border-white rounded-full"></span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className="font-medium text-sm truncate">{chatUser.full_name}</h4>
          <span className="text-[10px] text-gray-400">{chatUser.time}</span>
        </div>
        <p className="text-[13px] text-[#A1A1A1] truncate mt-0.5">
          @{chatUser.username}
        </p>
      </div>
    </div>
  );
};

export default ChatCard;
