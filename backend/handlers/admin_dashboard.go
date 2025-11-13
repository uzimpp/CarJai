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
}

// HandleGetStats handles GET /admin/dashboard/stats
func (h *AdminDashboardHandler) HandleGetStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var totalUsers, activeCars, soldCars int
	var errUsers, errActive, errSold error
	var wg sync.WaitGroup

	wg.Add(3) 

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

	stats := DashboardStatsResponse{
		TotalUsers:     totalUsers,
		ActiveCars:     activeCars,
		SoldCars:       soldCars,
		PendingReports: 0, 
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(stats); err != nil {
		http.Error(w, fmt.Sprintf("Failed to encode response: %v", err), http.StatusInternalServerError)
	}
}