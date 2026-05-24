"use client";

import {
  Loader2,
  X,
  Lock,
  Check,
  AtSign,
  Building2,
  BadgeCheck,
  User,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useUser from "@/app/hooks/use-user";
import { onFailure, onSuccess } from "@/app/_utils/notification";
import { useQueryClient } from "@tanstack/react-query";
import ProfileImage from "./ProfileImage";
import InterestSelector from "../../_components/InterestSelector";

interface Props {
  open: boolean;
  onClose: () => void;
  user: any;
  isOwnProfile: boolean;
}

const BIO_LIMIT = 160;

export default function EditProfileModal({
  open,
  onClose,
  user,
  isOwnProfile,
}: Props) {
  const queryClient = useQueryClient();
  const { updateCurrentUser } = useUser();
  const backdropRef = useRef<HTMLDivElement>(null);
  const [interestOpen, setInterestOpen] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    institution: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      full_name: user?.name || "",
      username: user?.handle || "",
      bio: user?.bio || "",
      institution: user?.institution || "",
    });
  }, [user]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !interestOpen) onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, interestOpen]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "bio" && value.length > BIO_LIMIT) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    updateCurrentUser.mutate(form, {
      onSuccess: () => {
        onSuccess({
          title: "Profile Updated",
          message: "Your profile has been updated successfully",
        });
        queryClient.invalidateQueries();
        onClose();
      },
      onError: () => {
        onFailure({
          title: "Update Failed",
          message: "Please try again",
        });
      },
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const bioRemaining = BIO_LIMIT - form.bio.length;

  return (
    <>
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[100] font-SFPro flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      >
        <div
          className="w-full max-w-[460px] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "calc(100vh - 2rem)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.07]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                <User className="size-3.5 text-[#888]" />
              </div>
              <div>
                <h2
                  id="edit-profile-title"
                  className="text-[14px] font-semibold text-[#111] leading-tight"
                >
                  Edit profile
                </h2>
                <p className="text-[11px] text-[#888] mt-0.5">
                  Update your public information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer w-7 h-7 rounded-full border border-black/[0.08] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
            >
              <X className="size-3.5 text-[#888]" />
            </button>
          </div>

          {/* ── AVATAR STRIP ── */}
          <div className="flex items-center gap-4 px-5 py-2 bg-[#fafafa] border-b border-black/[0.07]">
            <ProfileImage
              user={{
                id: user.id,
                name: user?.name,
                profile_pic: user?.profile_pic,
              }}
              isOwnProfile={isOwnProfile}
              size={52}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#111] truncate">
                {form.full_name || user?.name || "—"}
              </p>
              <p className="text-[11px] text-[#888] mt-0.5 truncate">
                {form.username ? `@${form.username}` : ""}
                {form.username && form.institution ? " · " : ""}
                {form.institution || ""}
              </p>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {/* Full name + Username */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#888] mb-1.5 block">
                  Full name
                </label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#bbb]" />
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full h-9 rounded-xl border border-black/10 pl-8 pr-3 text-[13px] text-[#111] placeholder:text-[#bbb] outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 transition-all bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#888] mb-1.5 block">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#bbb]" />
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="janedoe"
                    className="w-full h-9 rounded-xl border border-black/10 pl-8 pr-3 text-[13px] text-[#111] placeholder:text-[#bbb] outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 transition-all bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Institution */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#888] mb-1.5 block">
                Institution
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#bbb]" />
                <input
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  placeholder="e.g. MIT, Oxford, Google"
                  className="w-full h-9 rounded-xl border border-black/10 pl-8 pr-3 text-[13px] text-[#111] placeholder:text-[#bbb] outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 transition-all bg-white"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#888]">
                  Bio
                </label>
                <span
                  className={`text-[11px] tabular-nums transition-colors ${
                    bioRemaining <= 20 ? "text-red-400" : "text-[#bbb]"
                  }`}
                >
                  {form.bio.length} / {BIO_LIMIT}
                </span>
              </div>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Tell people a little about yourself…"
                className="w-full rounded-xl border border-black/10 p-3 text-[13px] text-[#111] placeholder:text-[#bbb] outline-none resize-none focus:border-black/30 focus:ring-2 focus:ring-black/5 transition-all leading-relaxed bg-white"
              />
            </div>

            {/* ── INTERESTS ROW ── */}
            <div className="flex items-center justify-between py-3 px-4 rounded-xl border border-black/[0.07] bg-[#fafafa]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center">
                  <Sparkles className="size-3.5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#111] leading-tight">
                    Interests
                  </p>
                  <p className="text-[11px] text-[#888] mt-0.5">
                    Topics that shape your feed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInterestOpen(true)}
                className="cursor-pointer h-8 px-4 rounded-full bg-[#111] text-white text-[12px] font-medium hover:bg-[#333] transition-colors flex items-center gap-1.5"
              >
                Edit
              </button>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="px-5 py-4 border-t border-black/[0.07] flex items-center justify-between gap-3">
            <p className="text-[11px] text-[#bbb] flex items-center gap-1.5">
              <Lock className="size-3" />
              Visible on your public profile
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-full border border-black/10 text-[13px] text-[#555] hover:bg-[#f5f5f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateCurrentUser.isPending}
                className="h-9 px-5 rounded-full bg-[#111] text-white text-[13px] font-medium hover:bg-[#333] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {updateCurrentUser.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTEREST SELECTOR (mounts above edit modal) ── */}
      <InterestSelector
        open={interestOpen}
        onClose={() => setInterestOpen(false)}
      />
    </>
  );
}
