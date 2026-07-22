import Image from "next/image";

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
];

const AttendeeAvatars = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex -space-x-2 w-max">
        {AVATARS.map((src, i) => (
          <div
            key={i}
            className="relative w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200"
          >
            <Image
              src={src}
              alt={`Attendee ${i + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <span className="text-xs font-medium text-gray-600">
        +{AVATARS.length}
      </span>
    </div>
  );
};

export default AttendeeAvatars;
