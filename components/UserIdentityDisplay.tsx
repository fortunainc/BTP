'use client';

interface UserIdentityDisplayProps {
  handle: string;
  roleTitle?: string | null;
  organizationType?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserIdentityDisplay({
  handle,
  roleTitle,
  organizationType,
  size = 'sm',
}: UserIdentityDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const hasContext = roleTitle && organizationType;

  return (
    <div className="flex flex-col">
      <div
        className={`font-bold text-white ${sizeClasses[size]} mb-0.5`}
      >
        {handle}
      </div>
      {hasContext && (
        <div
          className={`text-slate-400 ${sizeClasses.sm} font-medium`}
        >
          {roleTitle} — {organizationType}
        </div>
      )}
    </div>
  );
}