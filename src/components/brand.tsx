import { Shield, Crosshair } from "lucide-react";
import Link from "next/link";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Procrastination Police home">
      <span className="brand-mark">
        <Shield size={26} strokeWidth={1.7} />
        <Crosshair size={12} className="brand-cross" />
      </span>
      <span>
        PROCRASTINATION
        <span className="brand-bottom">
          POLICE<span className="brand-version"> / v1.0</span>
        </span>
      </span>
    </Link>
  );
}
export function Badge({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 300"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M130 12 238 54v109c0 57-57 102-108 125C79 265 22 220 22 163V54L130 12Z"
        fill="url(#shield-fill)"
        stroke="url(#shield-edge)"
        strokeWidth="2"
      />
      <path
        d="M130 29 222 65v96c0 48-48 88-92 109-44-21-92-61-92-109V65l92-36Z"
        stroke="#43689e"
        strokeOpacity=".35"
      />
      <path
        d="m130 79 14 29 32 5-23 23 5 32-28-15-28 15 5-32-23-23 32-5 14-29Z"
        fill="#d9e8fa"
      />
      <path d="M83 196h94M102 211h56" stroke="#7ca6e4" strokeWidth="3" />
      <text
        x="130"
        y="62"
        textAnchor="middle"
        fill="#7595c4"
        fontSize="9"
        letterSpacing="4"
      >
        ATTENTION DIVISION
      </text>
      <defs>
        <linearGradient
          id="shield-fill"
          x1="32"
          y1="40"
          x2="224"
          y2="250"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#172c49" />
          <stop offset="1" stopColor="#090f1c" />
        </linearGradient>
        <linearGradient
          id="shield-edge"
          x1="22"
          y1="100"
          x2="238"
          y2="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#3d7cf5" />
          <stop offset=".6" stopColor="#6685af" />
          <stop offset="1" stopColor="#ff4d61" />
        </linearGradient>
      </defs>
    </svg>
  );
}
