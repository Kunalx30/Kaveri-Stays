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
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// Generates an 8+ char UUID idempotency key
const generateIdempotencyKey = () => {
  return 'pay_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, MasterCard, RuPay' },
  { id: 'upi', label: 'UPI / Instant QR', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'bank_transfer', label: 'Net Banking / Transfer', icon: Landmark, desc: 'Direct bank settlement' },
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
          setLoadError('Failed to load reservation details for payment.');
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
        <p className="text-sm font-medium text-[#5A635F]">
          Loading reservation balance...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#8C3A3A] mx-auto" />
        <h2 className="font-serif text-2xl text-[#16231E]">Payment Unavailable</h2>
        <p className="text-sm text-[#5A635F]">{loadError}</p>
        <Link
          to="/my-bookings"
          className="inline-block mt-4 px-6 py-2.5 bg-[#16231E] hover:bg-[#253B33] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  // Booking is already fully paid
  if (summary?.is_fully_paid) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-14 h-14 bg-[#EAF3EE] rounded-full flex items-center justify-center mx-auto text-[#1B4D3E]">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#16231E]">Reservation Fully Paid</h2>
        <p className="text-sm text-[#5A635F] max-w-md mx-auto leading-relaxed">
          Booking <strong>#{bookingId}</strong> has already been settled in full. Total amount paid is{' '}
          <strong>{formatINR(summary.total_paid)}</strong>. No outstanding balance remains.
        </p>
        <div className="pt-3 flex items-center justify-center gap-3">
          <Link
            to={`/bookings/${bookingId}`}
            className="px-6 py-3 bg-[#16231E] hover:bg-[#253B33] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            View Booking Details
          </Link>
          <Link
            to="/my-payments"
            className="px-6 py-3 bg-[#EDE8E1] hover:bg-[#E2DDD5] text-[#16231E] font-semibold rounded-xl text-xs sm:text-sm transition-colors"
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
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="font-serif text-2xl text-[#16231E]">Cannot Settle {booking.status.toUpperCase()} Stay</h2>
        <p className="text-sm text-[#5A635F]">
          This reservation is currently in <strong>{booking.status}</strong> status. Payments cannot be processed for cancelled or no-show bookings.
        </p>
        <Link
          to={`/bookings/${bookingId}`}
          className="inline-block mt-4 px-6 py-2.5 bg-[#16231E] text-white font-semibold rounded-xl text-xs sm:text-sm"
        >
          View Booking Details
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* Back Navigation */}
        <Link
          to={`/bookings/${bookingId}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#8A6240] hover:text-[#16231E] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Booking #{bookingId}</span>
        </Link>

        {/* Header */}
        <div className="pb-6 border-b border-[#E6DFD5] space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240] block">
            Payment Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#16231E] tracking-tight">
            Complete your reservation payment
          </h1>
          <p className="text-sm text-[#5A635F] font-light">
            Securely record and settle your stay balance for Booking #{bookingId}.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TWO-COLUMN CHECKOUT LAYOUT
            ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN: PAYMENT FORM (7 cols) ── */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmit} className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              
              {/* Payment Method Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8A6240]">
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
                        className={`p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#16231E] bg-[#F4EFEA] ring-1 ring-[#16231E]'
                            : 'border-[#E6DFD5] bg-[#FBF9F5] hover:bg-[#F4EFEA]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#16231E] text-white' : 'bg-white text-[#8A6240] border border-[#E6DFD5]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? 'text-[#16231E]' : 'text-[#5A635F]'}`}>
                            {pm.label}
                          </p>
                          <p className="text-[11px] text-[#7A857F] mt-0.5">{pm.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div className="space-y-2 pt-2 border-t border-[#E6DFD5]">
                <div className="flex justify-between items-center">
                  <label htmlFor="payment-amount" className="block text-xs font-bold uppercase tracking-wider text-[#8A6240]">
                    Payment Amount (INR)
                  </label>
                  {summary && (
                    <button
                      type="button"
                      onClick={() => setAmount(Number(summary.remaining_balance).toFixed(2))}
                      className="text-[11px] font-semibold text-[#8A6240] hover:text-[#16231E] cursor-pointer"
                    >
                      Pay Full Balance ({formatINR(summary.remaining_balance)})
                    </button>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-lg text-[#7A857F]">
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
                    className="w-full pl-9 pr-4 py-3.5 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl font-serif text-xl font-semibold text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#7A857F]">
                  Partial payments are permitted. Amount cannot exceed remaining balance.
                </p>
              </div>

              <ErrorMessage message={submitError} onDismiss={() => setSubmitError('')} />

              {/* Ledger Security Note */}
              <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#5A635F]">
                <ShieldCheck className="w-4 h-4 text-[#1B4D3E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[#16231E]">Simulated Payment Ledger</span>
                  <p className="text-[11px] text-[#7A857F]">
                    Transactions are recorded synchronously in the Kaveri Stays financial audit registry with idempotency protection.
                  </p>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                id="submit-payment-btn"
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                className="w-full py-4 px-6 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Confirm & Pay {amount && !isNaN(parseFloat(amount)) ? formatINR(parseFloat(amount)) : ''}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── RIGHT COLUMN: BOOKING SUMMARY (5 cols) ── */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-[#F4EFEA] border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#16231E]">
                  <Hotel className="w-4 h-4 text-[#8A6240]" />
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
                <div className="space-y-2 text-xs text-[#5A635F]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-[#8A6240]" />
                      <span>Stay Dates:</span>
                    </span>
                    <span className="font-semibold text-[#16231E]">
                      {formatDate(booking.check_in_date)} – {formatDate(booking.check_out_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-[#8A6240]" />
                      <span>Party Size:</span>
                    </span>
                    <span className="font-semibold text-[#16231E]">
                      {booking.guests_count} Guests (Room #{booking.room_id})
                    </span>
                  </div>
                </div>
              )}

              {/* Financial breakdown */}
              {summary && (
                <div className="bg-white border border-[#E6DFD5] rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-[#5A635F]">
                    <span>Total Booking Cost:</span>
                    <span className="font-semibold text-[#16231E]">{formatINR(summary.total_booking_amount)}</span>
                  </div>

                  <div className="flex justify-between text-[#1B4D3E]">
                    <span>Already Settled:</span>
                    <span className="font-semibold">{formatINR(summary.total_paid)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-[#16231E] pt-2 border-t border-[#E6DFD5]">
                    <span>Remaining Balance:</span>
                    <span className="text-[#8A6240]">{formatINR(summary.remaining_balance)}</span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CreatePayment;
