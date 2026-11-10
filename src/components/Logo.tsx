interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c6f53" />
            <stop offset="100%" stopColor="#1f4838" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="url(#logoGrad)" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="#5aa683" strokeWidth="2" opacity="0.5" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="#8ac4a8" strokeWidth="1.5" opacity="0.35" />
        <path
          d="M 50 24 C 57 24, 63 30, 63 37 C 63 44, 57 49, 50 54 C 43 49, 37 44, 37 37 C 37 30, 43 24, 50 24 Z"
          fill="#34d399"
        />
        <circle cx="50" cy="37" r="5" fill="#1f4838" />
        <path d="M 46 38 L 48 40 L 54 33" stroke="#1f4838" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="68" r="3" fill="#34d399" />
      </svg>
    </div>
  );
}

export default function Logo({ size = 40, showText = true, className = '', textClassName = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {showText && (
        <span className={`font-extrabold tracking-tight text-forest-800 ${textClassName}`} style={{ fontSize: size * 0.55 }}>
          NOVLAR
        </span>
      )}
    </div>
  );
}
