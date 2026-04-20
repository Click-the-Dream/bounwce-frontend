"use client";
import SafeImage from "@/app/_components/SafeImage";
import { X, Search } from "lucide-react";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTACTS = [
  {
    id: 1,
    name: "Zara Hadid",
    status: "Online",
    img: "/avatar.png",
    type: "initials",
    initials: "ZH",
  },
  { id: 2, name: "Zara Hadid", status: "Online", img: "/avatar.png" },
  { id: 3, name: "Zara Hadid", status: "Offline", img: "/avatar.png" },
  {
    id: 4,
    name: "Zara Hadid",
    status: "Online",
    img: "/avatar.png",
    type: "initials",
    initials: "ZH",
  },
];

export default function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm">
      <div className="bg-white w-md rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 flex justify-between items-start">
          <div>
            <h2 className="text-sm font-medium text-black">Start New Chat</h2>
            <p className="text-[13px] text-[#00000080]">
              Search for contacts to start a conversation
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-black/90 hover:text-black transition-colors"
          >
            <X strokeWidth={1.5} className="size-5" />
          </button>
        </div>

        {/* Search Input Area */}
        <div className="px-5 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] size-4" />
            <input
              type="text"
              placeholder="Find Anything"
              className="w-full border-[0.53px] border-[#0000004D] rounded-[10px] py-2.5 pl-10 pr-4 text-sm focus:outline-none"
            />
          </div>

          {/* Selected Tag */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 bg-[#E8E8E8] text-[#1A1A1A] px-3 py-1.5 rounded-full text-[13px]">
              Zara Hadid <X className="size-3 cursor-pointer" />
            </span>
          </div>
        </div>

        {/* Contact List */}
        <div className="mt-4 overflow-y-auto px-5">
          {CONTACTS.map((contact, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 py-3 cursor-pointer group"
            >
              <div className="relative">
                <div className="size-9.25 rounded-[10px] bg-gray-200 overflow-hidden">
                  {contact?.type === "initials" ? (
                    <div
                      style={{
                        boxShadow:
                          "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
                      }}
                      className="w-full h-full rounded-[10px] bg-gray-100 flex items-center justify-center font-bold text-black text-xs"
                    >
                      {contact?.initials}
                    </div>
                  ) : (
                    <SafeImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact?.name}${contact?.id}`}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-full h-full rounded-[10px] object-cover"
                      style={{
                        boxShadow:
                          "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
                      }}
                    />
                  )}
                  {/* Replace with your Image component */}
                  <div className="w-full h-full bg-[#D9D9D9]" />
                </div>
                <div
                  className={`absolute bottom-0 right-0 size-3 border-2 border-white rounded-full ${contact.status === "Online" ? "bg-green-500" : "bg-gray-400"}`}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-black">
                  {contact.name}
                </span>
                <span className="text-[13px] text-[#A1A1A1]">
                  {contact.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Buttons */}
        <div className="p-5 grid grid-cols-2 gap-2.25 text-[13px]">
          <button
            onClick={onClose}
            className="w-full py-2 border border-[#00000033] rounded-[10px] font-medium text-black hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button className="w-full py-3 bg-[#FF4D2D] hover:bg-[#ee3d15] text-white rounded-[10px] font-medium transition-all shadow-lg shadow-orange/20">
            Start Chart
          </button>
        </div>
      </div>
    </div>
  );
}
