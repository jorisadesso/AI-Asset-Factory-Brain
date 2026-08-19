import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E8956D 0%, #1B7FD4 100%)",
          borderRadius: 6,
        }}
      >
        <svg
          viewBox="0 0 32 32"
          width="22"
          height="22"
          style={{ display: "flex" }}
        >
          <path
            d="M 8 20 L 4 20 L 4 8 L 12 8 L 12 4 M 20 4 L 20 28 M 12 4 Q 20 4 20 12 Q 20 20 12 20 L 8 20"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
