"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

import IdentityCard from "./IdentityCard";
import profileBg from "../../../../assets/buyer/profile-bg.jpg";

import { profileHelper } from "@/app/helpers/profile-helper";
import useUser from "@/app/hooks/use-user";
import useInterest from "@/app/hooks/use-interest";
import Fallback from "@/app/_components/Fallback";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Posts");

  const { profileId, isOwnProfile } = profileHelper();

  const { useGetCurrentUser, useGetUserById } = useUser();
  const { useGetUserInterests } = useInterest();

  const userQuery = isOwnProfile
    ? useGetCurrentUser()
    : useGetUserById(profileId!);

  const user = userQuery.data?.data ?? userQuery.data;

  const isLoading = userQuery.isLoading;
  const isError = userQuery.isError;
  const isNotFound = !isLoading && !isError && !user;

  const { data: userInterests = [], isLoading: isLoadingInterests } =
    useGetUserInterests();

  const tags = useMemo(() => {
    return isOwnProfile ? userInterests : [];
  }, [isOwnProfile, userInterests]);
  const isTagsReady = isOwnProfile ? !isLoadingInterests : true;

  if (isNotFound) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-semibold text-black">User not found</h2>
        <p className="text-sm text-gray-500 mt-1">
          The profile you’re looking for doesn’t exist or has been removed.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500">Failed to load profile. Try again.</p>
      </div>
    );
  }

  const userData = {
    name: user?.full_name,
    handle: user?.username,
    bio: user?.bio ?? "Better to be woke and broke than sleep and creep",
    followers: user?.followers_count ?? 0,
    badges: user?.badges_count ?? 0,
    tags,
  };

  return (
    <main className="w-full relative h-screen md:h-full justify-start mx-auto flex flex-col gap-2 md:gap-0 md:flex-row md:justify-center p-4 md:p-8 md:pt-4.75 overflow-y-auto bg-white">
      {/* Left Column */}
      <div className="w-full md:max-w-76.25 relative md:sticky md:top-0">
        <IdentityCard
          data={userData}
          isOwnProfile={isOwnProfile}
          isLoading={isLoading}
        />
      </div>

      {/* RIGHT */}
      <div className="md:flex-1 space-y-6 max-w-143 w-full">
        <div className="bg-white">
          {/* HEADER IMAGE */}
          <div className="relative">
            <Image
              src={profileBg.src}
              alt="profile-banner"
              width={500}
              height={130}
              className="w-full h-31.25 object-cover"
            />
            <div className="w-5 h-5 absolute top-1.25 right-2 bg-[#D9D9D9] p-1.5 rounded-md shadow-md border border-white flex items-center justify-center">
              <ImageIcon size={10} className="text-black" />
            </div>
          </div>

          {/* CONTENT */}
          <div className="px-4 md:pl-8.75 py-5">
            {isLoading ? (
              <>
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3.25" />
              </>
            ) : (
              <>
                <h2 className="text-[16px] font-semibold text-black mb-1">
                  {userData.name}
                </h2>

                <p className="text-[#888888] text-[13px] mb-3.25">
                  @{userData.handle}
                </p>
              </>
            )}

            {/* TAGS SECTION */}
            <div className="flex flex-wrap gap-3 mb-4">
              {/* LOADING STATE */}
              {!isTagsReady &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-20 rounded-full bg-gray-200 animate-pulse"
                  />
                ))}

              {/* EMPTY STATE */}
              {isTagsReady && tags.length === 0 && (
                <p className="text-sm text-gray-400">No interests yet</p>
              )}

              {/* TAGS */}
              {isTagsReady &&
                tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3.75 py-1 border border-[#8D8D8D] rounded-full text-[12px] text-[#747474] font-medium"
                  >
                    {tag}
                  </span>
                ))}
            </div>

            {/* TABS */}
            <div className="flex items-center gap-2.75 border-y-[0.53px] border-[#00000033] py-4.75">
              {["Posts", "Replies", "Likes"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`min-w-13 text-xs transition-all px-2.5 py-2 rounded-[50px] ${
                    activeTab === tab
                      ? "bg-[#D9D9D9]"
                      : "bg-transparent hover:bg-[#d9d9d954]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* FEED */}
            <div className="py-7.75 flex flex-col items-center justify-center">
              <div className="w-full h-48 border border-[#00000033] flex items-center justify-center">
                <p className="text-gray-300 font-medium">
                  No activity to show yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
