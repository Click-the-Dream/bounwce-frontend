"use client";

import { useEffect, useState } from "react";
import FeedImageViewer from "./FeedImageViewer";
import SafeImage from "@/app/_components/SafeImage";

import {
  getMediaBlob,
  isIndexedDbMediaRef,
} from "@/app/_utils/feedMediaStorage";

type FeedMediaProps = {
  images?: string[];
  className?: string;
};

export default function FeedMedia({
  images = [],
  className = "",
}: FeedMediaProps) {
  const [resolvedImages, setResolvedImages] = useState<(string | null)[]>([]);

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  /*
   * IMPORTANT:
   * Don't use [images] as the effect dependency because the parent
   * may create a new array on every render.
   *
   * We only want the effect to rerun when the actual image values change.
   */
  const imagesKey = JSON.stringify(images);

  useEffect(() => {
    let cancelled = false;

    const objectUrls: string[] = [];

    const resolveImages = async () => {
      const resolved = await Promise.all(
        images.map(async (src) => {
          /*
           * Normal remote URL.
           */
          if (!isIndexedDbMediaRef(src)) {
            return src;
          }

          try {
            const blob = await getMediaBlob(src);

            if (!blob) {
              return null;
            }

            const objectUrl = URL.createObjectURL(blob);

            objectUrls.push(objectUrl);

            return objectUrl;
          } catch (error) {
            console.error("Failed to load feed image:", error);
            return null;
          }
        }),
      );

      if (!cancelled) {
        setResolvedImages(resolved);
      }
    };

    /*
     * Immediately show normal URLs.
     * IndexedDB-backed images remain in loading state until resolved.
     */
    setResolvedImages(
      images.map((src) => (isIndexedDbMediaRef(src) ? null : src)),
    );

    void resolveImages();

    return () => {
      cancelled = true;

      objectUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesKey]);

  if (!images.length) {
    return null;
  }

  const count = images.length;

  /*
   * 1 image = 1
   * 2 images = 2
   * 3 images = 2 +more
   * 4+ images = 4 +more
   */
  const visibleCount = count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 2 : 4;

  const visibleImages = resolvedImages.slice(0, visibleCount);

  const showMore = count > visibleCount;

  const moreCount = count - visibleCount;

  const viewerImages = resolvedImages.filter((src): src is string =>
    Boolean(src),
  );

  return (
    <>
      <div
        className={`mt-6 overflow-hidden rounded-[14px] border border-black/5 bg-[#f2f2f2] ${className}`}
      >
        <div className={count === 1 ? "grid grid-cols-1" : "grid grid-cols-2"}>
          {visibleImages.map((src, index) => {
            const isLastVisible = index === visibleImages.length - 1;

            return (
              <button
                key={`${images[index]}-${index}`}
                type="button"
                disabled={!src}
                className={`
                  group relative block overflow-hidden
                  text-left
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-orange
                  focus-visible:ring-inset
                  disabled:cursor-default

                  ${
                    visibleImages.length === 2 && index === 0
                      ? "border-r border-white"
                      : ""
                  }

                  ${
                    visibleImages.length >= 3 && index % 2 === 0
                      ? "border-r border-white"
                      : ""
                  }

                  ${
                    visibleImages.length > 2 && index > 1
                      ? "border-t border-white"
                      : ""
                  }
                `}
                onClick={(event) => {
                  event.stopPropagation();

                  if (!src) {
                    return;
                  }

                  /*
                   * resolvedImages can contain null while IndexedDB
                   * media is still loading. Because the viewer receives
                   * filtered images, convert the original index to the
                   * viewer's actual index.
                   */
                  const resolvedIndex =
                    resolvedImages
                      .slice(0, index + 1)
                      .filter((image): image is string => Boolean(image))
                      .length - 1;

                  setViewerIndex(resolvedIndex >= 0 ? resolvedIndex : 0);
                }}
                aria-label={`Open image ${index + 1} of ${count}`}
              >
                {src ? (
                  <SafeImage
                    src={src}
                    alt=""
                    width={600}
                    height={600}
                    className={`
                      block w-full object-cover
                      transition duration-200
                      group-hover:scale-[1.01]

                      ${
                        count === 1
                          ? "max-h-97.5"
                          : "aspect-[1.05/1] sm:aspect-[1.35/1]"
                      }
                    `}
                  />
                ) : (
                  <div
                    className={`
                      w-full animate-pulse bg-[#eeeeee]

                      ${
                        count === 1
                          ? "h-100"
                          : "aspect-[1.05/1] sm:aspect-[1.35/1]"
                      }
                    `}
                  />
                )}

                {showMore && isLastVisible && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-base font-medium text-white">
                    +{moreCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <FeedImageViewer
        images={viewerImages}
        startIndex={viewerIndex ?? 0}
        open={viewerIndex !== null && viewerImages.length > 0}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}
