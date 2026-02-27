import React from 'react';
import { cn } from '@/lib/utils';

/**
 * A centralized PageHeader component to ensure consistency across all pages.
 * Controls heading size, weight, and color from one place.
 */
const PageHeader = ({ 
  title, 
  description, 
  actions, 
  className,
  titleClassName,
  descriptionClassName
}) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className={cn("text-2xl font-bold text-slate-800 tracking-tight", titleClassName)}>
          {title}
        </h1>
        {description && (
          <p className={cn("text-sm font-medium text-slate-500", descriptionClassName)}>
            {description}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
