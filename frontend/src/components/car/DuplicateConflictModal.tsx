"use client";

import Modal from "@/components/ui/Modal";

interface DuplicateConflictModalProps {
  isOpen: boolean;
  onRedirect: () => void;
  onCreateNew: () => void;
}

export default function DuplicateConflictModal({
  isOpen,
  onRedirect,
  onCreateNew,
}: DuplicateConflictModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCreateNew}
      title="Existing Draft Found"
      description="You already have a draft for this vehicle. Would you like to restore and continue with your existing draft?"
      size="md"
      closeOnBackdrop={false}
    >
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCreateNew}
          className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            No, Start Fresh
          </button>
          <button
            onClick={onRedirect}
          className="px-4 py-2 bg-maroon text-white font-medium rounded-lg hover:bg-red transition-colors"
          >
            Yes, Restore
          </button>
        </div>
    </Modal>
  );
}
