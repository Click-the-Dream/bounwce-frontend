"use client";

import SafeImage from "@/app/_components/SafeImage";
import { User, UserOption } from "@/app/_utils/types/buyer";
import { Check } from "lucide-react";

type UserSelectType = {
  isLoading: boolean;
  users: UserOption[];
  lastUserRef: any;
  isSelected: (p: string) => boolean;
  isFetchingNextPage: boolean;
  toggle: (u: UserOption) => void;
};

const UserSelect = ({
  isLoading,
  users,
  lastUserRef,
  isSelected,
  isFetchingNextPage,
  toggle,
}: UserSelectType) => {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-[#0000001A] min-h-0">
      {isLoading ? (
        <p className="text-xs text-gray-400 text-center py-6">
          Loading users...
        </p>
      ) : users.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No users found</p>
      ) : (
        users.map((u: UserOption, index) => {
          const isLast = index === users.length - 1;

          return (
            <div key={u.id} ref={isLast ? lastUserRef : undefined}>
              <button
                onClick={() => toggle(u)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="relative size-9 rounded-[10px] bg-gray-200 shrink-0 overflow-hidden">
                  {u.profile_pic?.url ? (
                    <SafeImage
                      src={u.profile_pic.url}
                      alt={u.full_name}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover rounded-[10px]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-[10px] bg-gray-100 flex items-center justify-center font-bold text-black text-xs">
                      {u.full_name?.slice(0, 2) || "NA"}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {u.full_name}
                  </p>

                  <p className="text-xs text-[#9C9C9C] truncate">
                    {u.username ? `@${u.username}` : u.email}
                  </p>
                </div>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isSelected(u.id)
                      ? "bg-orange border-orange"
                      : "border-[#0000004D]"
                  }`}
                >
                  {isSelected(u.id) && (
                    <Check size={9} className="text-white" />
                  )}
                </div>
              </button>
            </div>
          );
        })
      )}

      {isFetchingNextPage && (
        <p className="text-xs text-gray-400 text-center py-3">
          Loading more...
        </p>
      )}
    </div>
  );
};

export default UserSelect;
