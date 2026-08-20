"use client";

import { useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
} from "lucide-react";
import Cropper from "react-easy-crop";
import { Portal } from "@/app/protocols/Portal";
import { onSuccess } from "@/app/_utils/notification";
import useUser from "@/app/hooks/use-user";
import UserImage from "../UserImage";
import { useOnboarding } from "@/app/context/OnboardingProvider";

const MandatoryProfileGuard = () => {
  const { user, mustUpdateProfile, refreshUser } = useOnboarding();
  const { uploadProfilePicture } = useUser();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!mustUpdateProfile || !user) return null;

  const pickImage = () => fileRef.current?.click();

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Please choose an image smaller than 10 MB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    };
    reader.onerror = () =>
      setError("We couldn't read that image. Please try another one.");
    reader.readAsDataURL(file);
  };

  const closeCropper = () => {
    if (uploadProfilePicture.isPending) return;
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
  };

  const upload = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError("Adjust the photo first.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const image = new window.Image();
      image.src = imageSrc;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not load image"));
      });

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not prepare image");

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );

      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("Could not create image")),
          "image/jpeg",
          0.9,
        ),
      );

      await uploadProfilePicture.mutateAsync({
        file: new File([blob], "profile.jpg", { type: "image/jpeg" }),
        fieldName: "picture",
      });

      setImageSrc(null);
      setError(null);
      onSuccess({
        title: "Profile photo added",
        message: "Your Bouwnce profile is ready.",
      });
      await refreshUser();
    } catch (err: any) {
      console.error("[ONBOARDING PROFILE] Upload failed", err);
      setError(
        err?.response?.data?.message ||
          "We couldn't upload that photo. Please try again.",
      );
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />

      <div className="fixed inset-0 z-10000 overflow-y-auto bg-[#211915]/75 backdrop-blur-md">
        <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6">
          <section
            className="w-full max-w-140 overflow-hidden rounded-[30px] border border-white/70 bg-[#fffdfb] shadow-[0_35px_110px_rgba(27,15,10,0.32)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mandatory-profile-title"
          >
            <div className="px-5 pt-5 sm:px-8 sm:pt-8">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange/15 bg-orange/[0.07] px-3 py-1.5 text-[11px] font-bold text-[#d84223]">
                  <Sparkles className="size-3.5" />
                  Finish your profile
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#aaa09a]">
                  Required
                </span>
              </div>

              <div className="mt-6 text-center">
                <h2
                  id="mandatory-profile-title"
                  className="text-[27px] font-bold tracking-[-0.045em] text-[#171413] sm:text-[32px]"
                >
                  Put a face to your Bouwnce
                </h2>
                <p className="mx-auto mt-2 max-w-110 text-[13px] leading-6 text-[#716a66] sm:text-[14px]">
                  Add a profile photo so people can recognize you when they
                  discover and connect with you.
                </p>
              </div>

              <button
                type="button"
                data-tour="mandatory-profile-photo"
                onClick={pickImage}
                className="group relative mx-auto mt-7 block w-full max-w-82.5 rounded-[26px] border border-dashed border-orange/30 bg-[#fff7f3] p-5 text-center transition hover:border-orange/55 hover:bg-[#fff3ee]"
              >
                <div className="mx-auto flex size-34 items-center justify-center rounded-full bg-linear-to-br from-orange via-[#ff6a4f] to-[#ffb19f] p-0.75 shadow-[0_18px_45px_rgba(255,75,43,0.18)]">
                  <div className="flex size-full items-center justify-center rounded-full bg-[#fffdfb]">
                    {user.profile_pic ? (
                      <UserImage user={user} size={124} />
                    ) : (
                      <div className="flex size-31 items-center justify-center rounded-full bg-[#f5e8e1] text-[#b75d45]">
                        <ImagePlus className="size-10" strokeWidth={1.6} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-[14px] font-bold text-[#241e1b]">
                  <Camera className="size-4 text-orange" />
                  Choose profile photo
                </div>
                <p className="mt-1 text-[11px] text-[#8e8580]">
                  JPG, PNG or WEBP · up to 10 MB
                </p>
              </button>

              {error && (
                <div className="mx-auto mt-3 max-w-82.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[12px] font-medium text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  [Camera, "People recognize you"],
                  [CheckCircle2, "Build trust faster"],
                  [ShieldCheck, "You control your profile"],
                ].map(([Icon, label]) => {
                  const ItemIcon = Icon as typeof Camera;
                  return (
                    <div
                      key={label as string}
                      className="rounded-2xl border border-black/6 bg-white px-3.5 py-3"
                    >
                      <ItemIcon className="size-4 text-orange" />
                      <p className="mt-2 text-[11px] font-semibold text-[#3c3734]">
                        {label as string}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 border-t border-black/6 bg-[#faf6f3] px-5 py-4 sm:px-8">
              <p className="text-center text-[11px] leading-5 text-[#8d8580]">
                This is the only thing you need to finish before exploring
                Bouwnce.
              </p>
            </div>
          </section>
        </div>
      </div>

      {imageSrc && (
        <Portal>
          <div className="fixed inset-0 z-11000 flex items-center justify-center bg-[#14100e]/85 p-3 backdrop-blur-md sm:p-6">
            <div className="w-full max-w-130 overflow-hidden rounded-[28px] border border-white/10 bg-[#fffdfb] shadow-[0_40px_120px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between border-b border-black/6 px-5 py-4">
                <div>
                  <p className="text-[15px] font-bold text-[#171413]">
                    Perfect the photo
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8b837e]">
                    Move, zoom and frame yourself naturally.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCropper}
                  className="flex size-9 items-center justify-center rounded-full border border-black/10 hover:bg-[#f5f1ee]"
                  aria-label="Cancel photo"
                >
                  <X className="size-4 text-[#666]" />
                </button>
              </div>

              <div className="relative h-[min(58vh,380px)] bg-[#151210]">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_area, areaPixels) =>
                    setCroppedAreaPixels(areaPixels)
                  }
                  style={{
                    cropAreaStyle: {
                      border: "2px solid rgba(255,255,255,0.92)",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.58)",
                    },
                  }}
                />
              </div>

              <div className="flex items-center gap-3 border-b border-black/6 px-5 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(1))))
                  }
                  className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-white"
                >
                  <ZoomOut className="size-4" />
                </button>
                <input
                  aria-label="Zoom"
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-orange"
                />
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(1))))
                  }
                  className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-white"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                  }}
                  className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-white"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>

              <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={closeCropper}
                  disabled={uploadProfilePicture.isPending}
                  className="h-11 rounded-full border border-black/10 px-5 text-[13px] font-semibold text-[#514a46]"
                >
                  Change photo
                </button>
                <button
                  type="button"
                  onClick={upload}
                  disabled={
                    uploadProfilePicture.isPending || !croppedAreaPixels
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-orange px-6 text-[13px] font-bold text-white shadow-[0_12px_28px_rgba(255,75,43,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadProfilePicture.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {uploadProfilePicture.isPending
                    ? "Uploading…"
                    : "Use this photo"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export { MandatoryProfileGuard };
