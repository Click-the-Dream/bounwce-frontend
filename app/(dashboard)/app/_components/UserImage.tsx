import SafeImage from "@/app/_components/SafeImage";
import { useChatUtils } from "@/app/context/ChatContext";

interface UserImageProps {
  user: {
    id?: string;
    full_name: string;
    profile_pic?: { url?: string };
  };
  size?: number;
}

const UserImage = ({ user, size = 36 }: UserImageProps) => {
  const { onlineUsers } = useChatUtils();

  const isOnline = !!user?.id && !!onlineUsers?.[user.id];

  const initials = user.full_name?.trim()?.slice(0, 2)?.toUpperCase() || "NA";

  return (
    <div
      className="relative shrink-0 rounded-[12px] border border-white"
      style={{
        boxShadow:
          "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
      }}
    >
      {user.profile_pic?.url ? (
        <SafeImage
          src={user.profile_pic.url}
          alt={user.full_name}
          width={size}
          height={size}
          className="rounded-[12px] object-cover"
        />
      ) : (
        <div
          className="flex items-center justify-center bg-gray-100 font-semibold text-black rounded-[12px]"
          style={{ width: size, height: size }}
        >
          {initials}
        </div>
      )}

      {isOnline && (
        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-white rounded-full" />
      )}
    </div>
  );
};

export default UserImage;
