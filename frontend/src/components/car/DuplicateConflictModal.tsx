"use client";

interface DuplicateConflictModalProps {
  isOpen: boolean;
  onRedirect: () => void;
  onCreateNew: () => void;
}

export default function DuplicateConflictModal({
  isOpen,
  onRedirect,
  onCreateNew
}: DuplicateConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Existing Draft Found</h2>
        <p className="text-gray-600 mb-6">
          You already have a draft for this vehicle. Would you like to restore
          and continue with your existing draft?
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            No, Start Fresh
          </button>
          <button
            onClick={onRedirect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Yes, Restore
          </button>
        </div>
      </div>
    </div>
  );
}
