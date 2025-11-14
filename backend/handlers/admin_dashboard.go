package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync" 

	"github.com/uzimpp/CarJai/backend/services"
)

// AdminDashboardHandler handles dashboard-related requests
type AdminDashboardHandler struct {
	userService *services.UserService
	carService  *services.CarService
}

// NewAdminDashboardHandler creates a new handler for dashboard operations
func NewAdminDashboardHandler(us *services.UserService, cs *services.CarService) *AdminDashboardHandler {
	return &AdminDashboardHandler{
		userService: us,
		carService:  cs,
	}
}

// DashboardStatsResponse defines the structure for the stats endpoint
type DashboardStatsResponse struct {
    TotalUsers     int `json:"totalUsers"`
    ActiveCars     int `json:"activeCars"`
    SoldCars       int `json:"soldCars"`
    PendingReports int `json:"pendingReports"`
    TotalBuyers    int `json:"totalBuyers"` 
    TotalSellers   int `json:"totalSellers"`
}

// HandleGetStats handles GET /admin/dashboard/stats
func (h *AdminDashboardHandler) HandleGetStats(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    var totalUsers, activeCars, soldCars, totalBuyers, totalSellers int
    var errUsers, errActive, errSold, errBuyers, errSellers error
    var wg sync.WaitGroup

    wg.Add(5)

    // 1. Total Users
    go func() {
        defer wg.Done()
        totalUsers, errUsers = h.userService.GetTotalUsersCount()
    }()

    // 2. Active Cars
    go func() {
        defer wg.Done()
        activeCars, errActive = h.carService.GetCarCountByStatus("active")
    }()

    // 3. Sold Cars
    go func() {
        defer wg.Done()
        soldCars, errSold = h.carService.GetCarCountByStatus("sold")
    }()

    // 4. Total Buyers 
    go func() {
        defer wg.Done()
        totalBuyers, errBuyers = h.userService.GetTotalBuyerCount() 
    }()

    // 5. Total Sellers 
    go func() {
        defer wg.Done()
        totalSellers, errSellers = h.userService.GetTotalSellerCount()
    }()

    wg.Wait() 

    if errUsers != nil { /* ... */ }
    if errActive != nil { /* ... */ }
    if errSold != nil { /* ... */ }
    if errBuyers != nil {
        http.Error(w, fmt.Sprintf("Failed to get buyer count: %v", errBuyers), http.StatusInternalServerError)
        return
    }
    if errSellers != nil {
        http.Error(w, fmt.Sprintf("Failed to get seller count: %v", errSellers), http.StatusInternalServerError)
        return
    }

    stats := DashboardStatsResponse{
        TotalUsers:     totalUsers,
        ActiveCars:     activeCars,
        SoldCars:       soldCars,
        PendingReports: 0, 
        TotalBuyers:    totalBuyers,  
        TotalSellers:   totalSellers,
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    if err := json.NewEncoder(w).Encode(stats); err != nil {
        http.Error(w, fmt.Sprintf("Failed to encode response: %v", err), http.StatusInternalServerError)
    }
}

// HandleGetChartData handles GET /admin/dashboard/chart
func (h *AdminDashboardHandler) HandleGetChartData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	days := 30 

	chartData, err := h.userService.GetUserActivityChartData(days)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get chart data: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(chartData); err != nil {
		http.Error(w, fmt.Sprintf("Failed to encode response: %v", err), http.StatusInternalServerError)
	}
}