import React from 'react';

type DeleteMealModalProps = {
  isOpen: boolean;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const DeleteMealModal = ({ isOpen, deleting, onCancel, onConfirm }: DeleteMealModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-sm w-full p-6 border border-zinc-700">
        <h2 className="text-2xl font-bold text-zinc-100 mb-4">Delete Meal?</h2>

        <p className="text-zinc-400 mb-6">Are you sure you want to delete this meal? This action cannot be undone.</p>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Deleting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
