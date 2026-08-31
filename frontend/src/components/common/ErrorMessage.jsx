import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * ErrorMessage — Kaveri Stays design system
 *
 * Props (fully backwards-compatible):
 *   message    – string; component renders nothing when falsy
 *   onDismiss  – optional dismiss handler
 */
const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-[#FDF5F5] border border-[#E8CECE] text-[#6B2C2C] my-3 transition-all"
    >
      <AlertCircle
        className="w-4 h-4 text-[#C0524A] shrink-0 mt-0.5"
        strokeWidth={1.75}
        aria-hidden="true"
      />

      <p className="flex-1 text-sm leading-relaxed font-medium">{message}</p>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error message"
          className="text-[#C0524A]/60 hover:text-[#C0524A] transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C0524A] focus-visible:ring-offset-1 rounded"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
