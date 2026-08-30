import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start space-x-3 text-xs sm:text-sm my-2 transition-all">
      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors font-bold text-base leading-none cursor-pointer"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
