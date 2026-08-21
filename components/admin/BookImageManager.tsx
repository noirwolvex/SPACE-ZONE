"use client";

import { useRef, useState, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, GripVertical, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import {
  ACCEPTED_BOOK_IMAGE_TYPES,
  MAX_BOOK_IMAGE_SIZE_BYTES,
  MAX_BOOK_PREVIEW_IMAGES,
  MIN_BOOK_PREVIEW_IMAGES,
  validateBookImageFile,
} from "@/lib/book-validation";

/**
 * One tile in the admin gallery editor.
 *
 * `existing` items are already stored (and carry a signed preview URL);
 * `new` items are local Files not yet uploaded. The array order is what gets
 * persisted as `sortOrder`.
 */
export interface GalleryItem {
  /** Stable React key — ids are not available for files that are not uploaded yet. */
  key: string;
  kind: "existing" | "new";
  /** BookImage id, for `existing` items. */
  id?: string;
  /** Pending upload, for `new` items. */
  file?: File;
  /** Signed URL (existing) or object URL (new). */
  previewUrl: string;
}

interface BookImageManagerProps {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  disabled?: boolean;
}

let keyCounter = 0;
function nextKey() {
  keyCounter += 1;
  return `new-${keyCounter}`;
}

export default function BookImageManager({ items, onChange, disabled = false }: BookImageManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = MAX_BOOK_PREVIEW_IMAGES - items.length;
  const isValidCount = items.length >= MIN_BOOK_PREVIEW_IMAGES && items.length <= MAX_BOOK_PREVIEW_IMAGES;
  const progress = Math.min(100, (items.length / MIN_BOOK_PREVIEW_IMAGES) * 100);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const accepted: GalleryItem[] = [];
    let rejection: string | null = null;

    for (const file of incoming) {
      if (accepted.length >= remainingSlots) {
        rejection = `Only ${MAX_BOOK_PREVIEW_IMAGES} preview images are allowed — the extra files were ignored.`;
        break;
      }

      // Same rule the server enforces, applied early for immediate feedback.
      const fileError = validateBookImageFile(file);
      if (fileError) {
        rejection = fileError;
        continue;
      }

      accepted.push({
        key: nextKey(),
        kind: "new",
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setError(rejection);
    if (accepted.length > 0) onChange([...items, ...accepted]);
  }

  function removeAt(index: number) {
    const item = items[index];
    // Release the object URL for previews that never reached the server.
    if (item.kind === "new") URL.revokeObjectURL(item.previewUrl);
    setError(null);
    onChange(items.filter((_, position) => position !== index));
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDropTarget(false);
    if (disabled) return;

    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) addFiles(files);
  }

  return (
    <div className="md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Preview Images
          <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
            {MIN_BOOK_PREVIEW_IMAGES}–{MAX_BOOK_PREVIEW_IMAGES} images shown in the storefront gallery
          </span>
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
            isValidCount
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
          }`}
        >
          {isValidCount ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
          {items.length} / {MAX_BOOK_PREVIEW_IMAGES}
        </span>
      </div>

      {/* Progress toward the 5-image minimum. */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isValidCount ? "bg-emerald-500" : "bg-amber-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDropTarget(true);
        }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={handleDrop}
        className={`mt-3 rounded-2xl border-2 border-dashed p-4 transition-all duration-300 ${
          isDropTarget
            ? "scale-[1.01] border-indigo-500 bg-indigo-50/70 shadow-lg dark:bg-indigo-950/30"
            : "border-slate-300 bg-slate-50 dark:border-indigo-500/20 dark:bg-slate-950/40"
        }`}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <UploadCloud
              className={`h-9 w-9 transition-transform duration-300 ${
                isDropTarget ? "scale-110 text-indigo-500" : "text-slate-400"
              }`}
            />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Drag &amp; drop images here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">or use the button below to choose files</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, index) => (
              <li
                key={item.key}
                draggable={!disabled}
                onDragStart={() => setDragIndex(index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) setDragOverIndex(index);
                }}
                onDragLeave={() => setDragOverIndex((current) => (current === index ? null : current))}
                onDrop={(event) => {
                  // Reordering only — a file drop is handled by the container.
                  if (event.dataTransfer.files?.length) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (dragIndex !== null) moveItem(dragIndex, index);
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-slate-900 ${
                  dragIndex === index
                    ? "scale-95 border-indigo-500 opacity-50"
                    : dragOverIndex === index
                      ? "-translate-y-1 border-indigo-500 ring-2 ring-indigo-400/50"
                      : "border-slate-200 hover:-translate-y-1 hover:shadow-md dark:border-indigo-500/20"
                } ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="h-28 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">
                    <GripVertical className="h-3 w-3 opacity-70" />
                    {index + 1}
                  </span>
                  {index === 0 ? (
                    <span className="rounded-full bg-indigo-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                      First
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                  aria-label={`Remove preview image ${index + 1}`}
                  className="absolute right-1.5 top-1.5 rounded-full bg-red-600/90 p-1.5 text-white opacity-0 transition-all duration-300 hover:scale-110 hover:bg-red-500 focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                {/* Keyboard/click reordering — drag and drop is not accessible on its own. */}
                <div className="flex items-center justify-between border-t border-slate-200 px-1.5 py-1 dark:border-indigo-500/20">
                  <button
                    type="button"
                    onClick={() => moveItem(index, index - 1)}
                    disabled={disabled || index === 0}
                    aria-label={`Move preview image ${index + 1} earlier`}
                    className="rounded p-1 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.kind === "new" ? "New" : "Saved"}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveItem(index, index + 1)}
                    disabled={disabled || index === items.length - 1}
                    aria-label={`Move preview image ${index + 1} later`}
                    className="rounded p-1 text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || remainingSlots <= 0}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <ImagePlus className="h-4 w-4" />
            Add Images
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {remainingSlots > 0
              ? `You can add ${remainingSlots} more. Max ${Math.round(MAX_BOOK_IMAGE_SIZE_BYTES / (1024 * 1024))}MB each.`
              : "Maximum number of preview images reached."}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_BOOK_IMAGE_TYPES.join(",")}
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            // Reset so picking the same file twice still fires a change event.
            event.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {error ? (
        <p className="animate-scale-in mt-2 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {items.length > 0 && !isValidCount ? (
        <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
          Add {MIN_BOOK_PREVIEW_IMAGES - items.length} more image
          {MIN_BOOK_PREVIEW_IMAGES - items.length === 1 ? "" : "s"} to reach the {MIN_BOOK_PREVIEW_IMAGES} image minimum.
        </p>
      ) : null}
    </div>
  );
}
