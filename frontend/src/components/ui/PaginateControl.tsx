export default function PaginateControl({
  page,
  setPage,
  totalPages,
}: {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}) {
  return (
    <div className="flex items-center gap-(--space-2xs)">
      <button
        onClick={() => setPage(1)}
        disabled={page === 1}
        className="p-(--space-2xs) border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <div className="text-0 w-6 h-6 flex items-center justify-center">
          &lt;&lt;
        </div>
      </button>
      <button
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="p-(--space-2xs) border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed "
      >
        <div className="text-0 w-6 h-6 flex items-center justify-center">
          &lt;
        </div>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-(--space-2xs)">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`p-(--space-2xs) rounded-lg  ${
                page === pageNum
                  ? "bg-maroon text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="text-0 w-6 h-6 flex items-center justify-center">
                {pageNum}
              </div>
            </button>
          );
        })}
        {totalPages > 5 && page < totalPages - 2 && (
          <>
            <span className="p-(--space-2xs) text-gray-500">...</span>
            <button
              onClick={() => setPage(totalPages)}
              className="p-(--space-2xs) border border-gray-300 rounded-lg hover:bg-gray-50 "
            >
              <div className="text-0 w-6 h-6 flex items-center justify-center">
                {totalPages}
              </div>
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="p-(--space-2xs) border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed "
      >
        <div className="text-0 w-6 h-6 flex items-center justify-center">
          &gt;
        </div>
      </button>
      <button
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages}
        className="p-(--space-2xs) border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed "
      >
        <div className="text-0 w-6 h-6 flex items-center justify-center">
          &gt;&gt;
        </div>
      </button>
    </div>
  );
}
