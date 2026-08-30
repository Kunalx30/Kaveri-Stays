import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard, Smartphone, Landmark, Banknote, ShieldCheck, ArrowLeft,
  Loader2, AlertCircle, CheckCircle2, Hotel, CalendarCheck, Users,
} from 'lucide-react';
import { getBookingByIdApi } from '../api/bookings';
import { getBookingPaymentSummaryApi, createPaymentApi } from '../api/payments';
import ErrorMessage from '../components/common/ErrorMessage';
import { PaymentSettlementBadge } from '../components/payment/PaymentStatus';

const formatINR = (val) => {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// Generates an 8+ char UUID idempotency key
const generateIdempotencyKey = () => {
  return 'pay_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, MasterCard, RuPay' },
  { id: 'upi', label: 'UPI / Instant QR', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'bank_transfer', label: 'Net Banking / NEFT', icon: Landmark, desc: 'Direct bank settlement' },
  { id: 'cash', label: 'Cash at Front Desk', icon: Banknote, desc: 'Pay during physical check-in' },
];

const CreatePayment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Form State
  const [method, setMethod] = useState('card');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const [bookingData, summaryData] = await Promise.all([
          getBookingByIdApi(Number(bookingId)),
          getBookingPaymentSummaryApi(Number(bookingId)),
        ]);
        setBooking(bookingData);
        setSummary(summaryData);
        // Default payment amount to remaining balance
        const remaining = Number(summaryData.remaining_balance);
        if (remaining > 0) {
          setAmount(remaining.toFixed(2));
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setLoadError(`Booking #${bookingId} not found.`);
        } else if (err.response?.status === 403) {
          setLoadError('Access denied: You do not have permission to pay for this booking.');
        } else {
          setLoadError('Failed to load booking details for payment.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setSubmitError('');
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid positive payment amount.');
      return;
    }

    if (summary && parsedAmount > Number(summary.remaining_balance)) {
      setSubmitError(
        `Payment amount (${formatINR(parsedAmount)}) cannot exceed the remaining balance of ${formatINR(summary.remaining_balance)}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        booking_id: Number(bookingId),
        amount: parsedAmount.toFixed(2),
        method: method,
        idempotency_key: idempotencyKey,
      };

      const paymentResult = await createPaymentApi(payload);

      // Navigate to payment receipt/details
      navigate(`/payments/${paymentResult.payment_id}`, {
        state: { paymentCreated: true, payment: paymentResult },
        replace: true,
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setSubmitError(detail);
      } else if (Array.isArray(detail)) {
        setSubmitError(detail.map((d) => d.msg || JSON.stringify(d)).join('. '));
      } else if (err.response?.status === 400) {
        setSubmitError(detail || 'Payment could not be processed. Please check the amount and try again.');
      } else if (err.response?.status === 409) {
        setSubmitError('A duplicate payment request with conflicting parameters was detected.');
      } else {
        setSubmitError('Payment processing failed. Please try again.');
      }
      // Generate fresh idempotency key in case of user retry
      setIdempotencyKey(generateIdempotencyKey());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Loading booking and payment balance...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Payment Unavailable</h2>
        <p className="text-sm text-slate-500">{loadError}</p>
        <Link
          to="/my-bookings"
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  // Booking is already fully paid
  if (summary?.is_fully_paid) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Booking Fully Paid</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Booking <strong>#{bookingId}</strong> has already been settled in full. Total amount paid is{' '}
          <strong>{formatINR(summary.total_paid)}</strong>. No outstanding balance remains.
        </p>
        <div className="pt-2 flex items-center justify-center space-x-3">
          <Link
            to={`/bookings/${bookingId}`}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
          >
            View Booking Details
          </Link>
          <Link
            to="/my-payments"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
          >
            Payment History
          </Link>
        </div>
      </div>
    );
  }

  // Booking is cancelled or no-show (not payable)
  if (booking && (booking.status === 'cancelled' || booking.status === 'no_show')) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Cannot Pay for {booking.status.toUpperCase()} Reservation</h2>
        <p className="text-sm text-slate-500">
          This reservation is currently in <strong>{booking.status}</strong> status. Payments cannot be accepted for cancelled or no-show bookings.
        </p>
        <Link
          to={`/bookings/${bookingId}`}
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          View Booking Details
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back Navigation */}
      <Link
        to={`/bookings/${bookingId}`}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Booking #{bookingId}</span>
      </Link>

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          Settlement Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Make a Payment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete payment for your stay reservation at Kaveri Stays.
        </p>
      </div>

      {/* Booking & Financial Summary Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm font-extrabold text-slate-900">
            <Hotel className="w-4 h-4 text-blue-600" />
            <span>Booking #{bookingId} Summary</span>
          </div>
          {summary && (
            <PaymentSettlementBadge
              isFullyPaid={summary.is_fully_paid}
              totalPaid={summary.total_paid}
              size="sm"
            />
          )}
        </div>

        {booking && (
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
            <div className="flex items-center space-x-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {formatDate(booking.check_in_date)} – {formatDate(booking.check_out_date)}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 justify-end">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{booking.guests_count} Guests (Room #{booking.room_id})</span>
            </div>
          </div>
        )}

        {/* Balance Breakdown */}
        {summary && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Booking Amount:</span>
              <span className="font-semibold text-slate-800">{formatINR(summary.total_booking_amount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Already Paid:</span>
              <span className="font-semibold">{formatINR(summary.total_paid)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Remaining Balance:</span>
              <span className="text-blue-600">{formatINR(summary.remaining_balance)}</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Payment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon;
              const isSelected = method === pm.id;
              return (
                <button
                  type="button"
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                      {pm.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pm.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="payment-amount" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Payment Amount (INR)
            </label>
            {summary && (
              <button
                type="button"
                onClick={() => setAmount(Number(summary.remaining_balance).toFixed(2))}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Pay Full Balance ({formatINR(summary.remaining_balance)})
              </button>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              id="payment-amount"
              step="0.01"
              min="1"
              max={summary ? Number(summary.remaining_balance) : undefined}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Partial payments are accepted. The amount cannot exceed the remaining balance.
          </p>
        </div>

        <ErrorMessage message={submitError} onDismiss={() => setSubmitError('')} />

        {/* Demo Notice Banner */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800">Simulated Payment Ledger</span>
            <p className="text-[11px] text-slate-500">
              Transactions are recorded synchronously in the Kaveri Stays financial ledger with idempotency safeguards.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="submit-payment-btn"
          disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
          className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Payment...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Confirm & Pay {amount && !isNaN(parseFloat(amount)) ? formatINR(parseFloat(amount)) : ''}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreatePayment;
