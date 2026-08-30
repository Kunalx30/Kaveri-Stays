import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 animate-fadeIn">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 id="cancel-dialog-title" className="text-base font-black text-slate-900">
              Cancel Booking?
            </h2>
          </div>
          <button
            onClick={onDismiss}
            disabled={isCancelling}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-sm text-slate-700">
            Are you sure you want to cancel <strong>Booking #{bookingId}</strong>?
          </p>
          <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
            <li>The room will be released back to inventory.</li>
            <li>The booking record will be preserved for your history.</li>
            <li>This action cannot be undone.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isCancelling}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Keep Booking
          </button>
          <button
            type="button"
            id="confirm-cancel-booking-btn"
            onClick={onConfirm}
            disabled={isCancelling}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isCancelling ? (
              <span className="animate-pulse">Cancelling...</span>
            ) : (
              <span>Yes, Cancel</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelBookingDialog;
