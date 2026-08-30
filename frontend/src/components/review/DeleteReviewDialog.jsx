import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

/**
 * DeleteReviewDialog — Confirmation modal before review deletion.
 */
const DeleteReviewDialog = ({ reviewId, onConfirm, onDismiss, isDeleting }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-review-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 animate-fadeIn">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 id="delete-review-title" className="text-base font-black text-slate-900">
              Delete Review?
            </h2>
          </div>
          <button
            onClick={onDismiss}
            disabled={isDeleting}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <p>
            Are you sure you want to delete <strong>Review #{reviewId}</strong>?
          </p>
          <p className="text-slate-400">
            This will permanently remove your rating and feedback from the property's public review listing.
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Keep Review
          </button>
          <button
            type="button"
            id="confirm-delete-review-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Yes, Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteReviewDialog;
