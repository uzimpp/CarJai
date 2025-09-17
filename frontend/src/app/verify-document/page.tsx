import DocumentUploader from '@/components/features/ocr/DocumentUploader';

export default function VerifyDocumentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow flex items-center justify-center p-4">
        <DocumentUploader />
      </main>
    </div>
  );
}