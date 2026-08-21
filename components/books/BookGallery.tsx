"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from "lucide-react";
import type { BookImageView } from "@/lib/book-types";

interface BookGalleryProps {
  /** Cover first, then the preview images — all already signed on the server. */
  coverImageUrl: string | null;
  images: BookImageView[];
  title: string;
}

/**
 * Details-page gallery: one large preview, a thumbnail rail, and a fullscreen
 * lightbox.
 *
 * Every slide is rendered stacked and cross-faded with opacity, so switching is
 * smooth and no image is re-fetched when the selection changes.
 */
export default function BookGallery({ coverImageUrl, images, title }: BookGalleryProps) {
  const slides = [
    ...(coverImageUrl ? [{ id: "cover", url: coverImageUrl, label: "Cover" }] : []),
    ...images.map((image, index) => ({ id: image.id, url: image.url, label: `Preview ${index + 1}` })),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const count = slides.length;
  const safeIndex = count > 0 ? Math.min(activeIndex, count - 1) : 0;

  const step = useCallback(
    (direction: -1 | 1) => {
      setActiveIndex((current) => (current + direction + count) % count);
    },
    [count]
  );

  // Arrow keys move through the gallery; Escape leaves the lightbox.
  useEffect(() => {
    if (count === 0) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "Escape") setIsZoomed(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count, step]);

  // Prevent the page behind the lightbox from scrolling while it is open.
  useEffect(() => {
    if (!isZoomed) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isZoomed]);

  if (count === 0) {
    return (
      <div className="flex aspect-4/3 w-full items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-col items-center gap-2">
          <ImageOff className="h-8 w-8" />
          <span className="text-sm font-medium">No preview images yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {/* Large preview --------------------------------------------------- */}
      <div className="group relative aspect-4/3 w-full overflow-hidden rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-100 to-slate-200 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.6)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        {slides.map((slide, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.id}
            src={slide.url}
            alt={`${title} — ${slide.label}`}
            aria-hidden={index !== safeIndex}
            className={`absolute inset-0 h-full w-full object-contain transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              index === safeIndex ? "scale-100 opacity-100" : "scale-105 opacity-0"
            }`}
          />
        ))}

        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          aria-label="View image fullscreen"
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2.5 text-slate-800 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white focus:opacity-100 group-hover:opacity-100 dark:bg-slate-900/90 dark:text-white"
        >
          <Expand className="h-4 w-4" />
        </button>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-800 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white focus:opacity-100 group-hover:opacity-100 dark:bg-slate-900/90 dark:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-800 opacity-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-white focus:opacity-100 group-hover:opacity-100 dark:bg-slate-900/90 dark:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Progress dots double as a position indicator. */}
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5">
              {slides.map((slide, index) => (
                <span
                  key={slide.id}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === safeIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Thumbnail rail --------------------------------------------------- */}
      {count > 1 ? (
        <ul className="scrollbar-slim flex gap-3 overflow-x-auto pb-2">
          {slides.map((slide, index) => (
            <li key={slide.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${slide.label}`}
                aria-current={index === safeIndex}
                className={`relative block h-20 w-20 overflow-hidden rounded-2xl border-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-24 sm:w-24 ${
                  index === safeIndex
                    ? "-translate-y-1 border-indigo-500 shadow-lg shadow-indigo-500/25"
                    : "border-transparent opacity-60 hover:-translate-y-1 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slide.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Lightbox --------------------------------------------------------- */}
      {isZoomed ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} gallery`}
          onClick={() => setIsZoomed(false)}
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            aria-label="Close fullscreen"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition hover:scale-110 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slides[safeIndex].url}
            alt={`${title} — ${slides[safeIndex].label}`}
            onClick={(event) => event.stopPropagation()}
            className="animate-scale-in max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          />

          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous image"
                className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition hover:scale-110 hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                aria-label="Next image"
                className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition hover:scale-110 hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <span className="absolute bottom-6 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white tabular-nums">
                {safeIndex + 1} / {count}
              </span>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
