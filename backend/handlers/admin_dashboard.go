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
    reportService *services.ReportService
}

// NewAdminDashboardHandler creates a new handler for dashboard operations
func NewAdminDashboardHandler(us *services.UserService, cs *services.CarService, rs *services.ReportService) *AdminDashboardHandler { 
	return &AdminDashboardHandler{
		userService: us,
		carService:  cs,
		reportService: rs,
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

    var totalUsers, activeCars, soldCars, totalBuyers, totalSellers, pendingReports int 
    var errUsers, errActive, errSold, errBuyers, errSellers, errReports error
    var wg sync.WaitGroup

    wg.Add(6)

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

    go func() {
        defer wg.Done()
        pendingReports, errReports = h.reportService.GetPendingReportCount()
    }()

    wg.Wait() 

    if errUsers != nil {
        http.Error(w, fmt.Sprintf("Failed to get user count: %v", errUsers), http.StatusInternalServerError)
        return
    }
    if errActive != nil {
        http.Error(w, fmt.Sprintf("Failed to get active car count: %v", errActive), http.StatusInternalServerError)
        return
    }
    if errSold != nil {
        http.Error(w, fmt.Sprintf("Failed to get sold car count: %v", errSold), http.StatusInternalServerError)
        return
    }
    if errBuyers != nil {
        http.Error(w, fmt.Sprintf("Failed to get buyer count: %v", errBuyers), http.StatusInternalServerError)
        return
    }
    if errSellers != nil {
        http.Error(w, fmt.Sprintf("Failed to get seller count: %v", errSellers), http.StatusInternalServerError)
        return
    }
    if errReports != nil {
        http.Error(w, fmt.Sprintf("Failed to get report count: %v", errReports), http.StatusInternalServerError)
        return
    }

    stats := DashboardStatsResponse{
        TotalUsers:     totalUsers,
        ActiveCars:     activeCars,
        SoldCars:       soldCars,
        PendingReports: pendingReports,
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

// HandleGetTopBrandsChart handles GET /admin/dashboard/top-brands
func (h *AdminDashboardHandler) HandleGetTopBrandsChart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	data, err := h.carService.GetTopBrandsChartData()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get top brands chart data: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, fmt.Sprintf("Failed to encode response: %v", err), http.StatusInternalServerError)
	}
}