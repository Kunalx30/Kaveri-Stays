import React from 'react';
import { Link } from 'react-router-dom';
import { Hash, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { PaymentMethodBadge } from './PaymentStatus';

const formatINR = (val) => {
  if (val == null) return null;
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const formatDatetime = (dtStr) => {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * PaymentCard — displays a summary of a single payment transaction.
 * Used in MyPayments list and BookingDetails payment history.
 *
 * @param {{ payment: PaymentResponse }} props
 */
const PaymentCard = ({ payment }) => {
  const { payment_id, booking_id, amount, method, paid_at, property_id } = payment;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md transition-shadow p-5 space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Header: ID + Method */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold">
            <Hash className="w-3.5 h-3.5 text-slate-400" />
            <span>Txn #{payment_id}</span>
          </div>
          <PaymentMethodBadge method={method} size="sm" />
        </div>

        {/* Amount */}
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Amount Paid</span>
          <span className="text-xl font-black text-slate-900">{formatINR(amount)}</span>
        </div>

        {/* Booking & Date Details */}
        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-slate-400 font-medium">Booking ID:</span>
            <Link
              to={`/bookings/${booking_id}`}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              #{booking_id}
            </Link>
          </div>

          {property_id && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium">Property ID:</span>
              <span className="font-semibold text-slate-700">#{property_id}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
            <span className="text-slate-400 font-medium flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Timestamp:</span>
            </span>
            <span className="font-medium text-slate-700">{formatDatetime(paid_at)}</span>
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1 text-emerald-600 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ledger Confirmed</span>
        </div>

        <Link
          to={`/payments/${payment_id}`}
          className="inline-flex items-center space-x-1 font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          <span>View Receipt</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default PaymentCard;
