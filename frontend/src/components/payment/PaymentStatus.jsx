import React from 'react';
import { CreditCard, Smartphone, Landmark, Banknote, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const METHOD_CONFIG = {
  card: {
    label: 'Credit / Debit Card',
    icon: CreditCard,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-500',
  },
  upi: {
    label: 'UPI / QR',
    icon: Smartphone,
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    iconColor: 'text-purple-500',
  },
  bank_transfer: {
    label: 'Bank Transfer',
    icon: Landmark,
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconColor: 'text-indigo-500',
  },
  cash: {
    label: 'Cash',
    icon: Banknote,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-500',
  },
};

/**
 * PaymentMethodBadge — visual badge for the payment method.
 */
export const PaymentMethodBadge = ({ method, size = 'sm' }) => {
  const config = METHOD_CONFIG[method] || {
    label: method || 'Unknown',
    icon: CreditCard,
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    iconColor: 'text-slate-500',
  };
  const Icon = config.icon;

  const sizeClass = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size] || 'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-lg border font-bold capitalize ${sizeClass} ${config.className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

/**
 * PaymentSettlementBadge — displays whether a booking is fully paid, partial, or unpaid.
 */
export const PaymentSettlementBadge = ({ isFullyPaid, totalPaid = 0, size = 'sm' }) => {
  const hasPaidSomething = Number(totalPaid) > 0;

  let config;
  if (isFullyPaid) {
    config = {
      label: 'Fully Paid',
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconColor: 'text-emerald-600',
    };
  } else if (hasPaidSomething) {
    config = {
      label: 'Partially Paid',
      icon: Clock,
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      iconColor: 'text-amber-600',
    };
  } else {
    config = {
      label: 'Payment Pending',
      icon: AlertCircle,
      className: 'bg-rose-50 text-rose-800 border-rose-200',
      iconColor: 'text-rose-600',
    };
  }

  const Icon = config.icon;

  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size] || 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center space-x-1 rounded-full border font-extrabold uppercase tracking-wider ${sizeClass} ${config.className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};

export default PaymentMethodBadge;
