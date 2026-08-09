export function ChapelIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`chapel-illu ${className}`.trim()}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="60" cy="62" r="48" fill="rgba(232,245,160,0.1)" />
      <path
        d="M60 10v14"
        stroke="#e8f5a0"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M52 18h16"
        stroke="#e8f5a0"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M60 24l18 16H42l18-16z"
        fill="rgba(247,255,249,0.16)"
        stroke="#e8f5a0"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M46 40h28v10H46z"
        fill="rgba(247,255,249,0.12)"
        stroke="rgba(232,245,160,0.75)"
        strokeWidth="1.8"
      />
      <path
        d="M30 54l30-16 30 16v46H30V54z"
        fill="rgba(247,255,249,0.14)"
        stroke="#e8f5a0"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M38 54h44"
        stroke="rgba(232,245,160,0.55)"
        strokeWidth="1.6"
      />
      <rect
        x="52"
        y="72"
        width="16"
        height="28"
        rx="2"
        fill="rgba(15,47,44,0.45)"
        stroke="#e8f5a0"
        strokeWidth="1.8"
      />
      <path
        d="M60 72v28"
        stroke="rgba(232,245,160,0.45)"
        strokeWidth="1.4"
      />
      <rect
        x="38"
        y="66"
        width="10"
        height="12"
        rx="1.5"
        fill="rgba(232,245,160,0.22)"
        stroke="rgba(232,245,160,0.7)"
        strokeWidth="1.4"
      />
      <rect
        x="72"
        y="66"
        width="10"
        height="12"
        rx="1.5"
        fill="rgba(232,245,160,0.22)"
        stroke="rgba(232,245,160,0.7)"
        strokeWidth="1.4"
      />
      <path
        d="M38 72h10M43 66v12M72 72h10M77 66v12"
        stroke="rgba(232,245,160,0.45)"
        strokeWidth="1"
      />
      <path
        d="M26 100h68"
        stroke="rgba(232,245,160,0.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
