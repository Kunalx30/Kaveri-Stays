import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

/**
 * DeleteReviewDialog — Confirmation modal before review deletion.
 */
const DeleteReviewDialog = ({ reviewId, onConfirm, onDismiss, isDeleting }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-review-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E6DFD5] p-6 max-w-sm w-full space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 id="delete-review-title" className="text-base font-bold text-[#16231E]">
              Delete Review?
            </h2>
          </div>
          <button
            onClick={onDismiss}
            disabled={isDeleting}
            className="text-[#7A857F] hover:text-[#16231E] transition-colors cursor-pointer disabled:opacity-50 p-1 -mt-0.5"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs text-[#5A635F]">
          <p>
            Are you sure you want to delete <strong className="text-[#16231E]">Review #{reviewId}</strong>?
          </p>
          <p className="text-[#8A9490]">
            This will permanently remove your rating and feedback from the property's public review listing.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#16231E] bg-[#EDE8E1] hover:bg-[#E2DDD5] border border-[#D8D0C5] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Keep Review
          </button>
          <button
            type="button"
            id="confirm-delete-review-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
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
