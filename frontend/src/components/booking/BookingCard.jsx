import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel, Users, ArrowRight, Clock } from 'lucide-react';
import BookingStatus from './BookingStatus';

/**
 * Formats a Decimal/string amount as INR currency string.
 */
const formatINR = (val) => {
  if (val == null) return null;
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

/**
 * Formats a date string for display.
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
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
    <article className="group bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-5">
      
      {/* Top Row: Reference + Status Badge */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8A6240]">
          Reservation #{booking_id}
        </span>
        <BookingStatus status={status} size="sm" />
      </div>

      {/* Property Section */}
      <div className="space-y-1">
        <div className="flex items-center space-x-1.5 text-xs text-[#5A635F] font-semibold">
          <Hotel className="w-3.5 h-3.5 text-[#8A6240] shrink-0" />
          <span>{property_id ? `Kaveri Stays Sanctuary (Property #${property_id})` : 'Kaveri Stays Retreat'}</span>
        </div>
        <h3 className="font-serif text-xl font-normal text-[#16231E]">
          Riverside Getaway
        </h3>
      </div>

      {/* Stay Dates (Large Itinerary Box) */}
      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD5]">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-[#8A6240] block">
            Check-In
          </span>
          <p className="font-serif text-sm sm:text-base font-semibold text-[#16231E] mt-0.5">
            {formatDate(check_in_date)}
          </p>
        </div>

        <div className="border-l border-[#E6DFD5] pl-3.5">
          <span className="text-[9px] uppercase font-bold tracking-wider text-[#8A6240] block">
            Check-Out
          </span>
          <p className="font-serif text-sm sm:text-base font-semibold text-[#16231E] mt-0.5">
            {formatDate(check_out_date)}
          </p>
        </div>
      </div>

      {/* Guest Information & Duration */}
      <div className="flex items-center justify-between text-xs text-[#5A635F] pt-1">
        <div className="flex items-center space-x-1.5">
          <Users className="w-3.5 h-3.5 text-[#8A6240]" />
          <span>{guests_count} {guests_count === 1 ? 'Guest' : 'Guests'}</span>
        </div>
        {total_nights != null && (
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[#8A6240]" />
            <span>{total_nights} {total_nights === 1 ? 'Night' : 'Nights'}</span>
          </div>
        )}
      </div>

      {/* Notes preview if present */}
      {notes && (
        <div className="p-2.5 rounded-xl bg-[#F4EFEA] text-[11px] text-[#7A857F] italic truncate">
          "{notes}"
        </div>
      )}

      {/* Price & Action Row */}
      <div className="pt-4 border-t border-[#E6DFD5] flex items-center justify-between gap-3">
        <div>
          {total_amount ? (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#7A857F] block">Total Stay</span>
              <p className="text-base sm:text-lg font-serif font-semibold text-[#16231E] leading-tight">
                {formatINR(total_amount)}
              </p>
            </div>
          ) : nightly_rate ? (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#7A857F] block">Rate</span>
              <p className="text-sm font-semibold text-[#16231E]">{formatINR(nightly_rate)} / night</p>
            </div>
          ) : (
            <span className="text-xs text-[#7A857F]">Seasonal Booking</span>
          )}
        </div>

        <Link
          to={`/bookings/${booking_id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#16231E] group-hover:text-[#253B33] transition-colors"
        >
          <span>View Reservation</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

    </article>
  );
};

export default BookingCard;
