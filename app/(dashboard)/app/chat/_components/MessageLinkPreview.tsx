"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Globe, Link2, X } from "lucide-react";
import {
  extractMessageUrls,
  getFallbackPreviewTitle,
  resolveMessageUrl,
} from "./message-links";

interface PreviewMetadata {
  title?: string;
  description?: string;
  image?: string | null;
  siteName?: string;
  url?: string;
}

interface Props {
  text: string;
  isSender: boolean;
  /** Disable navigation when showing a draft preview inside the composer. */
  interactive?: boolean;
  /** Compact WhatsApp-style preview shown above the composer input. */
  variant?: "message" | "composer";
  onDismiss?: (url: string) => void;
}

const previewCache = new Map<string, PreviewMetadata>();
const pendingRequests = new Map<string, Promise<PreviewMetadata | null>>();

const makeFallback = (url: string): PreviewMetadata => {
  const info = resolveMessageUrl(url);
  if (!info) return {};

  return {
    title: getFallbackPreviewTitle(info),
    description: info.isBouwnce
      ? "Open this page in Bouwnce."
      : `Open this link on ${info.host}.`,
    image: null,
    siteName: info.isBouwnce ? "Bouwnce" : info.host,
    url: info.href,
  };
};

const fetchPreview = (url: string) => {
  const cached = previewCache.get(url);
  if (cached) return Promise.resolve(cached);

  const pending = pendingRequests.get(url);
  if (pending) return pending;

  const request = fetch(`/api/link-preview?url=${encodeURIComponent(url)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const data = (await response.json()) as PreviewMetadata;
      if (!data || (!data.title && !data.description && !data.image))
        return null;

      const result = {
        ...data,
        title: data.title?.trim(),
        description: data.description?.trim(),
      };
      previewCache.set(url, result);
      if (previewCache.size > 150) {
        const oldestKey = previewCache.keys().next().value;
        if (oldestKey) previewCache.delete(oldestKey);
      }
      return result;
    })
    .catch(() => null)
    .finally(() => pendingRequests.delete(url));

  pendingRequests.set(url, request);
  return request;
};

const MessageLinkPreview = ({
  text,
  isSender,
  interactive = true,
  variant = "message",
  onDismiss,
}: Props) => {
  const firstUrl = extractMessageUrls(text)[0];
  const info = firstUrl?.info;
  const rawUrl = info?.href;
  const hostnameParts = info?.host.split(".") ?? [];
  const topLevelDomain = hostnameParts[hostnameParts.length - 1] || "";
  const hasCompleteHostname =
    hostnameParts.length >= 2 && topLevelDomain.length >= 2;
  const [preview, setPreview] = useState<PreviewMetadata>({});

  useEffect(() => {
    if (!rawUrl || !hasCompleteHostname) {
      setPreview({});
      return;
    }

    let cancelled = false;
    const cached = previewCache.get(rawUrl);
    setPreview(cached || makeFallback(rawUrl));

    // Debounce metadata fetching while a user is typing/editing a URL. The
    // fallback card is shown immediately, while only the final URL is fetched.
    const timer = window.setTimeout(() => {
      void fetchPreview(rawUrl).then((metadata) => {
        if (cancelled || !metadata) return;
        setPreview(metadata);
      });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [rawUrl, hasCompleteHostname]);

  // Avoid showing/fetching a preview while the user is still typing an
  // incomplete hostname such as "https://bouwnce" or "https://example.c".
  if (!info || !rawUrl || !hasCompleteHostname) return null;

  const title = preview.title || getFallbackPreviewTitle(info);
  const description =
    preview.description ||
    (info.isBouwnce
      ? "Open this page in Bouwnce."
      : `Open this link on ${info.host}.`);
  const siteName = preview.siteName || (info.isBouwnce ? "Bouwnce" : info.host);
  const cardClass = `block w-full max-w-[300px] overflow-hidden rounded-lg border text-left no-underline transition-colors ${
    isSender
      ? "border-black/10 bg-white/90 text-gray-900 hover:bg-white"
      : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
  }`;

  const card = (
    <>
      {preview.image ? (
        <img
          src={preview.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="block max-h-40 w-full bg-gray-100 object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-14 items-center gap-2 border-b border-gray-100 bg-gray-50 px-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
            {info.isBouwnce ? <Link2 size={16} /> : <Globe size={16} />}
          </span>
          <span className="min-w-0 truncate text-xs font-medium text-gray-500">
            {siteName}
          </span>
          <ArrowUpRight size={14} className="ml-auto shrink-0 text-gray-400" />
        </div>
      )}
      <div className="px-3 py-2.5">
        <p className="line-clamp-2 text-xs font-semibold leading-5">{title}</p>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-gray-500">
            {description}
          </p>
        )}
        <p className="mt-1 truncate text-[10px] text-gray-400">{info.host}</p>
      </div>
    </>
  );

  if (variant === "composer") {
    return (
      <div className="w-full" aria-live="polite">
        <div className="relative flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-[10px] bg-[#F4F4F4] px-3 py-2">
          {preview.image ? (
            <img
              src={preview.image}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-12 w-12 shrink-0 rounded-md bg-gray-200 object-cover"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white text-orange">
              {info.isBouwnce ? <Link2 size={18} /> : <Globe size={18} />}
            </span>
          )}
          <div className="min-w-0 flex-1 pr-7">
            <p className="mt-0.5 line-clamp-1 text-xs font-semibold leading-4 text-gray-900">
              {title}
            </p>
            {description && (
              <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-gray-500">
                {description}
              </p>
            )}
            <p className="mt-0.5 truncate text-[10px] text-gray-400">
              {siteName || info.host}
            </p>
          </div>
          {onDismiss && (
            <button
              type="button"
              aria-label="Dismiss link preview"
              title="Dismiss link preview"
              onClick={() => onDismiss(rawUrl)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-black/10 hover:text-gray-800"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-2 max-w-full"
      onClick={(event) => event.stopPropagation()}
    >
      {!interactive ? (
        <div className={cardClass} aria-label="Link preview">
          {card}
        </div>
      ) : info.isInternal ? (
        <Link href={info.navigationHref} className={cardClass}>
          {card}
        </Link>
      ) : (
        <a
          href={info.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cardClass}
        >
          {card}
        </a>
      )}
    </div>
  );
};

export default MessageLinkPreview;
