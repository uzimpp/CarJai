package services_test // Use _test package convention

import (
	"log"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/uzimpp/CarJai/backend/services" // Import your services package
)

// TestExtractAndPrintMarketPricesPOC serves as the runner for the POC.
func TestExtractAndPrintMarketPricesPOC(t *testing.T) {
	// Get the directory of the current test file
	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("Could not get caller information")
	}
	currentDir := filepath.Dir(currentFile) // Directory of extraction_service_test.go

	// Construct the relative path to the PDF file in the tests directory
	// Path should be relative from the services directory up to the root, then down to tests
	pdfPath := filepath.Join(currentDir, "..", "..", "backend", "tests", "price2568.pdf") // Adjusted path
	// Clean the path to resolve ".."
	pdfPath = filepath.Clean(pdfPath)

	log.Printf("Running POC extraction with PDF path: %s", pdfPath)

	// Call the POC function from the services package
	err := services.ExtractAndPrintMarketPricesPOC(pdfPath)
	if err != nil {
		// Use t.Errorf or t.Fatalf to report errors in tests
		t.Fatalf("POC extraction failed: %v", err)
	}

	// Log success if no error occurred
	t.Log("POC extraction function executed successfully.")
}