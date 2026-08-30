// Helper utility functions for Kaveri Stays frontend
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return `INR ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
