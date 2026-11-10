interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/novlar-icon.svg"
        alt="NOVLAR"
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
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
