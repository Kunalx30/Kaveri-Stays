import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel, CalendarCheck, CalendarX, Users, Hash, ArrowRight } from 'lucide-react';
import BookingStatus from './BookingStatus';

/**
 * Formats a Decimal/string amount as INR currency string.
 */
const formatINR = (val) => {
  if (val == null) return null;
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

/**
 * Formats a date string for display.
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * BookingCard — displays a summary of a single booking.
 * Used in My Bookings list (MyBookings.jsx).
 *
 * @param {{ booking: BookingResponse }} props
 */
const BookingCard = ({ booking }) => {
  const {
    booking_id,
    check_in_date,
    check_out_date,
    total_nights,
    guests_count,
    nightly_rate,
    total_amount,
    status,
    notes,
    property_id,
  } = booking;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-shadow p-5 space-y-4 flex flex-col">
      {/* Top Row: Booking ID + Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span>Booking #{booking_id}</span>
        </div>
        <BookingStatus status={status} size="sm" />
      </div>

      {/* Property */}
      {property_id && (
        <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-semibold">
          <Hotel className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Property #{property_id}</span>
        </div>
      )}

      {/* Stay Dates */}
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
        <div className="bg-slate-50 rounded-lg p-2.5 space-y-0.5">
          <div className="flex items-center space-x-1 text-slate-400 font-semibold">
            <CalendarCheck className="w-3 h-3" />
            <span className="uppercase tracking-wider text-[9px]">Check-in</span>
          </div>
          <div className="font-bold text-slate-800">{formatDate(check_in_date)}</div>
        </div>

        <div className="bg-slate-50 rounded-lg p-2.5 space-y-0.5">
          <div className="flex items-center space-x-1 text-slate-400 font-semibold">
            <CalendarX className="w-3 h-3" />
            <span className="uppercase tracking-wider text-[9px]">Check-out</span>
          </div>
          <div className="font-bold text-slate-800">{formatDate(check_out_date)}</div>
        </div>
      </div>

      {/* Guests & Nights */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{guests_count} Guest{guests_count !== 1 ? 's' : ''}</span>
        </div>
        {total_nights != null && (
          <span className="font-semibold text-slate-500">{total_nights} Night{total_nights !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Pricing */}
      {nightly_rate && (
        <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3">
          <span className="text-slate-500">{formatINR(nightly_rate)}/night</span>
          {total_amount && (
            <span className="font-black text-slate-800 text-sm">Total: {formatINR(total_amount)}</span>
          )}
        </div>
      )}

      {/* Notes preview */}
      {notes && (
        <p className="text-[11px] text-slate-400 italic truncate">"{notes}"</p>
      )}

      {/* View Details CTA */}
      <div className="pt-1">
        <Link
          to={`/bookings/${booking_id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default BookingCard;
