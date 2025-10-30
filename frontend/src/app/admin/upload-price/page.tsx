'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import ConditionalLayout from '@/components/global/Layout';

// Interface MarketPrice
interface MarketPrice {
  brand: string;
  model_trim: string;
  year_start: number;
  year_end: number;
  price_min_thb: number;
  price_max_thb: number;
  created_at?: string; // Optional in frontend display
  updated_at?: string; // Optional in frontend display
}

// Type for status messages
interface StatusResponse {
  message: string;
  error?: string;
}
// Type for JSON error structure from Go backend's utils.WriteError
interface GoErrorResponse {
	success: boolean;
	error: string;
	code: number;
}
// Type for successful Commit response
interface CommitSuccessResponse {
    message: string;
    inserted_count: number;
    updated_count: number;
}


export default function UploadMarketPricePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<StatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractedJson, setExtractedJson] = useState<string | null>(null); // Keep as string for textarea
  const [parsedData, setParsedData] = useState<MarketPrice[] | null>(null); // Store parsed data for commit

  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitStatus, setCommitStatus] = useState<StatusResponse | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Reset states when file changes
    setSelectedFile(null);
    setUploadStatus(null);
    setExtractedJson(null);
    setParsedData(null);
    setCommitStatus(null); // Reset commit status as well

    if (event.target.files && event.target.files[0]) {
      if (event.target.files[0].type === 'application/pdf') {
        setSelectedFile(event.target.files[0]);
      } else {
        setUploadStatus({ message: '', error: 'Invalid file type. Please select a PDF file.' });
        event.target.value = '';
      }
    }
  };

  // Handle PDF Upload and Extraction
  const handleExtractSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ message: '', error: 'Please select a PDF file first.' });
      return;
    }

    setIsLoading(true);
    setUploadStatus(null);
    setExtractedJson(null);
    setParsedData(null);
    setCommitStatus(null); // Clear previous commit status
    const formData = new FormData();
    formData.append('marketPricePdf', selectedFile!);

    try {
      const response = await fetch('/admin/market-price/import', { // Extract endpoint
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const contentType = response.headers.get("content-type");

      if (response.ok && response.status === 200 && contentType && contentType.includes("application/json")) {
        const result: MarketPrice[] = await response.json();
        setExtractedJson(JSON.stringify(result, null, 2));
        setParsedData(result); // Store parsed data
        setUploadStatus({ message: `Successfully extracted ${result.length} records. Review data below and confirm import.`, error: undefined });
        // Optional: Clear file input after successful extraction
        // const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
        // if (fileInput) fileInput.value = '';

      } else { // Handle extraction errors
        let errorMessage = `Extraction failed with status ${response.status}`;
         try {
            if (contentType && contentType.includes("application/json")) {
                const errorResult: GoErrorResponse = await response.json();
                errorMessage = errorResult.error || `Error ${errorResult.code || response.status}`;
            } else {
                 const textError = await response.text();
                 errorMessage = textError || response.statusText || errorMessage;
            }
        } catch (parseError) {
             console.error("Error parsing extraction error response:", parseError);
             try { const textError = await response.text(); errorMessage = textError || response.statusText || errorMessage; }
             catch { errorMessage = response.statusText || errorMessage; }
        }
        setUploadStatus({ message: '', error: errorMessage });
      }
    } catch (error) {
      console.error('Network or other error during extraction:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred';
      setUploadStatus({ message: '', error: `Extraction Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
      if (!parsedData || parsedData.length === 0) {
          setCommitStatus({ message: '', error: 'No data available to commit.' });
          return;
      }

      setIsCommitting(true);
      setCommitStatus(null);

      try {
          const response = await fetch('/admin/market-price/commit', { // Commit endpoint
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json', // Sending JSON
              },
              body: JSON.stringify(parsedData), // Send the parsed data array
              credentials: 'include',
          });

          const contentType = response.headers.get("content-type");

          if (response.ok && response.status === 200 && contentType && contentType.includes("application/json")) {
              const result: CommitSuccessResponse = await response.json();
              setCommitStatus({ message: `${result.message} Inserted: ${result.inserted_count}, Updated: ${result.updated_count}`, error: undefined });
              // Clear data after successful commit
              setExtractedJson(null);
              setParsedData(null);
              setSelectedFile(null);
              setUploadStatus(null); // Clear extraction status too
              const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
              if (fileInput) fileInput.value = '';

          } else { // Handle commit errors
              let errorMessage = `Commit failed with status ${response.status}`;
              try {
                  if (contentType && contentType.includes("application/json")) {
                      const errorResult: GoErrorResponse = await response.json();
                      errorMessage = errorResult.error || `Error ${errorResult.code || response.status}`;
                  } else {
                      const textError = await response.text();
                      errorMessage = textError || response.statusText || errorMessage;
                  }
              } catch (parseError) {
                   console.error("Error parsing commit error response:", parseError);
                   try { const textError = await response.text(); errorMessage = textError || response.statusText || errorMessage; }
                   catch { errorMessage = response.statusText || errorMessage; }
              }
              setCommitStatus({ message: '', error: errorMessage });
          }
      } catch (error) {
          console.error('Network or other error during commit:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown network error occurred';
          setCommitStatus({ message: '', error: `Commit Error: ${errorMessage}` });
      } finally {
          setIsCommitting(false);
      }
  };

  return (
    <ConditionalLayout>
      <div className="flex justify-center items-start w-full py-12 px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-2xl">
          {/* UI Card Header */}
          <div className="text-center mb-6">
             <span className="inline-block p-3 bg-red-100 dark:bg-red-900 rounded-full mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Upload Market Price PDF</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Extract and import car market prices from the document.
            </p>
          </div>

          {/* Form for Upload/Extraction */}
          <form onSubmit={handleExtractSubmit}>
            {/* File Input Area */}
            <div className="mb-4 p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center">
               <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 cursor-pointer">Choose a file</label>
              <input id="pdf-upload" name="marketPricePdf" type="file" accept="application/pdf" onChange={handleFileChange} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 dark:file:bg-red-900 dark:file:text-red-300 hover:file:bg-red-100 dark:hover:file:bg-red-800 cursor-pointer"/>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PDF only, up to 50MB.</p>
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Upload/Extraction Status Messages */}
            {uploadStatus && (
              <div className={`mb-4 p-3 rounded-md text-sm ${ uploadStatus.error ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' }`}>
                {uploadStatus.error || uploadStatus.message}
              </div>
            )}

            {/* Upload/Extract Button */}
            <button
              type="submit"
              disabled={!selectedFile || isLoading || isCommitting} // Disable if committing too
              className="w-full mb-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Extracting...' : 'Upload and Extract Data'}
            </button>
          </form>

          {/* Extracted JSON Display Area & Commit Section */}
          {extractedJson && (
            <div className="mt-6">
              <label htmlFor="json-output" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Extracted JSON Data (Review before importing):
              </label>
              <textarea
                id="json-output"
                readOnly
                value={extractedJson}
                rows={15}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-xs font-mono"
                style={{ resize: 'vertical' }}
              />

              {/* Commit Status Messages */}
              {commitStatus && (
                 <div className={`mt-4 p-3 rounded-md text-sm ${ commitStatus.error ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' }`}>
                   {commitStatus.error || commitStatus.message}
                 </div>
               )}

              {/* Confirm Import Button */}
              <button
                type="button" // Important: type="button" to prevent form submission
                onClick={handleCommit}
                disabled={isCommitting || isLoading || !parsedData} // Disable if no data or already processing
                className="w-full mt-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCommitting ? 'Importing to Database...' : 'Confirm Import to Database'}
              </button>
            </div>
          )}

        </div>
      </div>
    </ConditionalLayout>
  );
}