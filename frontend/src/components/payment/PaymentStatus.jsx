import React from 'react';
import { CreditCard, Smartphone, Landmark, Banknote, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const METHOD_CONFIG = {
  card: {
    label: 'Credit / Debit Card',
    icon: CreditCard,
    className: 'bg-[#F4EFEA] text-[#16231E] border-[#E6DFD5]',
    iconColor: 'text-[#8A6240]',
  },
  upi: {
    label: 'UPI / Instant QR',
    icon: Smartphone,
    className: 'bg-[#F4EFEA] text-[#16231E] border-[#E6DFD5]',
    iconColor: 'text-[#8A6240]',
  },
  bank_transfer: {
    label: 'Bank Transfer',
    icon: Landmark,
    className: 'bg-[#F4EFEA] text-[#16231E] border-[#E6DFD5]',
    iconColor: 'text-[#8A6240]',
  },
  cash: {
    label: 'Cash at Desk',
    icon: Banknote,
    className: 'bg-[#F4EFEA] text-[#16231E] border-[#E6DFD5]',
    iconColor: 'text-[#8A6240]',
  },
};

/**
 * PaymentMethodBadge — visual badge for the payment method.
 */
export const PaymentMethodBadge = ({ method, size = 'sm' }) => {
  const config = METHOD_CONFIG[method] || {
    label: method || 'Unknown',
    icon: CreditCard,
    className: 'bg-[#F4EFEA] text-[#16231E] border-[#E6DFD5]',
    iconColor: 'text-[#8A6240]',
  };
  const Icon = config.icon;

  const sizeClass = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size] || 'text-[11px] px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-lg border font-semibold capitalize ${sizeClass} ${config.className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconColor} shrink-0`} />
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
      className: 'bg-[#EAF3EE] text-[#1B4D3E] border-[#CDE3D6]',
      iconColor: 'text-[#1B4D3E]',
    };
  } else if (hasPaidSomething) {
    config = {
      label: 'Partially Paid',
      icon: Clock,
      className: 'bg-[#F5EDDE] text-[#7A5328] border-[#E8DAC2]',
      iconColor: 'text-[#7A5328]',
    };
  } else {
    config = {
      label: 'Payment Pending',
      icon: AlertCircle,
      className: 'bg-[#FBF0E4] text-[#8C581E] border-[#EAD2BA]',
      iconColor: 'text-[#8C581E]',
    };
  }

  const Icon = config.icon;

  const sizeClass = {
    sm: 'text-[10px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size] || 'text-[10px] px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border font-bold uppercase tracking-wider ${sizeClass} ${config.className}`}
    >
      <Icon className={`w-3 h-3 ${config.iconColor} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
};

export default PaymentMethodBadge;
