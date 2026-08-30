import React from 'react';
import {
  CheckCircle2, Clock, LogIn, LogOut, XCircle, AlertTriangle,
} from 'lucide-react';

/**
 * Booking statuses as defined by the backend BookingStatus enum:
 *   confirmed | checked_in | checked_out | cancelled | no_show
 */
const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  checked_in: {
    label: 'Checked In',
    icon: LogIn,
    className: 'bg-blue-50 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600',
  },
  checked_out: {
    label: 'Checked Out',
    icon: LogOut,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    iconColor: 'text-slate-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-50 text-red-800 border-red-200',
    iconColor: 'text-red-500',
  },
  no_show: {
    label: 'No Show',
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-800 border-amber-200',
    iconColor: 'text-amber-600',
  },
};

const FALLBACK = {
  label: 'Unknown',
  icon: Clock,
  className: 'bg-slate-100 text-slate-600 border-slate-200',
  iconColor: 'text-slate-400',
};

/**
 * Returns true if the guest can cancel the booking (only confirmed bookings can be cancelled).
 * Backend state machine: confirmed → cancelled is allowed.
 *                        checked_in / checked_out / no_show → cannot cancel.
 */
export const canGuestCancel = (status) => status === 'confirmed';

/**
 * BookingStatus badge component.
 * Renders the actual backend status with icon, colour-coded pill.
 *
 * @param {{ status: string, size?: 'sm'|'md'|'lg' }} props
 */
const BookingStatus = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] ?? FALLBACK;
  const Icon = config.icon;

  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size] || 'text-[10px] px-2 py-0.5';

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size] || 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full border font-extrabold uppercase tracking-wider ${sizeClass} ${config.className}`}
    >
      <Icon className={`${iconSize} ${config.iconColor} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};

export default BookingStatus;
