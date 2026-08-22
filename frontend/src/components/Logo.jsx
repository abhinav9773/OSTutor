import { useId } from "react";

export default function Logo({ size = 24, className = "" }) {
  const gradId = `ostutor-logo-grad-${useId()}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="150"
          y1="90"
          x2="150"
          y2="410"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#f5c396" />
          <stop offset="55%" stopColor="#e8935f" />
          <stop offset="100%" stopColor="#b3653a" />
        </linearGradient>
      </defs>
      <path
        d="M158,88 L344,250 L158,412"
        fill="none"
        stroke="#5b3a22"
        strokeWidth="64"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M158,88 L344,250 L158,412"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="46"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
