import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, Loader2, RefreshCw, SlidersHorizontal, Sparkles,
} from 'lucide-react';
import { listPaymentsApi } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import PaymentCard from '../components/payment/PaymentCard';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

const METHOD_FILTERS = [
  { label: 'All Methods', value: '' },
  { label: 'Card', value: 'card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cash', value: 'cash' },
];

/**
 * MyPayments Page
 *
 * Route: /my-payments
 */
const MyPayments = () => {
  const { user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const fetchPayments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await listPaymentsApi();
      setPayments(data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to load payment history. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = methodFilter
    ? payments.filter((p) => p.method === methodFilter)
    : payments;

  const totalSpent = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const getRoleDescription = () => {
    switch (user?.role) {
      case 'guest':
        return 'Review your hotel reservation payments, transaction receipts, and settled invoices.';
      case 'manager':
        return 'Payment transactions recorded for your assigned retreat.';
      case 'staff':
        return 'Payment transactions for your assigned retreat.';
      case 'owner':
        return 'All payment transactions across the Kaveri Stays network.';
      default:
        return 'Your payment history.';
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        
        {/* ══════════════════════════════════════════════════════════
            SECTION 1: EDITORIAL HEADER
            ══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Payment History</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E] leading-[1.15]">
              Your payments, <br className="hidden sm:inline" />
              <span className="italic text-[#253B33]">verified & recorded.</span>
            </h1>

            <p className="text-sm sm:text-[15px] text-[#5A635F] leading-relaxed font-light">
              {getRoleDescription()}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <Link
              to="/my-bookings"
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors shadow-2xs"
            >
              My Bookings
            </Link>

            <button
              onClick={fetchPayments}
              disabled={isLoading}
              className="p-2.5 rounded-xl text-[#5A635F] hover:text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh payments"
              aria-label="Refresh payments"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: SUMMARY STRIP
            ══════════════════════════════════════════════════════════ */}
        {!isLoading && !error && payments.length > 0 && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#F4EFEA] border border-[#E6DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#7A857F]">
                Total Processed
              </span>
              <p className="font-serif text-2xl sm:text-3xl font-normal text-[#16231E]">
                ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-[#5A635F]">
                Across {payments.length} settled {payments.length === 1 ? 'transaction' : 'transactions'}
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8A6240] shrink-0 mr-1" />
              {METHOD_FILTERS.map((f) => {
                const isActive = methodFilter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setMethodFilter(f.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#16231E] text-white shadow-xs'
                        : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: LOADING & PAYMENTS GRID
            ══════════════════════════════════════════════════════════ */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
            <p className="text-sm text-[#5A635F] font-medium">Loading payment records...</p>
          </div>
        )}

        {!isLoading && !error && (
          filteredPayments.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={CreditCard}
                title={methodFilter ? `No ${methodFilter.toUpperCase()} payments found` : 'No Payments Recorded'}
                message={
                  methodFilter
                    ? 'No payments found matching this method filter.'
                    : 'Your payment history will appear here once you complete transactions for your reservations.'
                }
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7A857F]">
                <span>
                  Recorded Transactions · {filteredPayments.length} {filteredPayments.length === 1 ? 'Record' : 'Records'}
                </span>
                {methodFilter && (
                  <span className="text-[#8A6240]">
                    Method: {methodFilter}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPayments.map((payment) => (
                  <PaymentCard key={payment.payment_id} payment={payment} />
                ))}
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
};

export default MyPayments;
