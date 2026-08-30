import React from 'react';
import { Link } from 'react-router-dom';
import {
  Hash, Hotel, CalendarCheck, CalendarX, Users, ArrowRight,
  LogIn, LogOut, AlertTriangle, Eye,
} from 'lucide-react';
import BookingStatus from '../booking/BookingStatus';

const formatINR = (val) => {
  if (val == null) return null;
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Header: ID + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>Booking #{booking_id}</span>
          </div>
          <BookingStatus status={status} size="sm" />
        </div>

        {/* Guest & Room Tags */}
        <div className="flex items-center justify-between text-xs">
          <div className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
            Room #{room_id}
          </div>
          <div className="text-slate-500 font-medium">
            Guest ID: <span className="font-bold text-slate-800">#{guest_id}</span>
          </div>
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 rounded-xl p-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
              <CalendarCheck className="w-3 h-3" />
              <span>In</span>
            </div>
            <span className="font-bold text-slate-800">{formatDate(check_in_date)}</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center space-x-1 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
              <CalendarX className="w-3 h-3" />
              <span>Out</span>
            </div>
            <span className="font-bold text-slate-800">{formatDate(check_out_date)}</span>
          </div>
        </div>

        {/* Stay Meta & Financials */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
          <div className="flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{guests_count} Guests ({total_nights || 1}N)</span>
          </div>
          <span className="font-black text-slate-900">{formatINR(total_amount)}</span>
        </div>

        {/* Notes preview */}
        {notes && (
          <p className="text-[11px] text-slate-400 italic truncate">"{notes}"</p>
        )}
      </div>

      {/* Operational Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          to={`/staff/bookings/${booking_id}`}
          className="inline-flex items-center space-x-1 text-xs font-bold text-slate-600 hover:text-blue-600 hover:underline transition-colors"
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
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
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
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
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
              className="inline-flex items-center space-x-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
              title="Mark No-Show"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>No-Show</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffBookingCard;
