import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #091428 0%, #004B87 100%)",
          borderRadius: "14px",
          border: "2px solid #FFB300",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="40"
          height="40"
          fill="none"
          stroke="#00A896"
          strokeWidth="2.5"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#00A896" fillOpacity="0.3" />
          <path d="M12 7v10" stroke="#FFE082" strokeWidth="3" />
          <path d="M7 12h10" stroke="#FFE082" strokeWidth="3" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
