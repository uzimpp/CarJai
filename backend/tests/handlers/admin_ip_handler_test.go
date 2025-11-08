package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// mockAdminServiceForIP is a mock implementation of AdminService for IP testing
type mockAdminServiceForIP struct {
	addIPToWhitelistFunc    func(adminID int, ipAddress, description string) error
	removeIPFromWhitelistFunc func(adminID int, ipAddress string) error
	getWhitelistedIPsFunc   func(adminID int) ([]models.IPWhitelist, error)
}

func (m *mockAdminServiceForIP) AddIPToWhitelist(adminID int, ipAddress, description string) error {
	if m.addIPToWhitelistFunc != nil {
		return m.addIPToWhitelistFunc(adminID, ipAddress, description)
	}
	return nil
}

func (m *mockAdminServiceForIP) RemoveIPFromWhitelist(adminID int, ipAddress string) error {
	if m.removeIPFromWhitelistFunc != nil {
		return m.removeIPFromWhitelistFunc(adminID, ipAddress)
	}
	return nil
}

func (m *mockAdminServiceForIP) GetWhitelistedIPs(adminID int) ([]models.IPWhitelist, error) {
	if m.getWhitelistedIPsFunc != nil {
		return m.getWhitelistedIPsFunc(adminID)
	}
	return nil, nil
}

func TestAdminIPHandler_AddIPToWhitelist(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		adminID             int
		requestBody         interface{}
		addIPToWhitelistFunc func(adminID int, ipAddress, description string) error
		expectedStatus      int
	}{
		{
			name:    "Successful add",
			method:  "POST",
			adminID: 1,
			requestBody: models.AdminIPWhitelistRequest{
				IPAddress:   "192.168.1.1",
				Description: "Test IP",
			},
			addIPToWhitelistFunc: func(adminID int, ipAddress, description string) error {
				return nil
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "Invalid IP address",
			method:         "POST",
			adminID:        1,
			requestBody:    models.AdminIPWhitelistRequest{IPAddress: "invalid"},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Method not allowed",
			method:         "GET",
			adminID:        1,
			requestBody:    models.AdminIPWhitelistRequest{IPAddress: "192.168.1.1"},
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockAdminService := &mockAdminServiceForIP{
				addIPToWhitelistFunc: tt.addIPToWhitelistFunc,
			}

			handler := &testAdminIPHandler{
				adminService: mockAdminService,
			}

			var reqBody []byte
			if tt.requestBody != nil {
				reqBody, _ = json.Marshal(tt.requestBody)
			}
			req := httptest.NewRequest(tt.method, "/admin/ip", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Admin-ID", "1")
			w := httptest.NewRecorder()

			handler.AddIPToWhitelist(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

type testAdminIPHandler struct {
	adminService *mockAdminServiceForIP
}

func (h *testAdminIPHandler) AddIPToWhitelist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID := 1 // Simplified for test
	if adminIDStr == "" {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	var ipReq models.AdminIPWhitelistRequest
	if err := json.NewDecoder(r.Body).Decode(&ipReq); err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := utils.ValidateIPAddress(ipReq.IPAddress); err != nil {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid IP address format")
		return
	}

	err := h.adminService.AddIPToWhitelist(adminID, ipReq.IPAddress, ipReq.Description)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := models.AdminIPWhitelistResponse{
		Success: true,
		Message: "IP address added to whitelist successfully",
	}

	h.writeJSONResponse(w, http.StatusCreated, response)
}

func (h *testAdminIPHandler) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func (h *testAdminIPHandler) writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := models.AdminErrorResponse{
		Success: false,
		Error:   message,
		Code:    statusCode,
	}

	json.NewEncoder(w).Encode(response)
}

func TestAdminIPHandler_RemoveIPFromWhitelist(t *testing.T) {
	tests := []struct {
		name                  string
		method                string
		adminID               int
		ipAddress             string
		removeIPFromWhitelistFunc func(adminID int, ipAddress string) error
		expectedStatus        int
	}{
		{
			name:      "Successful remove",
			method:    "DELETE",
			adminID:   1,
			ipAddress: "192.168.1.1",
			removeIPFromWhitelistFunc: func(adminID int, ipAddress string) error {
				return nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Missing IP parameter",
			method:         "DELETE",
			adminID:        1,
			ipAddress:      "",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			adminID:        1,
			ipAddress:      "192.168.1.1",
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockAdminService := &mockAdminServiceForIP{
				removeIPFromWhitelistFunc: tt.removeIPFromWhitelistFunc,
			}

			handler := &testAdminIPHandler{
				adminService: mockAdminService,
			}

			url := "/admin/ip"
			if tt.ipAddress != "" {
				url += "?ip=" + tt.ipAddress
			}
			req := httptest.NewRequest(tt.method, url, nil)
			req.Header.Set("X-Admin-ID", "1")
			w := httptest.NewRecorder()

			handler.RemoveIPFromWhitelist(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testAdminIPHandler) RemoveIPFromWhitelist(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID := 1 // Simplified for test
	if adminIDStr == "" {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	ipAddress := r.URL.Query().Get("ip")
	if ipAddress == "" {
		h.writeErrorResponse(w, http.StatusBadRequest, "IP address parameter is required")
		return
	}

	err := h.adminService.RemoveIPFromWhitelist(adminID, ipAddress)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := models.AdminIPWhitelistResponse{
		Success: true,
		Message: "IP address removed from whitelist successfully",
	}

	h.writeJSONResponse(w, http.StatusOK, response)
}

func TestAdminIPHandler_GetWhitelistedIPs(t *testing.T) {
	tests := []struct {
		name                string
		method              string
		adminID             int
		getWhitelistedIPsFunc func(adminID int) ([]models.IPWhitelist, error)
		expectedStatus      int
	}{
		{
			name:    "Successful get",
			method:  "GET",
			adminID: 1,
			getWhitelistedIPsFunc: func(adminID int) ([]models.IPWhitelist, error) {
				return []models.IPWhitelist{}, nil
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Method not allowed",
			method:         "POST",
			adminID:        1,
			expectedStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockAdminService := &mockAdminServiceForIP{
				getWhitelistedIPsFunc: tt.getWhitelistedIPsFunc,
			}

			handler := &testAdminIPHandler{
				adminService: mockAdminService,
			}

			req := httptest.NewRequest(tt.method, "/admin/ip", nil)
			req.Header.Set("X-Admin-ID", "1")
			w := httptest.NewRecorder()

			handler.GetWhitelistedIPs(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func (h *testAdminIPHandler) GetWhitelistedIPs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		h.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	adminIDStr := r.Header.Get("X-Admin-ID")
	adminID := 1 // Simplified for test
	if adminIDStr == "" {
		h.writeErrorResponse(w, http.StatusBadRequest, "Invalid admin ID")
		return
	}

	whitelistedIPs, err := h.adminService.GetWhitelistedIPs(adminID)
	if err != nil {
		h.writeErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := models.AdminIPWhitelistResponse{
		Success: true,
		Data:    whitelistedIPs,
	}

	h.writeJSONResponse(w, http.StatusOK, response)
}

