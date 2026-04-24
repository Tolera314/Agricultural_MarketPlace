import React from 'react';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}

interface SectionSkeletonProps {
  minHeight?: string;
  title?: boolean;
}

export function SectionSkeleton({ minHeight = 'min-h-[400px]', title = true }: SectionSkeletonProps) {
  return (
    <section className={`w-full py-24 flex flex-col items-center justify-center ${minHeight} bg-bg-warm/50 border-y border-slate-50`}>
      <div className="max-w-7xl w-full mx-auto px-6 flex flex-col items-center">
        {title && (
          <>
            <Skeleton className="h-10 w-3/4 max-w-md mb-6" />
            <Skeleton className="h-4 w-full max-w-2xl mb-16" />
          </>
        )}
        
        <div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-6 w-2/3 mt-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
