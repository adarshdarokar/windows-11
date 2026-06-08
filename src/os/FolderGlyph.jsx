import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

/**
 * macOS Big Sur / Sonoma style blue folder.
 * Uses gradients + soft shadows for a realistic, slightly 3D look.
 * Color is intentionally fixed (system blue) to match native macOS.
 */
const FolderGlyph = forwardRef(function FolderGlyph({ className, ...props }, ref) {
  const uid = useId().replace(/:/g, "");
  const back = `fb-back-${uid}`;
  const front = `fb-front-${uid}`;
  const tab = `fb-tab-${uid}`;
  const sheen = `fb-sheen-${uid}`;
  const shadow = `fb-shadow-${uid}`;
  const inner = `fb-inner-${uid}`;

  return (
    <svg
      ref={ref}
      viewBox="0 0 80 64"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0 drop-shadow-[0_4px_8px_rgba(20,40,90,0.18)]", className)}
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <defs>
        {/* Back panel — slightly darker blue */}
        <linearGradient id={back} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7BB6F2" />
          <stop offset="100%" stopColor="#4A8FD9" />
        </linearGradient>
        {/* Tab on top of back */}
        <linearGradient id={tab} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#82BDF6" />
          <stop offset="100%" stopColor="#5DA1E5" />
        </linearGradient>
        {/* Front panel — brighter, glassy */}
        <linearGradient id={front} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9BD0FB" />
          <stop offset="55%" stopColor="#6BB1F2" />
          <stop offset="100%" stopColor="#3F86CF" />
        </linearGradient>
        {/* Sheen on the front */}
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={inner} cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={shadow} x="-20%" y="-10%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      {/* Soft contact shadow */}
      <ellipse cx="40" cy="58" rx="30" ry="3" fill="#1d3a66" opacity="0.18" filter={`url(#${shadow})`} />

      {/* Back body (peeks above) */}
      <path
        d="M8 18.5C8 15.46 10.46 13 13.5 13H30.6C32.18 13 33.7 13.62 34.83 14.74L38.6 18.5H66.5C69.54 18.5 72 20.96 72 24V46C72 49.04 69.54 51.5 66.5 51.5H13.5C10.46 51.5 8 49.04 8 46V18.5Z"
        fill={`url(#${back})`}
      />

      {/* Tab/notch shading */}
      <path
        d="M8 19C8 15.96 10.46 13.5 13.5 13.5H30.4C31.86 13.5 33.27 14.07 34.32 15.1L37.6 18.3H38.6L34.83 14.54C33.7 13.42 32.18 12.8 30.6 12.8H13.5C10.34 12.8 7.8 15.34 7.8 18.5V20H8V19Z"
        fill={`url(#${tab})`}
        opacity="0.9"
      />

      {/* Front pocket */}
      <path
        d="M8 26C8 22.96 10.46 20.5 13.5 20.5H66.5C69.54 20.5 72 22.96 72 26V46C72 49.04 69.54 51.5 66.5 51.5H13.5C10.46 51.5 8 49.04 8 46V26Z"
        fill={`url(#${front})`}
      />

      {/* Top sheen on front */}
      <path
        d="M8 26C8 22.96 10.46 20.5 13.5 20.5H66.5C69.54 20.5 72 22.96 72 26V32H8V26Z"
        fill={`url(#${sheen})`}
      />

      {/* Inner top highlight */}
      <path
        d="M10 24.5C10 22.57 11.57 21 13.5 21H66.5C68.43 21 70 22.57 70 24.5V25H10V24.5Z"
        fill={`url(#${inner})`}
      />

      {/* Subtle rim */}
      <path
        d="M8 26C8 22.96 10.46 20.5 13.5 20.5H66.5C69.54 20.5 72 22.96 72 26V46C72 49.04 69.54 51.5 66.5 51.5H13.5C10.46 51.5 8 49.04 8 46V26Z"
        stroke="#2c6db0"
        strokeOpacity="0.25"
        strokeWidth="0.6"
      />
    </svg>
  );
});

export default FolderGlyph;
