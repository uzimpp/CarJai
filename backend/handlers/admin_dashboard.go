package handlers

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminDashboardHandler handles dashboard-related requests
type AdminDashboardHandler struct {
	userService   *services.UserService
	carService    *services.CarService
	reportService *services.ReportService
}

// NewAdminDashboardHandler creates a new handler for dashboard operations
func NewAdminDashboardHandler(us *services.UserService, cs *services.CarService, rs *services.ReportService) *AdminDashboardHandler {
	return &AdminDashboardHandler{
		userService:   us,
		carService:    cs,
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
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
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
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get user count: %v", errUsers))
		return
	}
	if errActive != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get active car count: %v", errActive))
		return
	}
	if errSold != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get sold car count: %v", errSold))
		return
	}
	if errBuyers != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get buyer count: %v", errBuyers))
		return
	}
	if errSellers != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get seller count: %v", errSellers))
		return
	}
	if errReports != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get report count: %v", errReports))
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

	utils.WriteJSON(w, http.StatusOK, stats, "")
}

// HandleGetChartData handles GET /admin/dashboard/chart
func (h *AdminDashboardHandler) HandleGetChartData(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	days := 30

	chartData, err := h.userService.GetUserActivityChartData(days)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get chart data: %v", err))
		return
	}

	utils.WriteJSON(w, http.StatusOK, chartData, "")
}

// HandleGetTopBrandsChart handles GET /admin/dashboard/top-brands
func (h *AdminDashboardHandler) HandleGetTopBrandsChart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	data, err := h.carService.GetTopBrandsChartData()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get top brands chart data: %v", err))
		return
	}

	utils.WriteJSON(w, http.StatusOK, data, "")
}

// HandleGetRecentReports handles GET /admin/dashboard/recent-reports
func (h *AdminDashboardHandler) HandleGetRecentReports(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	filters := models.ReportFilters{
		Status: "pending",
		Limit:  5,
		Offset: 0,
	}
	reports, _, err := h.reportService.ListReports(filters)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get recent reports: %v", err))
		return
	}

	utils.WriteJSON(w, http.StatusOK, reports, "")
}
