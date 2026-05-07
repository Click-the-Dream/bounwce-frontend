"use client";

import { useEffect, useMemo, useState } from "react";
import SafeImage from "@/app/_components/SafeImage";
import { X, Search } from "lucide-react";
import useUser from "@/app/hooks/use-user";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const { authDetails } = useAuth();
  const router = useRouter();
  const { useGetUsers } = useUser();

  const [search, setSearch] = useState("");

  // only fetch when modal is open
  const params = useMemo(
    () => ({
      page_size: 20,
      name: search,
    }),
    [],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetUsers(params);

  const users = data?.pages?.flatMap((page: any) => page.users || []) || [];
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter(
      (user: any) =>
        user.id !== authDetails?.user?.id &&
        user.full_name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-sm">
      <div className="bg-white w-md rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="p-5 flex justify-between items-start">
          <div>
            <h2 className="text-sm font-medium text-black">Start New Chat</h2>
            <p className="text-[13px] text-[#00000080]">
              Search for contacts to start a conversation
            </p>
          </div>

          <button onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        {/* SEARCH */}
        <div className="px-5 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] size-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full border rounded-[10px] py-2.5 pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        {/* USERS LIST */}
        <div className="mt-4 overflow-y-auto px-5 max-h-75">
          {isLoading ? (
            <div className="text-center text-sm text-gray-400">
              Loading users...
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user: any) => (
              <div
                key={user.id}
                onClick={() => router.push(`/buyer/chat/${user.id}`)}
                className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
              >
                <div className="size-9.25 rounded-[10px] overflow-hidden bg-gray-200">
                  {user.profile ? (
                    <SafeImage
                      src={user.profile.url}
                      alt={user.full_name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover rounded-[10px]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[10px] bg-gray-100 flex items-center justify-center font-bold text-black">
                      {user.full_name?.slice(0, 2) || "NA"}
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.full_name}</span>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-gray-400">
              No users found
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 grid grid-cols-2 gap-2.25">
          <button
            onClick={onClose}
            className="cursor-pointer py-2 border rounded-[10px]"
          >
            Cancel
          </button>

          <button className="cursor-pointer py-2 bg-[#FF4D2D] text-white rounded-[10px]">
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}
