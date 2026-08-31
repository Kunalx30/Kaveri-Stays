import React from 'react';
import { Link } from 'react-router-dom';
import {
  Hash, CalendarCheck, CalendarX, Users, Eye,
  LogIn, LogOut, AlertTriangle,
} from 'lucide-react';
import BookingStatus from '../booking/BookingStatus';

const formatINR = (val) => {
  if (val == null) return null;
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
};

/**
 * StaffBookingCard — Compact operational card for staff dashboards and bookings lists.
 *
 * @param {{
 *   booking: BookingResponse,
 *   onActionTrigger?: (actionType: 'check_in' | 'check_out' | 'no_show', bookingId: number) => void
 * }} props
 */
const StaffBookingCard = ({ booking, onActionTrigger }) => {
  const {
    booking_id,
    guest_id,
    room_id,
    property_id,
    check_in_date,
    check_out_date,
    total_nights,
    guests_count,
    total_amount,
    status,
    notes,
  } = booking;

  return (
    <article className="group bg-white border border-[#E6DFD5] rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-300 space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Header: ID + Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8A6240]">
            Booking #{booking_id}
          </span>
          <BookingStatus status={status} size="sm" />
        </div>

        {/* Guest & Room Tags */}
        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold text-[#16231E] bg-[#F4EFEA] border border-[#E6DFD5] px-2.5 py-1 rounded-xl">
            Room #{room_id}
          </div>
          <div className="text-[#5A635F] text-xs">
            Guest: <strong className="text-[#16231E]">#{guest_id}</strong>
          </div>
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1 text-[#7A857F] text-[10px] uppercase font-bold tracking-wider">
              <CalendarCheck className="w-3 h-3 text-[#8A6240]" />
              <span>Check-In</span>
            </div>
            <span className="font-semibold text-[#16231E] block">{formatDate(check_in_date)}</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center space-x-1 text-[#7A857F] text-[10px] uppercase font-bold tracking-wider">
              <CalendarX className="w-3 h-3 text-[#8A6240]" />
              <span>Check-Out</span>
            </div>
            <span className="font-semibold text-[#16231E] block">{formatDate(check_out_date)}</span>
          </div>
        </div>

        {/* Stay Meta & Financials */}
        <div className="flex items-center justify-between text-xs text-[#5A635F] pt-0.5">
          <div className="flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-[#8A6240]" />
            <span>{guests_count} Guests · {total_nights || 1}N</span>
          </div>
          <span className="font-serif text-base font-semibold text-[#16231E]">
            {formatINR(total_amount)}
          </span>
        </div>

        {/* Special Requests preview */}
        {notes && (
          <p className="text-[11px] text-[#7A857F] italic truncate bg-[#F4EFEA]/50 px-2 py-1 rounded-lg">
            "{notes}"
          </p>
        )}
      </div>

      {/* Operational Actions */}
      <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between gap-2">
        <Link
          to={`/staff/bookings/${booking_id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#16231E] hover:text-[#8A6240] transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Details</span>
        </Link>

        <div className="flex items-center space-x-1.5">
          {/* Quick Check-In (only for confirmed) */}
          {status === 'confirmed' && onActionTrigger && (
            <button
              type="button"
              onClick={() => onActionTrigger('check_in', booking_id)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors cursor-pointer shadow-xs"
            >
              <LogIn className="w-3 h-3" />
              <span>Check In</span>
            </button>
          )}

          {/* Quick Check-Out (only for checked_in) */}
          {status === 'checked_in' && onActionTrigger && (
            <button
              type="button"
              onClick={() => onActionTrigger('check_out', booking_id)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white bg-[#1B4D3E] hover:bg-[#143B30] transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3 h-3" />
              <span>Check Out</span>
            </button>
          )}

          {/* Quick No-Show (only for confirmed) */}
          {status === 'confirmed' && onActionTrigger && (
            <button
              type="button"
              onClick={() => onActionTrigger('no_show', booking_id)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-[#8C581E] bg-[#FBF0E4] hover:bg-[#F5E2CC] border border-[#EAD2BA] transition-colors cursor-pointer"
              title="Mark No-Show"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>No-Show</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default StaffBookingCard;
