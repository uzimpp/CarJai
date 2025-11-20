package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/uzimpp/CarJai/backend/services"
)

// seedMarketPriceData seeds market prices from PDF using the extraction service
func seedMarketPriceData(db *sql.DB) error {
	// Create extraction service
	extractionService := services.NewExtractionService(db)

	// Single source of truth: tests directory
	// Docker: mounted at /app/tests/price2568.pdf
	// Local: relative path from scripts directory
	possiblePaths := []string{
		"/app/tests/price2568.pdf",          // Docker: volume mount
		"../../backend/tests/price2568.pdf", // Local: relative from scripts
	}

	var pdfPath string
	for _, path := range possiblePaths {
		if checkFileExists(path) {
			pdfPath = path
			break
		}
	}

	if pdfPath == "" {
		return fmt.Errorf("PDF file not found. Tried paths: %v", possiblePaths)
	}

	log.Printf("Using PDF path: %s", pdfPath)

	log.Println("Extracting market prices from PDF...")

	// Use the existing extraction service to import market prices
	ctx := context.Background()
	insertedCount, updatedCount, err := extractionService.ImportMarketPricesFromPDF(ctx, pdfPath)
	if err != nil {
		return fmt.Errorf("failed to import market prices from PDF: %w", err)
	}

	log.Printf("✓ Market prices imported successfully")
	log.Printf("  Inserted: %d records", insertedCount)
	log.Printf("  Updated: %d records", updatedCount)

	return nil
}

// checkFileExists checks if a file exists
func checkFileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
