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
    className: 'bg-[#EAF3EE] text-[#1B4D3E] border-[#CDE3D6]',
    iconColor: 'text-[#1B4D3E]',
  },
  checked_in: {
    label: 'Checked In',
    icon: LogIn,
    className: 'bg-[#F5EDDE] text-[#7A5328] border-[#E8DAC2]',
    iconColor: 'text-[#7A5328]',
  },
  checked_out: {
    label: 'Checked Out',
    icon: LogOut,
    className: 'bg-[#EDE8E1] text-[#555E58] border-[#D8D0C5]',
    iconColor: 'text-[#555E58]',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-[#FDF2F2] text-[#8C3A3A] border-[#EACDCD]',
    iconColor: 'text-[#8C3A3A]',
  },
  no_show: {
    label: 'No Show',
    icon: AlertTriangle,
    className: 'bg-[#FBF0E4] text-[#8C581E] border-[#EAD2BA]',
    iconColor: 'text-[#8C581E]',
  },
};

const FALLBACK = {
  label: 'Unknown',
  icon: Clock,
  className: 'bg-[#F4EFEA] text-[#6A726D] border-[#E6DFD5]',
  iconColor: 'text-[#6A726D]',
};

/**
 * Returns true if the guest can cancel the booking (only confirmed bookings can be cancelled).
 * Backend state machine: confirmed → cancelled is allowed.
 *                        checked_in / checked_out / no_show → cannot cancel.
 */
export const canGuestCancel = (status) => status === 'confirmed';

/**
 * BookingStatus badge component.
 * Renders the actual backend status with icon, colour-coded pill in hospitality style.
 *
 * @param {{ status: string, size?: 'sm'|'md'|'lg' }} props
 */
const BookingStatus = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] ?? FALLBACK;
  const Icon = config.icon;

  const sizeClass = {
    sm: 'text-[10px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size] || 'text-[10px] px-2.5 py-0.5';

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size] || 'w-3 h-3';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border font-bold uppercase tracking-wider ${sizeClass} ${config.className}`}
    >
      <Icon className={`${iconSize} ${config.iconColor} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};

export default BookingStatus;
