// Inline SVG brand icon — 4 variants: white, blue, gradient-light (peach→blue), gradient-dark (pink→blue)
// Pass a unique `id` prop when rendering multiple gradient variants on the same page
// to avoid linearGradient id collisions.

type BrainLogoVariant = "white" | "blue" | "gradient-light" | "gradient-dark";

interface BrainLogoProps {
  variant?: BrainLogoVariant;
  className?: string;
  id?: string;
}

const PATHS = (
  <>
    <path d="M 145 72 H 55 C 35 72 25 87 25 105 V 286 C 25 304 40 315 58 315 H 230 C 242 315 250 306 250 294 V 46" />
    <path d="M 75 154 H 111" />
    <path d="M 75 203 H 119" />
    <path d="M 75 252 H 155" />
    <path d="M 250 46 C 250 28 236 20 220 20 C 197 20 180 39 180 62 V 78 C 157 77 140 94 140 118 C 140 136 151 151 165 159 C 150 171 145 186 146 201 C 148 220 162 232 180 233 C 178 251 190 266 207 271 C 223 276 238 269 250 258" />
    <path d="M 280 46 C 280 29 292 20 307 20 C 326 20 337 35 337 54 C 367 53 393 67 408 89 C 422 110 424 128 420 141 C 441 149 454 167 454 187 C 454 207 441 224 420 234 C 423 257 416 278 399 292 C 381 307 357 314 330 307 C 327 326 315 335 300 335 C 286 335 280 323 280 309 Z" />
    <path d="M 280 55 V 125 H 315" />
    <circle cx="335" cy="120" r="18" />
    <path d="M 280 210 L 310 180 H 336" />
    <circle cx="355" cy="180" r="18" />
    <circle cx="330" cy="255" r="18" />
    <path d="M 330 273 V 307" />
  </>
);

const SHARED = {
  viewBox: "15 10 449 335",
  fill: "none",
  strokeWidth: 16,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BrainLogo({ variant = "gradient-light", className, id = "brainLogo" }: BrainLogoProps) {
  if (variant === "white") {
    return (
      <svg {...SHARED} stroke="white" className={className} aria-label="AI Asset Factory Brain" role="img">
        {PATHS}
      </svg>
    );
  }

  if (variant === "blue") {
    return (
      <svg {...SHARED} stroke="#006EC7" className={className} aria-label="AI Asset Factory Brain" role="img">
        {PATHS}
      </svg>
    );
  }

  const gradId = `brainGrad-${id}`;
  const stops =
    variant === "gradient-dark"
      ? { start: "#FF8F9A", mid: "#877CA8", end: "#006EC7" }
      : { start: "#FFAD86", mid: "#878A9F", end: "#006EC7" };

  return (
    <svg {...SHARED} stroke={`url(#${gradId})`} className={className} aria-label="AI Asset Factory Brain" role="img">
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="390">
          <stop offset="0%" stopColor={stops.start} />
          <stop offset="50%" stopColor={stops.mid} />
          <stop offset="100%" stopColor={stops.end} />
        </linearGradient>
      </defs>
      {PATHS}
    </svg>
  );
}
