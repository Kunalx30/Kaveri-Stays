import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2, ArrowLeft, Loader2,
  AlertCircle, ShieldCheck, ReceiptText,
} from 'lucide-react';
import { getPaymentByIdApi } from '../api/payments';
import { PaymentMethodBadge } from '../components/payment/PaymentStatus';

const formatINR = (val) => {
  if (val == null) return '—';
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
    second: '2-digit',
    hour12: true,
  });
};

/**
 * PaymentDetails Page
 *
 * Route: /payments/:paymentId
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
        <p className="text-sm font-medium text-[#5A635F]">
          Loading payment receipt...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#8C3A3A] mx-auto" />
        <h2 className="font-serif text-2xl text-[#16231E]">Receipt Not Available</h2>
        <p className="text-sm text-[#5A635F]">{error}</p>
        <Link
          to="/my-payments"
          className="inline-block mt-4 px-6 py-2.5 bg-[#16231E] hover:bg-[#253B33] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
        >
          View My Payments
        </Link>
      </div>
    );
  }

  if (!payment) return null;

  const { payment_id, booking_id, amount, method, paid_at, property_id, guest_id } = payment;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to={`/bookings/${booking_id}`}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#8A6240] hover:text-[#16231E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Booking #{booking_id}</span>
          </Link>

          <Link
            to="/my-payments"
            className="text-xs font-semibold text-[#5A635F] hover:text-[#16231E] transition-colors"
          >
            All Payments →
          </Link>
        </div>

        {/* Success Banner (when arriving fresh after payment creation) */}
        {justCreated && (
          <div className="bg-[#EAF3EE] border border-[#CDE3D6] rounded-2xl p-5 flex items-start space-x-3 text-[#1B4D3E]">
            <CheckCircle2 className="w-5 h-5 text-[#1B4D3E] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-bold">Payment Settled Successfully!</p>
              <p className="text-xs text-[#2A6E59] leading-relaxed">
                Your payment of <strong>{formatINR(amount)}</strong> has been recorded and credited to Booking #{booking_id}.
              </p>
            </div>
          </div>
        )}

        {/* Receipt Document Card */}
        <div className="bg-white border border-[#E6DFD5] rounded-3xl shadow-xs overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-[#16231E] text-white p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                <ReceiptText className="w-4 h-4" />
                <span>Official Payment Receipt</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF3EE] text-[#1B4D3E] border border-[#CDE3D6]">
                Confirmed & Settled
              </span>
            </div>

            <div className="space-y-0.5 pt-1">
              <span className="text-xs text-white/70 uppercase tracking-wider font-medium">Amount Received</span>
              <div className="font-serif text-3xl sm:text-5xl font-normal text-white">
                {formatINR(amount)}
              </div>
            </div>
          </div>

          {/* Receipt Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              
              <div className="space-y-1">
                <span className="text-[#7A857F] uppercase tracking-wider font-bold text-[10px] block">
                  Transaction Reference
                </span>
                <span className="font-serif text-lg font-semibold text-[#16231E]">
                  #{payment_id}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#7A857F] uppercase tracking-wider font-bold text-[10px] block">
                  Settlement Method
                </span>
                <div className="pt-0.5">
                  <PaymentMethodBadge method={method} size="sm" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[#7A857F] uppercase tracking-wider font-bold text-[10px] block">
                  Associated Reservation
                </span>
                <Link
                  to={`/bookings/${booking_id}`}
                  className="font-semibold text-[#16231E] hover:text-[#8A6240] transition-colors text-sm inline-block"
                >
                  Booking #{booking_id} →
                </Link>
              </div>

              <div className="space-y-1">
                <span className="text-[#7A857F] uppercase tracking-wider font-bold text-[10px] block">
                  Timestamp
                </span>
                <span className="text-sm font-medium text-[#16231E]">
                  {formatDatetime(paid_at)}
                </span>
              </div>

              {property_id && (
                <div className="space-y-1">
                  <span className="text-[#7A857F] uppercase tracking-wider font-bold text-[10px] block">
                    Property ID
                  </span>
                  <span className="text-sm font-medium text-[#16231E]">#{property_id}</span>
                </div>
              )}

              {guest_id && (
                <div className="space-y-1">
                  <span className="text-[#7A857F] uppercase tracking-wider font-bold text-[10px] block">
                    Guest Account ID
                  </span>
                  <span className="text-sm font-medium text-[#16231E]">#{guest_id}</span>
                </div>
              )}

            </div>

            {/* Security & Ledger Verification Notice */}
            <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 flex items-start sm:items-center space-x-3 text-xs text-[#5A635F]">
              <ShieldCheck className="w-5 h-5 text-[#1B4D3E] shrink-0 mt-0.5 sm:mt-0" />
              <div className="space-y-0.5">
                <p className="font-semibold text-[#16231E]">Financial Ledger Entry Verified</p>
                <p className="text-[11px] text-[#7A857F]">
                  This transaction is synchronized in the Kaveri Stays audit ledger.
                </p>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <Link
                to={`/bookings/${booking_id}`}
                className="w-full sm:w-auto flex-1 py-3 text-center rounded-xl font-semibold text-xs sm:text-sm bg-[#16231E] text-white hover:bg-[#253B33] transition-colors shadow-xs"
              >
                Return to Booking Details
              </Link>
              <Link
                to="/my-payments"
                className="w-full sm:w-auto flex-1 py-3 text-center rounded-xl font-semibold text-xs sm:text-sm bg-[#EDE8E1] text-[#16231E] hover:bg-[#E2DDD5] border border-[#D8D0C5] transition-colors"
              >
                View Payment History
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PaymentDetails;
