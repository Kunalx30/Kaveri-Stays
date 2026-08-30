import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard, Loader2, RefreshCw, SlidersHorizontal, ArrowLeft,
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
 *
 * Lists payments for the authenticated user based on backend role isolation:
 *   - Guest: Only payments made for their own reservations.
 *   - Manager / Staff: Only payments for bookings in their assigned property.
 *   - Owner: All payments across the system.
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
      setPayments(data);
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
        return 'Your complete hotel reservation payment transactions are listed below.';
      case 'manager':
        return 'Payment transactions recorded for your assigned property.';
      case 'staff':
        return 'Payment transactions for your assigned property.';
      case 'owner':
        return 'All payment transactions across all Kaveri Stays properties.';
      default:
        return 'Your payment history.';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" />
            <span>Financial Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Payment History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{getRoleDescription()}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/my-bookings"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            My Bookings
          </Link>

          <button
            onClick={fetchPayments}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh payments"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stat & Filters */}
      {!isLoading && !error && payments.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="text-xs text-slate-600">
            <span>Total Transactions: <strong>{payments.length}</strong></span>
            <span className="mx-2">•</span>
            <span>
              Total Processed: <strong className="text-slate-900 font-bold">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {METHOD_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setMethodFilter(f.value)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  methodFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">Loading payment history...</p>
        </div>
      )}

      {/* Payments Grid */}
      {!isLoading && !error && (
        filteredPayments.length === 0 ? (
          <EmptyState
            title={methodFilter ? `No ${methodFilter.toUpperCase()} payments found` : 'No Payments Found'}
            message={
              methodFilter
                ? 'Try selecting a different payment method filter above.'
                : 'Your payment history will appear here once you complete transactions for your reservations.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredPayments.map((payment) => (
              <PaymentCard key={payment.payment_id} payment={payment} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default MyPayments;
