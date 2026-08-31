import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

/**
 * CancelBookingDialog — a confirmation modal before booking cancellation.
 *
 * Shows a warning and requires explicit user confirmation before calling the cancel API.
 * Cancellation is only valid from 'confirmed' status (backend enforces this).
 *
 * @param {{
 *   bookingId: number,
 *   onConfirm: () => Promise<void>,
 *   onDismiss: () => void,
 *   isCancelling: boolean
 * }} props
 */
const CancelBookingDialog = ({ bookingId, onConfirm, onDismiss, isCancelling }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
    >
      <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-auto space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240] block">
              Reservation Management
            </span>
            <h2 id="cancel-dialog-title" className="font-serif text-2xl sm:text-3xl font-normal text-[#16231E]">
              Cancel your stay?
            </h2>
          </div>
          <button
            onClick={onDismiss}
            disabled={isCancelling}
            className="p-1.5 rounded-full text-[#7A857F] hover:text-[#16231E] hover:bg-[#EDE8E1] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message & Details */}
        <div className="space-y-4 text-[#5A635F] text-xs sm:text-sm">
          <p className="leading-relaxed">
            You are about to cancel <strong className="text-[#16231E]">Booking #{bookingId}</strong>.
          </p>

          <div className="bg-[#F4EFEA] border border-[#E6DFD5] rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-[11px] font-bold text-[#8A6240] uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-[#8A6240]" />
              <span>Please Note</span>
            </div>
            <ul className="space-y-1.5 text-xs text-[#5A635F] list-disc list-inside leading-relaxed">
              <li>Your room inventory will be released back to other guests.</li>
              <li>Your reservation record will remain visible in your booking history.</li>
              <li>This cancellation cannot be undone once confirmed.</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isCancelling}
            className="w-full sm:w-1/2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-[#EDE8E1] hover:bg-[#E2DDD5] border border-[#D8D0C5] transition-colors disabled:opacity-50 cursor-pointer text-center"
          >
            Keep my booking
          </button>

          <button
            type="button"
            id="confirm-cancel-booking-btn"
            onClick={onConfirm}
            disabled={isCancelling}
            className="w-full sm:w-1/2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#8C3A3A] hover:bg-[#782E2E] disabled:opacity-60 transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-sm text-center"
          >
            {isCancelling ? (
              <span className="animate-pulse">Cancelling...</span>
            ) : (
              <span>Cancel reservation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingDialog;
