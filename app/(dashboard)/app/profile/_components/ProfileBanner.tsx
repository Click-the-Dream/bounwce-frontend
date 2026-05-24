import { useRef, useState } from "react";
import Image from "next/image";
import {
  ImageIcon,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
} from "lucide-react";
import Cropper from "react-easy-crop";
import { onSuccess } from "@/app/_utils/notification";
import useUser from "@/app/hooks/use-user";

import profileBg from "../../../../assets/buyer/profile-bg.jpg";
import { Portal } from "@/app/protocols/Portal";

type ProfileBannerProps = {
  user: { profile_banner?: string | null };
  isOwnProfile: boolean;
};

const BANNER_ASPECT = 500 / 130; // matches your h-31.25 / w-full ratio (~3.85:1)

const ProfileBanner = ({ user, isOwnProfile }: ProfileBannerProps) => {
  const { uploadProfilePicture } = useUser(); // wire up your mutation here

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [openCrop, setOpenCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after cancel
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setOpenCrop(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_: any, cropped: any) => {
    setCroppedAreaPixels(cropped);
  };

  const handleCancel = () => {
    setOpenCrop(false);
    setImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const canvas = document.createElement("canvas");
      const image = new window.Image();
      image.src = imageSrc;
      await new Promise((resolve) => (image.onload = resolve));
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d")!;
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
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.92),
      );
      const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
      await uploadProfilePicture.mutateAsync({
        file,
        fieldName: "profile_banner",
      });
      setOpenCrop(false);
      setImageSrc(null);
      onSuccess({ title: "Updated", message: "Banner photo updated" });
    } catch {}
  };

  const bannerSrc = user?.profile_banner ?? profileBg.src;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePickImage}
      />

      {/* BANNER + EDIT BUTTON */}
      <div className="relative">
        <Image
          src={bannerSrc}
          alt="profile-banner"
          width={500}
          height={130}
          className="w-full h-31.25 object-cover"
        />
        {isOwnProfile && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-5 h-5 absolute top-1.25 right-2 bg-[#D9D9D9] p-1.5 rounded-md shadow-md border border-white flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
            aria-label="Change banner photo"
          >
            <ImageIcon size={10} className="text-black" />
          </button>
        )}
      </div>

      {/* CROPPER MODAL */}
      {isOwnProfile && openCrop && (
        <Portal>
          <div
            className="fixed inset-0 z-1000 flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.07]">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#111]">
                    Adjust banner
                  </h3>
                  <p className="text-[11px] text-[#888] mt-0.5">
                    Drag to reposition · Pinch or scroll to zoom
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-7 h-7 rounded-full border border-black/8 flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
                  aria-label="Cancel"
                >
                  <X size={13} className="text-[#666]" />
                </button>
              </div>

              {/* CROP AREA — wider, banner-shaped */}
              <div
                className="relative w-full bg-[#111]"
                style={{ height: 240 }}
              >
                <Cropper
                  image={imageSrc || ""}
                  crop={crop}
                  zoom={zoom}
                  aspect={BANNER_ASPECT}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{
                    containerStyle: { borderRadius: 0 },
                    cropAreaStyle: {
                      border: "2px solid rgba(255,255,255,0.85)",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                    },
                    mediaStyle: {},
                  }}
                />
              </div>

              {/* ZOOM CONTROLS */}
              <div className="px-5 py-3 border-b border-black/[0.07] flex items-center gap-3">
                <button
                  onClick={() =>
                    setZoom((z) => Math.max(1, +(z - 0.1).toFixed(1)))
                  }
                  className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
                  aria-label="Zoom out"
                >
                  <ZoomOut size={13} className="text-[#555]" />
                </button>

                <div className="flex-1 relative flex items-center">
                  <div className="absolute inset-x-0 h-0.5 rounded-full bg-lighter-ash" />
                  <div
                    className="absolute left-0 h-0.5 rounded-full bg-[#111] transition-all"
                    style={{ width: `${((zoom - 1) / 2) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="relative w-full appearance-none bg-transparent cursor-pointer"
                    style={{ height: 20 }}
                    aria-label="Zoom"
                  />
                </div>

                <button
                  onClick={() =>
                    setZoom((z) => Math.min(3, +(z + 0.1).toFixed(1)))
                  }
                  className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
                  aria-label="Zoom in"
                >
                  <ZoomIn size={13} className="text-[#555]" />
                </button>

                <button
                  onClick={() => {
                    setZoom(1);
                    setCrop({ x: 0, y: 0 });
                  }}
                  className="w-7 h-7 rounded-full border border-black/10 flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
                  aria-label="Reset"
                >
                  <RotateCcw size={12} className="text-[#555]" />
                </button>
              </div>

              {/* FOOTER */}
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  onClick={handleCancel}
                  className="h-9 px-4 rounded-full border border-black/10 text-[13px] text-[#555] hover:bg-[#f5f5f5] transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpload}
                  disabled={uploadProfilePicture.isPending}
                  className="h-9 px-5 rounded-full bg-[#111] text-white text-[13px] font-medium flex items-center gap-2 hover:bg-[#333] transition-colors disabled:opacity-60"
                >
                  {uploadProfilePicture.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      Apply banner
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default ProfileBanner;
