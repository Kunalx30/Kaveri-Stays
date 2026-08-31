import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { PaymentMethodBadge } from './PaymentStatus';

const formatINR = (val) => {
  if (val == null) return null;
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

const formatDatetime = (dtStr) => {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleString('en-US', {
    day: 'numeric',
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
    <article className="group bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-5">
      
      {/* Top Header: Txn ID + Method Badge */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8A6240]">
          Transaction #{payment_id}
        </span>
        <PaymentMethodBadge method={method} size="sm" />
      </div>

      {/* Amount & Booking Association */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A857F] block">
          Amount Settled
        </span>
        <p className="font-serif text-2xl sm:text-3xl font-normal text-[#16231E]">
          {formatINR(amount)}
        </p>
        <p className="text-xs text-[#5A635F] pt-0.5">
          Credited to{' '}
          <Link
            to={`/bookings/${booking_id}`}
            className="font-semibold text-[#16231E] hover:text-[#8A6240] transition-colors"
          >
            Reservation #{booking_id}
          </Link>
          {property_id && ` · Property #${property_id}`}
        </p>
      </div>

      {/* Transaction Details Box */}
      <div className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD5] text-xs text-[#5A635F] space-y-1">
        <div className="flex items-center space-x-1.5 text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-[#8A6240] shrink-0" />
          <span>Settled on {formatDatetime(paid_at)}</span>
        </div>
      </div>

      {/* Footer: Ledger & View Receipt Link */}
      <div className="pt-4 border-t border-[#E6DFD5] flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1.5 text-[#1B4D3E] text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ledger Confirmed</span>
        </div>

        <Link
          to={`/payments/${payment_id}`}
          className="inline-flex items-center space-x-1.5 font-semibold text-[#16231E] group-hover:text-[#253B33] transition-colors"
        >
          <span>View Receipt</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

    </article>
  );
};

export default PaymentCard;
