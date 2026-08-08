import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="h-5 w-5 animate-spin text-primary"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <LoadingSpinner className="scale-150" />
    </div>
  );
}
