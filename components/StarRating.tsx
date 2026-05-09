"use client";

import { Star } from "lucide-react";
import clsx from "../lib/clsx";
import { RATING_GUIDE } from "../lib/types";

interface Props {
  value: number;        // 1~5
  max?: number;         // default 5
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
  label?: string;
}

// Design Insights 톤: 정교한 라인 별점 (filled = ink, empty = line)
export default function StarRating({
  value,
  max = 5,
  onChange,
  size = 16,
  readOnly = false,
  label,
}: Props) {
  const guideText = RATING_GUIDE[value] || "";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        {label && (
          <span className="text-sm text-ink-soft w-32 shrink-0">{label}</span>
        )}
        <div className="flex gap-1.5 flex-1">
          {Array.from({ length: max }).map((_, i) => {
            const filled = i < value;
            return (
              <button
                key={i}
                type="button"
                disabled={readOnly}
                onClick={() => onChange?.(i + 1)}
                className={clsx(
                  "transition",
                  !readOnly && "hover:opacity-70 cursor-pointer",
                  readOnly && "cursor-default",
                )}
                aria-label={`${i + 1}점`}
              >
                <Star
                  size={size}
                  strokeWidth={1.5}
                  className={clsx(
                    filled ? "fill-ink text-ink" : "text-line",
                  )}
                />
              </button>
            );
          })}
        </div>
        <span className="text-xs text-muted ml-1 tabular-nums">
          {value}/{max}
        </span>
      </div>
      {!readOnly && guideText && (
        <div className="text-xs text-muted ml-32 pl-3">
          {guideText}
        </div>
      )}
    </div>
  );
}
