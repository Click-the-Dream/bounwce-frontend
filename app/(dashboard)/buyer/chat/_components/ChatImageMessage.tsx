import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import Image from "next/image";

const ChatImageMessage = ({ msg, mediaImages, onOpen }: any) => {
  const styles = getMessageLayout(msg.isSender);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.bubble} p-0.5 relative w-71.25 rounded-[10px] overflow-hidden shadow-sm`}
      >
        {/* IMAGES */}
        {msg.images?.length === 1 ? (
          <div
            className="relative cursor-pointer"
            onClick={() => {
              const index = mediaImages.findIndex(
                (m: any) => m.src === msg.images[0],
              );
              onOpen(index);
            }}
          >
            <Image
              src={msg.images[0]}
              alt="chat"
              width={500}
              height={500}
              className="w-full h-88 object-cover rounded-[10px]"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {msg.images.slice(0, 4).map((img: string, i: number) => {
              const isLast = i === 3;
              const extraCount = msg.images.length - 4;

              return (
                <div
                  key={i}
                  className={`relative cursor-pointer ${msg.images.length === 3 && i === 2 ? "col-span-2" : ""}`}
                  onClick={() => {
                    const index = mediaImages.findIndex(
                      (m: any) => m.src === img,
                    );
                    onOpen(index);
                  }}
                >
                  <Image
                    src={img}
                    alt="chat"
                    width={260}
                    height={300}
                    className="w-full h-44 object-cover"
                  />

                  {/* +MORE OVERLAY */}
                  {isLast && extraCount > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded">
                      <span className="text-white text-lg font-semibold">
                        +{extraCount}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TEXT */}
        {msg.text && <div className="px-2.5 py-2 text-[13px]">{msg.text}</div>}

        {/* TIME */}
        <span
          className={`absolute bottom-1 right-2 text-[10px] flex items-center gap-1 ${styles.time}`}
        >
          {msg.timestamp}
          {msg.isSender && msg.status && (
            <span className="text-[10px] opacity-80">
              {renderCheck(msg.status)}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default ChatImageMessage;
