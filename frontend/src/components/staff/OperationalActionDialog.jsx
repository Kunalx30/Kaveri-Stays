import React from 'react';
import { LogIn, LogOut, AlertTriangle, X, Loader2 } from 'lucide-react';

const ACTION_CONFIG = {
  check_in: {
    title: 'Confirm Guest Check-In',
    desc: 'This will transition the reservation to Checked In status. Ensure the guest is physically present at the retreat and identity is verified.',
    confirmLabel: 'Confirm Check-In',
    btnClass: 'bg-[#16231E] hover:bg-[#253B33] text-white',
    icon: LogIn,
    iconBg: 'bg-[#F4EFEA] text-[#8A6240] border border-[#E6DFD5]',
  },
  check_out: {
    title: 'Confirm Guest Check-Out',
    desc: 'This will transition the reservation to Checked Out status and release the room for housekeeping turnover. Ensure any remaining balances are settled.',
    confirmLabel: 'Complete Check-Out',
    btnClass: 'bg-[#1B4D3E] hover:bg-[#143B30] text-white',
    icon: LogOut,
    iconBg: 'bg-[#EAF3EE] text-[#1B4D3E] border border-[#CDE3D6]',
  },
  no_show: {
    title: 'Mark as No-Show',
    desc: 'This will mark the reservation as No-Show and release the room inventory back to available stock. This operational action is final.',
    confirmLabel: 'Mark No-Show',
    btnClass: 'bg-[#8C581E] hover:bg-[#744715] text-white',
    icon: AlertTriangle,
    iconBg: 'bg-[#FBF0E4] text-[#8C581E] border border-[#EAD2BA]',
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

  const handleDismiss = () => {
    if (isLoading) return;
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="op-action-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E6DFD5] p-6 sm:p-7 max-w-md w-full space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h2 id="op-action-title" className="text-base font-bold text-[#16231E]">
              {config.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isLoading}
            className="text-[#7A857F] hover:text-[#16231E] transition-colors cursor-pointer disabled:opacity-50 p-1 -mt-0.5"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs text-[#5A635F]">
          <p className="font-semibold text-[#16231E]">
            Reservation: <strong className="text-[#8A6240]">#{bookingId}</strong>
          </p>
          <p className="leading-relaxed text-[#7A857F]">
            {config.desc}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#16231E] bg-[#EDE8E1] hover:bg-[#E2DDD5] border border-[#D8D0C5] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-operational-action-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60 shadow-sm ${config.btnClass}`}
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
