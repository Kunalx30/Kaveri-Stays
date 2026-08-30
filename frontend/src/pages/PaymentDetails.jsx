import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2, Hash, Calendar, ArrowLeft, Loader2,
  AlertCircle, ShieldCheck, Hotel, User, ReceiptText,
} from 'lucide-react';
import { getPaymentByIdApi } from '../api/payments';
import { PaymentMethodBadge } from '../components/payment/PaymentStatus';
import ErrorMessage from '../components/common/ErrorMessage';

const formatINR = (val) => {
  if (val == null) return '—';
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
    second: '2-digit',
    hour12: true,
  });
};

/**
 * PaymentDetails Page
 *
 * Route: /payments/:paymentId
 *
 * Displays full receipt for a single payment transaction.
 * Supports browser refresh by fetching from GET /api/v1/payments/:id.
 */
const PaymentDetails = () => {
  const { paymentId } = useParams();
  const location = useLocation();

  const [payment, setPayment] = useState(location.state?.payment || null);
  const [isLoading, setIsLoading] = useState(!location.state?.payment);
  const [error, setError] = useState('');

  const justCreated = location.state?.paymentCreated === true;

  useEffect(() => {
    const fetchPayment = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getPaymentByIdApi(Number(paymentId));
        setPayment(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError(`Payment transaction #${paymentId} not found.`);
        } else if (err.response?.status === 403) {
          setError('Access denied: You do not have permission to view this payment receipt.');
        } else if (err.response?.status === 401) {
          setError('Please sign in to view payment details.');
        } else {
          setError('Failed to load payment details. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Loading payment receipt...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Receipt Not Available</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Link
          to="/my-payments"
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          View My Payments
        </Link>
      </div>
    );
  }

  if (!payment) return null;

  const { payment_id, booking_id, amount, method, paid_at, property_id, guest_id } = payment;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/bookings/${booking_id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Booking #{booking_id}</span>
        </Link>

        <Link
          to="/my-payments"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
        >
          All Payments →
        </Link>
      </div>

      {/* Success Banner (when arriving after payment creation) */}
      {justCreated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Payment Successful!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Your transaction of <strong>{formatINR(amount)}</strong> has been recorded and credited to Booking #{booking_id}.
            </p>
          </div>
        </div>
      )}

      {/* Receipt Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-widest">
              <ReceiptText className="w-4 h-4" />
              <span>Official Payment Receipt</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Completed
            </span>
          </div>

          <div className="pt-2">
            <span className="text-xs text-slate-400">Total Paid</span>
            <div className="text-3xl sm:text-4xl font-black text-white">{formatINR(amount)}</div>
          </div>
        </div>

        {/* Receipt Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 uppercase tracking-wider font-semibold block">Transaction ID</span>
              <span className="font-bold text-slate-800 text-sm">#{payment_id}</span>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider font-semibold block">Payment Method</span>
              <div className="mt-1">
                <PaymentMethodBadge method={method} size="sm" />
              </div>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider font-semibold block">Associated Booking</span>
              <Link
                to={`/bookings/${booking_id}`}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline text-sm inline-block mt-0.5"
              >
                Booking #{booking_id}
              </Link>
            </div>

            <div>
              <span className="text-slate-400 uppercase tracking-wider font-semibold block">Payment Timestamp</span>
              <span className="font-semibold text-slate-700 block mt-0.5">{formatDatetime(paid_at)}</span>
            </div>

            {property_id && (
              <div>
                <span className="text-slate-400 uppercase tracking-wider font-semibold block">Property ID</span>
                <span className="font-semibold text-slate-700 block mt-0.5">#{property_id}</span>
              </div>
            )}

            {guest_id && (
              <div>
                <span className="text-slate-400 uppercase tracking-wider font-semibold block">Guest ID</span>
                <span className="font-semibold text-slate-700 block mt-0.5">#{guest_id}</span>
              </div>
            )}
          </div>

          {/* Security & Ledger Verification Notice */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">Financial Ledger Entry Verified</p>
              <p className="text-[11px] text-slate-500">
                This transaction is permanently stored in the Kaveri Stays audit ledger.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to={`/bookings/${booking_id}`}
              className="w-full sm:w-auto flex-1 py-3 text-center rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              Return to Booking Details
            </Link>
            <Link
              to="/my-payments"
              className="w-full sm:w-auto flex-1 py-3 text-center rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              View Payment History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
