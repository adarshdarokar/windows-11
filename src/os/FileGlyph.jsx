import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * macOS Big Sur / Sonoma style document icon.
 * `variant` controls accent: text | code | image | pdf | generic
 */
const FileGlyph = forwardRef(function FileGlyph(
  { className, variant = "generic", ...props },
  ref
) {
  const uid = useId().replace(/:/g, "");
  const paper = `fg-paper-${uid}`;
  const fold = `fg-fold-${uid}`;
  const badge = `fg-badge-${uid}`;
  const sheen = `fg-sheen-${uid}`;

  const palette = {
    generic: { badge1: "#9CA3AF", badge2: "#6B7280", label: "DOC" },
    text:    { badge1: "#60A5FA", badge2: "#3B82F6", label: "TXT" },
    code:    { badge1: "#A78BFA", badge2: "#7C3AED", label: "{ }" },
    image:   { badge1: "#F472B6", badge2: "#DB2777", label: "IMG" },
    pdf:     { badge1: "#F87171", badge2: "#DC2626", label: "PDF" },
  }[variant] || { badge1: "#9CA3AF", badge2: "#6B7280", label: "DOC" };

  return (
    <svg
      ref={ref}
      viewBox="0 0 64 80"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 drop-shadow-[0_4px_8px_rgba(20,40,90,0.18)]", className)}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <defs>
        <linearGradient id={paper} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8EDF3" />
        </linearGradient>
        <linearGradient id={fold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D2DAE3" />
          <stop offset="100%" stopColor="#AFB9C5" />
        </linearGradient>
        <linearGradient id={badge} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.badge1} />
          <stop offset="100%" stopColor={palette.badge2} />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* contact shadow */}
      <ellipse cx="32" cy="74" rx="22" ry="2.5" fill="#1d3a66" opacity="0.16" />

      {/* paper */}
      <path
        d="M10 8C10 5.79 11.79 4 14 4H40L54 18V68C54 70.21 52.21 72 50 72H14C11.79 72 10 70.21 10 68V8Z"
        fill={`url(#${paper})`}
        stroke="#C2CCD7"
        strokeWidth="0.6"
      />
      {/* corner fold */}
      <path d="M40 4L54 18H44C41.79 18 40 16.21 40 14V4Z" fill={`url(#${fold})`} />
      <path d="M40 4L54 18H44C41.79 18 40 16.21 40 14V4Z" stroke="#9AA6B2" strokeWidth="0.5" />

      {/* sheen */}
      <path
        d="M10 8C10 5.79 11.79 4 14 4H40V14C40 16.21 41.79 18 44 18H54V28H10V8Z"
        fill={`url(#${sheen})`}
        opacity="0.55"
      />

      {/* lines */}
      <rect x="16" y="36" width="32" height="2.2" rx="1.1" fill="#C9D1DB" />
      <rect x="16" y="42" width="28" height="2.2" rx="1.1" fill="#C9D1DB" />
      <rect x="16" y="48" width="30" height="2.2" rx="1.1" fill="#C9D1DB" />

      {/* type badge */}
      <rect x="8" y="52" width="32" height="14" rx="3" fill={`url(#${badge})`} />
      <text
        x="24"
        y="62"
        textAnchor="middle"
        fontFamily="-apple-system, 'SF Pro Text', system-ui, sans-serif"
        fontWeight="800"
        fontSize="8"
        fill="#ffffff"
        letterSpacing="0.5"
      >
        {palette.label}
      </text>
    </svg>
  );
});

export default FileGlyph;
