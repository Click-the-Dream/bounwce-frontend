"use client";

import { onFailure, onSuccess } from "@/app/_utils/notification";

type SharePayload = {
  title?: string;
  text?: string;
  url?: string;
};

export const shareProfile = async ({
  title,
  text,
  url,
}: SharePayload): Promise<boolean> => {
  try {
    const payload: ShareData = {};

    if (title) payload.title = title;
    if (text) payload.text = text;
    if (url) payload.url = url;

    const canUseNativeShare =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (!navigator.canShare || navigator.canShare(payload));

    // Native share
    if (canUseNativeShare) {
      await navigator.share(payload);

      return true;
    }

    // Clipboard fallback
    const shareText = [title, text, url].filter(Boolean).join("\n");

    await navigator.clipboard.writeText(shareText);

    onSuccess({
      title: "Copied",
      message: "Profile link copied",
    });

    return true;
  } catch (error: any) {
    console.error("Share error:", error);

    if (error?.name === "AbortError") {
      return false;
    }

    onFailure({
      title: "Share Failed",
      message: "Unable to share profile",
    });

    return false;
  }
};
