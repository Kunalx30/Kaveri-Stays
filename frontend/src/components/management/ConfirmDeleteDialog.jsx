import React from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

/**
 * ConfirmDeleteDialog — Reusable deletion modal for management entities.
 *
 * @param {{
 *   title: string,
 *   itemName: string,
 *   warningText?: string,
 *   onConfirm: () => Promise<void>,
 *   onDismiss: () => void,
 *   isDeleting: boolean
 * }} props
 */
const ConfirmDeleteDialog = ({
  title = 'Confirm Deletion',
  itemName,
  warningText = 'This action is permanent and cannot be undone.',
  onConfirm,
  onDismiss,
  isDeleting,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4 animate-fadeIn">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 id="confirm-delete-title" className="text-base font-black text-slate-900">
              {title}
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
            Are you sure you want to delete <strong className="text-slate-900 font-bold">"{itemName}"</strong>?
          </p>
          {warningText && (
            <div className="flex items-start space-x-1.5 text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-tight">{warningText}</p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onDismiss}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-delete-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete Permanently</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteDialog;
