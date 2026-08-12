/**
 * Loading Skeleton Component
 * Phase 4.9: Reusable skeleton loader for better UX
 */

import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses.text} ${
              index < lines - 1 ? 'mb-2' : ''
            }`}
            style={index === lines - 1 ? style : { ...style, width: width || '100%' }}
            role="status"
            aria-label="Loading"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
    />
  );
};

// Pre-configured skeletons
export const CardSkeleton = () => (
  <div className="p-6 space-y-4 border rounded-lg">
    <LoadingSkeleton variant="text" width="60%" height={24} />
    <LoadingSkeleton variant="text" width="80%" height={16} lines={2} />
    <LoadingSkeleton variant="rectangular" width="100%" height={120} />
  </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex space-x-4">
        <LoadingSkeleton variant="text" width="20%" height={16} />
        <LoadingSkeleton variant="text" width="30%" height={16} />
        <LoadingSkeleton variant="text" width="25%" height={16} />
        <LoadingSkeleton variant="text" width="25%" height={16} />
      </div>
    ))}
  </div>
);

