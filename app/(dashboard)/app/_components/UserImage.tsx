import SafeImage from "@/app/_components/SafeImage";
import { useChatUtils } from "@/app/context/ChatContext";

interface UserImageProps {
  user: {
    id?: string;
    full_name: string;
    profile_pic?: { url?: string };
  };
  size?: number;
  style?: any;
  // Add this new prop
  rounded?: string;
}

const UserImage = ({
  user,
  size = 36,
  style = {
    boxShadow:
      "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
  },
  // Default to rounded-xl if nothing is provided
  rounded = "rounded-xl",
}: UserImageProps) => {
  const { onlineUsers } = useChatUtils();
  const isOnline = !!user?.id && !!onlineUsers?.[user.id];
  const initials = user?.full_name?.trim()?.slice(0, 2)?.toUpperCase() || "NA";

  return (
    <div
      // Use template literals to inject the dynamic rounded class
      className={`relative shrink-0 border border-white ${rounded}`}
      style={{ ...style, width: size, height: size }}
    >
      {user?.profile_pic?.url ? (
        <SafeImage
          src={user.profile_pic.url}
          alt={user?.full_name}
          width={size}
          height={size}
          className={`w-full h-full object-cover ${rounded}`}
        />
      ) : (
        <div
          className={`flex items-center justify-center bg-gray-100 font-semibold text-black ${rounded}`}
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
