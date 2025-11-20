package main

import (
	"flag"
	"fmt"
	"log"
	"os"
)

func main() {
	// Define flags
	allFlag := flag.Bool("all", false, "Seed everything (users, cars, reports, favorites, recent-views, market-price)")
	usersFlag := flag.Bool("users", false, "Seed users, sellers, and buyers")
	carsFlag := flag.Bool("cars", false, "Seed cars with images and inspections")
	reportsFlag := flag.Bool("reports", false, "Seed reports (car and seller reports)")
	favoritesFlag := flag.Bool("favorites", false, "Seed favorites (users favoriting cars)")
	recentViewsFlag := flag.Bool("recent-views", false, "Seed recent views (users viewing cars)")
	marketPriceFlag := flag.Bool("market-price", false, "Seed market prices from PDF")

	// Custom usage function
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: %s [options]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "Unified seeding tool for CarJai database\n\n")
		fmt.Fprintf(os.Stderr, "Options:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\nExamples:\n")
		fmt.Fprintf(os.Stderr, "  %s --all\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s --users --cars\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s --market-price\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "  %s --reports --favorites\n", os.Args[0])
	}

	flag.Parse()

	// If no flags provided, show usage
	if !*allFlag && !*usersFlag && !*carsFlag && !*reportsFlag && !*favoritesFlag && !*recentViewsFlag && !*marketPriceFlag {
		flag.Usage()
		os.Exit(1)
	}

	// Initialize random seed
	initRandom()

	// Connect to database
	db, err := connectDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Connected to database successfully")
	log.Println("Starting seeding process...")

	// Determine what to seed
	seedUsers := *allFlag || *usersFlag
	seedCars := *allFlag || *carsFlag
	seedReports := *allFlag || *reportsFlag
	seedFavorites := *allFlag || *favoritesFlag
	seedRecentViews := *allFlag || *recentViewsFlag
	seedMarketPrice := *allFlag || *marketPriceFlag

	// Seed in order (respecting dependencies)
	if seedUsers {
		log.Println("=== Seeding Users, Sellers, and Buyers ===")
		if err := seedUsersData(db); err != nil {
			log.Fatalf("Failed to seed users: %v", err)
		}
		log.Println("✓ Users seeding completed")
	}

	if seedCars {
		log.Println("=== Seeding Cars ===")
		if err := seedCarsData(db); err != nil {
			log.Fatalf("Failed to seed cars: %v", err)
		}
		log.Println("✓ Cars seeding completed")
	}

	if seedMarketPrice {
		log.Println("=== Seeding Market Prices ===")
		if err := seedMarketPriceData(db); err != nil {
			log.Fatalf("Failed to seed market prices: %v", err)
		}
		log.Println("✓ Market prices seeding completed")
	}

	if seedReports {
		log.Println("=== Seeding Reports ===")
		if err := seedReportsData(db); err != nil {
			log.Fatalf("Failed to seed reports: %v", err)
		}
		log.Println("✓ Reports seeding completed")
	}

	if seedFavorites {
		log.Println("=== Seeding Favorites ===")
		if err := seedFavoritesData(db); err != nil {
			log.Fatalf("Failed to seed favorites: %v", err)
		}
		log.Println("✓ Favorites seeding completed")
	}

	if seedRecentViews {
		log.Println("=== Seeding Recent Views ===")
		if err := seedRecentViewsData(db); err != nil {
			log.Fatalf("Failed to seed recent views: %v", err)
		}
		log.Println("✓ Recent views seeding completed")
	}

	log.Println("✓ All seeding operations completed successfully!")
}
