"use client";

interface DuplicateConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedirect: () => void;
  onCreateNew: () => void;
  existingCarId: number;
}

export default function DuplicateConflictModal({
  isOpen,
  onClose,
  onRedirect,
  onCreateNew,
  existingCarId,
}: DuplicateConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">
          Duplicate Vehicle Detected
        </h2>
        <p className="text-gray-600 mb-4">
          You already have a draft for this vehicle (ID: {existingCarId}). What
          would you like to do?
        </p>

        <div className="space-y-3">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">
              Continue with existing draft
            </h3>
            <p className="text-sm text-blue-600 mb-3">
              Transfer your current progress to the existing draft and continue
              working there.
            </p>
            <button
              onClick={onRedirect}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue with Existing Draft
            </button>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">
              Create new listing
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Keep your current progress and create a new listing for this
              vehicle.
            </p>
            <button
              onClick={onCreateNew}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Create New Listing
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
