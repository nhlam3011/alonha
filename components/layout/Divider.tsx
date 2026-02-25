function StarIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ChevronRightIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function Divider({
  className = "",
  leftIcon = <StarIcon size={16} className="text-[var(--primary)]" />,
  rightIcon = <ChevronRightIcon size={16} className="text-[var(--primary)]" />
}: {
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-4 py-12 ${className}`}>
      <div className="h-px flex-1 bg-[var(--border)]" />
      <div className="flex items-center gap-2">
        {leftIcon}
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--primary)]">Danh mục nổi bật</span>
        {rightIcon}
      </div>
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  );
}
