import React from 'react';
import { SearchX } from 'lucide-react';

/**
 * EmptyState — Kaveri Stays design system
 *
 * Props (all backwards-compatible):
 *   icon         – lucide icon component (default: SearchX)
 *   title        – heading text
 *   message      – description
 *   actionLabel  – button text
 *   onAction     – button handler
 */
const EmptyState = ({
  icon: Icon = SearchX,
  title = 'Nothing here yet',
  message = 'We could not find any items matching your criteria.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="py-16 sm:py-20 px-6 text-center max-w-sm mx-auto">
      {/* Icon — understated, not a SaaS tile */}
      <div className="w-12 h-12 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] flex items-center justify-center mx-auto mb-5">
        <Icon className="w-5 h-5 text-[#8A6240]" strokeWidth={1.5} />
      </div>

      <h3 className="font-serif text-xl font-normal text-[#16231E] mb-2">{title}</h3>
      <p className="text-sm text-[#7A857F] leading-relaxed max-w-xs mx-auto">{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-[#16231E] bg-[#EDE8E1] hover:bg-[#E0D9CF] border border-[#D8D0C5] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#253B33] focus-visible:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
