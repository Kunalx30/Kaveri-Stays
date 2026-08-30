import React from 'react';
import { LogIn, LogOut, AlertTriangle, X, Loader2 } from 'lucide-react';

const ACTION_CONFIG = {
  check_in: {
    title: 'Confirm Guest Check-In',
    desc: 'This will transition the reservation to Checked In status. Ensure the guest is physically present and identity is verified.',
    confirmLabel: 'Confirm Check-In',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    icon: LogIn,
    iconBg: 'bg-blue-100 text-blue-600',
  },
  check_out: {
    title: 'Confirm Guest Check-Out',
    desc: 'This will transition the reservation to Checked Out status and release the room for housekeeping. Ensure any incidental balances are settled.',
    confirmLabel: 'Complete Check-Out',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    icon: LogOut,
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  no_show: {
    title: 'Mark as No-Show',
    desc: 'This will mark the reservation as No-Show and release the room inventory back to available stock. This action is terminal.',
    confirmLabel: 'Mark No-Show',
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    icon: AlertTriangle,
    iconBg: 'bg-amber-100 text-amber-600',
  },
};

/**
 * OperationalActionDialog — Confirmation modal for staff booking operations (Check-In, Check-Out, No-Show).
 *
 * @param {{
 *   actionType: 'check_in' | 'check_out' | 'no_show',
 *   bookingId: number,
 *   onConfirm: () => Promise<void>,
 *   onDismiss: () => void,
 *   isLoading: boolean
 * }} props
 */
const OperationalActionDialog = ({
  actionType,
  bookingId,
  onConfirm,
  onDismiss,
  isLoading,
}) => {
  const config = ACTION_CONFIG[actionType] || ACTION_CONFIG.check_in;
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="op-action-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 animate-fadeIn">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h2 id="op-action-title" className="text-base font-black text-slate-900">
              {config.title}
            </h2>
          </div>
          <button
            onClick={onDismiss}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">
            Booking ID: <strong>#{bookingId}</strong>
          </p>
          <p className="text-slate-500 leading-relaxed">
            {config.desc}
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-operational-action-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60 ${config.btnClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{config.confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationalActionDialog;
