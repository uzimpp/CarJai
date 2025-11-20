package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

type testAdminReportsHandler struct {
	reportService *mockReportService
	userService   *mockUserService
	carService    *mockCarService
	adminService  *mockAdminService
}

func (h *testAdminReportsHandler) ListReports(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	reportType := r.URL.Query().Get("type")
	status := r.URL.Query().Get("status")

	var backendType string
	switch reportType {
	case "user":
		backendType = "seller"
	case "car":
		backendType = "car"
	default:
		backendType = ""
	}

	filters := models.ReportFilters{
		Type:   backendType,
		Status: status,
		Limit:  100,
		Offset: 0,
	}

	reports, total, err := h.reportService.ListReports(filters)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	adminReports := make([]models.AdminReportResponse, 0, len(reports))
	for _, report := range reports {
		adminReports = append(adminReports, h.convertToAdminReport(report))
	}

	response := models.AdminReportsListResponse{
		Reports: adminReports,
		Total:   total,
	}
	utils.WriteJSON(w, http.StatusOK, response, "")
}

func (h *testAdminReportsHandler) ResolveReport(w http.ResponseWriter, r *http.Request) {
	h.handleReportStatusUpdate(w, r, "resolved", "/admin/reports/", "/resolve", "Report resolved successfully")
}

func (h *testAdminReportsHandler) DismissReport(w http.ResponseWriter, r *http.Request) {
	h.handleReportStatusUpdate(w, r, "dismissed", "/admin/reports/", "/dismiss", "Report dismissed successfully")
}

func (h *testAdminReportsHandler) handleReportStatusUpdate(w http.ResponseWriter, r *http.Request, status, prefix, suffix, message string) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconvAtoi(adminIDStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	reportID, err := h.extractID(r.URL.Path, prefix, suffix)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid report ID")
		return
	}

	var notes string
	if status == "resolved" {
		notes = "Report resolved by admin"
	} else if status == "dismissed" {
		notes = "Report dismissed by admin"
	}

	err = h.reportService.UpdateReportStatus(reportID, status, &notes, adminID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, message)
}

func (h *testAdminReportsHandler) BanUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID, err := strconvAtoi(adminIDStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	userID, err := h.extractID(r.URL.Path, "/admin/users/", "/ban")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	notes := "User banned by admin"
	if _, err := h.reportService.BanSeller(userID, adminID, &notes); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "User banned successfully")
}

func (h *testAdminReportsHandler) RemoveCar(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	carID, err := h.extractID(r.URL.Path, "/admin/cars/", "/remove")
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid car ID")
		return
	}

	if err := h.carService.DeleteCar(carID, 0, true); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.WriteJSON(w, http.StatusOK, nil, "Car listing removed successfully")
}

func (h *testAdminReportsHandler) convertToAdminReport(report models.Report) models.AdminReportResponse {
	adminReport := models.AdminReportResponse{
		ID:          report.ID,
		Reason:      report.Topic,
		Status:      report.Status,
		CreatedAt:   report.CreatedAt.Format(time.RFC3339),
		Description: &report.Description,
	}

	switch report.ReportType {
	case "seller":
		adminReport.Type = "user"
		if report.SellerID != nil {
			adminReport.TargetUserId = report.SellerID
		}
	case "car":
		adminReport.Type = "car"
		if report.CarID != nil {
			adminReport.TargetCarId = report.CarID
		}
	}

	reporterUser, err := h.userService.GetUserByID(report.ReporterID)
	if err != nil || reporterUser == nil {
		adminReport.ReportedById = report.ReporterID
		adminReport.ReportedByName = fmt.Sprintf("User #%d", report.ReporterID)
		adminReport.ReportedByEmail = "unknown@example.com"
	} else {
		adminReport.ReportedById = reporterUser.ID
		adminReport.ReportedByName = reporterUser.Name
		adminReport.ReportedByEmail = reporterUser.Email
	}

	if report.ReportType == "seller" && report.SellerID != nil {
		targetUser, err := h.userService.GetUserByID(*report.SellerID)
		if err == nil && targetUser != nil {
			name := targetUser.Name
			adminReport.TargetUserName = &name
		}
	}

	if report.ReportType == "car" && report.CarID != nil {
		car, err := h.carService.GetCarByID(*report.CarID)
		if err == nil && car != nil {
			var titleParts []string
			if car.BrandName != nil {
				titleParts = append(titleParts, *car.BrandName)
			}
			if car.ModelName != nil {
				titleParts = append(titleParts, *car.ModelName)
			}
			if car.SubmodelName != nil {
				titleParts = append(titleParts, *car.SubmodelName)
			}
			if car.Year != nil {
				titleParts = append(titleParts, fmt.Sprintf("(%d)", *car.Year))
			}
			if len(titleParts) > 0 {
				title := strings.Join(titleParts, " ")
				adminReport.TargetCarTitle = &title
			} else {
				defaultTitle := fmt.Sprintf("Car #%d", *report.CarID)
				adminReport.TargetCarTitle = &defaultTitle
			}
		}
	}

	if report.ReviewedAt != nil {
		resolvedAt := report.ReviewedAt.Format(time.RFC3339)
		adminReport.ResolvedAt = &resolvedAt
	}

	if report.ReviewedByAdminID != nil {
		admin, err := h.adminService.GetAdminByID(*report.ReviewedByAdminID)
		if err == nil && admin != nil {
			name := admin.Name
			adminReport.ResolvedBy = &name
		}
	}

	return adminReport
}

func (h *testAdminReportsHandler) extractID(path, prefix, suffix string) (int, error) {
	if !strings.HasPrefix(path, prefix) {
		return 0, fmt.Errorf("invalid path prefix")
	}
	path = strings.TrimPrefix(path, prefix)
	if !strings.HasSuffix(path, suffix) {
		return 0, fmt.Errorf("invalid path suffix")
	}
	path = strings.TrimSuffix(path, suffix)
	return strconvAtoi(path)
}

func strconvAtoi(value string) (int, error) {
	if value == "" {
		return 0, fmt.Errorf("empty value")
	}
	return strconv.Atoi(value)
}

func TestAdminReportsHandler_ListReports_Success(t *testing.T) {
	now := time.Now()
	reviewedAt := now.Add(-time.Hour)
	adminID := 99
	carID := 55
	sellerID := 77
	reporterID := 11

	mockReport := &mockReportService{
		listReportsFunc: func(filters models.ReportFilters) ([]models.Report, int, error) {
			if filters.Type != "seller" {
				t.Fatalf("expected type seller, got %s", filters.Type)
			}
			if filters.Status != "pending" {
				t.Fatalf("expected status pending, got %s", filters.Status)
			}
			return []models.Report{
				{
					ID:         1,
					ReportType: "seller",
					SellerID:   intPtr(sellerID),
					ReporterID: reporterID,
					Topic:      "fraud",
					Description: "Seller is fraudulent",
					Status:     "pending",
					CreatedAt:  now,
				},
				{
					ID:                2,
					ReportType:        "car",
					CarID:             intPtr(carID),
					ReporterID:        reporterID,
					Topic:             "false_information",
					Description:       "Listing inaccurate",
					Status:            "resolved",
					CreatedAt:         now.Add(-time.Hour),
					ReviewedAt:        &reviewedAt,
					ReviewedByAdminID: intPtr(adminID),
				},
			}, 2, nil
		},
	}

	mockUsers := &mockUserService{
		getUserByIDFunc: func(userID int) (*models.User, error) {
			switch userID {
			case reporterID:
				return &models.User{ID: reporterID, Name: "Reporter", Email: "reporter@example.com"}, nil
			case sellerID:
				return &models.User{ID: sellerID, Name: "Target Seller", Email: "seller@example.com"}, nil
			default:
				return nil, fmt.Errorf("not found")
			}
		},
	}

	mockCars := &mockCarService{
		getCarByIDFunc: func(id int) (*models.Car, error) {
			if id != carID {
				return nil, fmt.Errorf("not found")
			}
			brand := "Toyota"
			model := "Camry"
			year := 2020
			return &models.Car{
				ID:        carID,
				BrandName: &brand,
				ModelName: &model,
				Year:      &year,
			}, nil
		},
	}

	mockAdmins := &mockAdminService{
		getAdminByIDFunc: func(id int) (*models.Admin, error) {
			if id != adminID {
				return nil, fmt.Errorf("not found")
			}
			return &models.Admin{ID: adminID, Name: "Resolver"}, nil
		},
	}

	handler := &testAdminReportsHandler{
		reportService: mockReport,
		userService:   mockUsers,
		carService:    mockCars,
		adminService:  mockAdmins,
	}

	req := httptest.NewRequest(http.MethodGet, "/admin/reports?type=user&status=pending", nil)
	w := httptest.NewRecorder()

	handler.ListReports(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var resp struct {
		Success bool                                 `json:"success"`
		Code    int                                  `json:"code"`
		Data    models.AdminReportsListResponse      `json:"data"`
	}

	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if !resp.Success || resp.Code != http.StatusOK {
		t.Fatalf("unexpected response meta: %+v", resp)
	}

	if resp.Data.Total != 2 || len(resp.Data.Reports) != 2 {
		t.Fatalf("expected 2 reports, got %+v", resp.Data)
	}

	sellerReport := resp.Data.Reports[0]
	if sellerReport.Type != "user" || sellerReport.TargetUserId == nil {
		t.Fatalf("expected seller report to map to user type: %+v", sellerReport)
	}

	carReport := resp.Data.Reports[1]
	if carReport.Type != "car" || carReport.TargetCarTitle == nil {
		t.Fatalf("expected car report with title: %+v", carReport)
	}
	if carReport.ResolvedBy == nil || *carReport.ResolvedBy != "Resolver" {
		t.Fatalf("expected resolved by Resolver, got %+v", carReport.ResolvedBy)
	}
}

func TestAdminReportsHandler_ListReports_MethodNotAllowed(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports", nil)
	w := httptest.NewRecorder()

	handler.ListReports(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestAdminReportsHandler_ListReports_ServiceError(t *testing.T) {
	handler := &testAdminReportsHandler{
		reportService: &mockReportService{
			listReportsFunc: func(filters models.ReportFilters) ([]models.Report, int, error) {
				return nil, 0, fmt.Errorf("boom")
			},
		},
	}
	req := httptest.NewRequest(http.MethodGet, "/admin/reports", nil)
	w := httptest.NewRecorder()

	handler.ListReports(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

func TestAdminReportsHandler_ResolveReport_Success(t *testing.T) {
	called := false
	handler := &testAdminReportsHandler{
		reportService: &mockReportService{
			updateReportStatusFunc: func(id int, status string, notes *string, adminID int) error {
				called = true
				if id != 42 || status != "resolved" || adminID != 7 {
					t.Fatalf("unexpected args id=%d status=%s admin=%d", id, status, adminID)
				}
				if notes == nil || *notes == "" {
					t.Fatalf("expected notes")
				}
				return nil
			},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports/42/resolve", nil)
	req.Header.Set("X-Admin-ID", "7")
	w := httptest.NewRecorder()

	handler.ResolveReport(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if !called {
		t.Fatalf("expected service call")
	}
}

func TestAdminReportsHandler_ResolveReport_InvalidAdminID(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports/42/resolve", nil)
	w := httptest.NewRecorder()

	handler.ResolveReport(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestAdminReportsHandler_ResolveReport_InvalidReportID(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports/invalid/resolve", nil)
	req.Header.Set("X-Admin-ID", "1")
	w := httptest.NewRecorder()

	handler.ResolveReport(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestAdminReportsHandler_ResolveReport_ServiceError(t *testing.T) {
	handler := &testAdminReportsHandler{
		reportService: &mockReportService{
			updateReportStatusFunc: func(id int, status string, notes *string, adminID int) error {
				return fmt.Errorf("service error")
			},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports/42/resolve", nil)
	req.Header.Set("X-Admin-ID", "1")
	w := httptest.NewRecorder()

	handler.ResolveReport(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

func TestAdminReportsHandler_ResolveReport_MethodNotAllowed(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodGet, "/admin/reports/42/resolve", nil)
	w := httptest.NewRecorder()

	handler.ResolveReport(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestAdminReportsHandler_DismissReport_Success(t *testing.T) {
	called := false
	handler := &testAdminReportsHandler{
		reportService: &mockReportService{
			updateReportStatusFunc: func(id int, status string, notes *string, adminID int) error {
				called = true
				if id != 42 || status != "dismissed" || adminID != 5 {
					t.Fatalf("unexpected args id=%d status=%s admin=%d", id, status, adminID)
				}
				if notes == nil || *notes == "" {
					t.Fatalf("expected notes")
				}
				return nil
			},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports/42/dismiss", nil)
	req.Header.Set("X-Admin-ID", "5")
	w := httptest.NewRecorder()

	handler.DismissReport(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if !called {
		t.Fatalf("expected service call")
	}
}

func TestAdminReportsHandler_DismissReport_InvalidAdminID(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports/42/dismiss", nil)
	w := httptest.NewRecorder()

	handler.DismissReport(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestAdminReportsHandler_DismissReport_InvalidReportID(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports/invalid/dismiss", nil)
	req.Header.Set("X-Admin-ID", "1")
	w := httptest.NewRecorder()

	handler.DismissReport(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestAdminReportsHandler_DismissReport_ServiceError(t *testing.T) {
	handler := &testAdminReportsHandler{
		reportService: &mockReportService{
			updateReportStatusFunc: func(id int, status string, notes *string, adminID int) error {
				return fmt.Errorf("service error")
			},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/admin/reports/42/dismiss", nil)
	req.Header.Set("X-Admin-ID", "1")
	w := httptest.NewRecorder()

	handler.DismissReport(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

func TestAdminReportsHandler_DismissReport_MethodNotAllowed(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodGet, "/admin/reports/42/dismiss", nil)
	w := httptest.NewRecorder()

	handler.DismissReport(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestAdminReportsHandler_BanUser_Success(t *testing.T) {
	called := false
	handler := &testAdminReportsHandler{
		reportService: &mockReportService{
			banSellerFunc: func(sellerID, adminID int, notes *string) (int, error) {
				called = true
				if sellerID != 10 || adminID != 3 {
					t.Fatalf("unexpected call seller=%d admin=%d", sellerID, adminID)
				}
				return 1, nil
			},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/admin/users/10/ban", nil)
	req.Header.Set("X-Admin-ID", "3")
	w := httptest.NewRecorder()

	handler.BanUser(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if !called {
		t.Fatalf("expected banSeller to be called")
	}
}

func TestAdminReportsHandler_BanUser_InvalidPath(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodPost, "/admin/users/not-number/ban", nil)
	req.Header.Set("X-Admin-ID", "1")
	w := httptest.NewRecorder()

	handler.BanUser(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestAdminReportsHandler_BanUser_InvalidAdminID(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodPost, "/admin/users/10/ban", nil)
	w := httptest.NewRecorder()

	handler.BanUser(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestAdminReportsHandler_BanUser_ServiceError(t *testing.T) {
	handler := &testAdminReportsHandler{
		reportService: &mockReportService{
			banSellerFunc: func(sellerID, adminID int, notes *string) (int, error) {
				return 0, fmt.Errorf("service error")
			},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/admin/users/10/ban", nil)
	req.Header.Set("X-Admin-ID", "1")
	w := httptest.NewRecorder()

	handler.BanUser(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

func TestAdminReportsHandler_BanUser_MethodNotAllowed(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodGet, "/admin/users/10/ban", nil)
	w := httptest.NewRecorder()

	handler.BanUser(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestAdminReportsHandler_RemoveCar_Success(t *testing.T) {
	called := false
	handler := &testAdminReportsHandler{
		carService: &mockCarService{
			deleteCarFunc: func(carID, userID int, isAdmin bool) error {
				called = true
				if carID != 5 || userID != 0 || !isAdmin {
					t.Fatalf("unexpected delete args car=%d user=%d admin=%v", carID, userID, isAdmin)
				}
				return nil
			},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/admin/cars/5/remove", nil)
	w := httptest.NewRecorder()

	handler.RemoveCar(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	if !called {
		t.Fatalf("expected deleteCar to be called")
	}
}

func TestAdminReportsHandler_RemoveCar_InvalidMethod(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodGet, "/admin/cars/5/remove", nil)
	w := httptest.NewRecorder()

	handler.RemoveCar(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", w.Code)
	}
}

func TestAdminReportsHandler_RemoveCar_InvalidCarID(t *testing.T) {
	handler := &testAdminReportsHandler{}
	req := httptest.NewRequest(http.MethodPost, "/admin/cars/invalid/remove", nil)
	w := httptest.NewRecorder()

	handler.RemoveCar(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestAdminReportsHandler_RemoveCar_ServiceError(t *testing.T) {
	handler := &testAdminReportsHandler{
		carService: &mockCarService{
			deleteCarFunc: func(carID, userID int, isAdmin bool) error {
				return fmt.Errorf("service error")
			},
		},
	}
	req := httptest.NewRequest(http.MethodPost, "/admin/cars/5/remove", nil)
	w := httptest.NewRecorder()

	handler.RemoveCar(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", w.Code)
	}
}

func intPtr(value int) *int {
	return &value
}

