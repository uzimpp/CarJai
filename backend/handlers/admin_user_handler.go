package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
	"github.com/uzimpp/CarJai/backend/utils"
)

// AdminUserHandler handles admin operations on users
type AdminUserHandler struct {
	adminService *services.AdminService
	userService  *services.UserService
}

// NewAdminUserHandler creates a new handler for admin-user operations
func NewAdminUserHandler(adminService *services.AdminService, userService *services.UserService) *AdminUserHandler {
	return &AdminUserHandler{
		adminService: adminService,
		userService:  userService,
	}
}

// HandleGetUsers handles GET /admin/users
func (h *AdminUserHandler) HandleGetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userService.GetManagedUsers()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve users")
		return
	}

	response := models.AdminUsersListResponse{
		Success: true,
		Data:    *users,
		Total:   len(*users),
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

// HandleUpdateUser handles PATCH /admin/users/:id
func (h *AdminUserHandler) HandleUpdateUser(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL path
	parts := strings.Split(r.URL.Path, "/")
	idStr := parts[len(parts)-1]
	userID, err := strconv.Atoi(idStr)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req models.AdminUpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Call the service
	updatedUser, err := h.userService.UpdateUserByAdmin(userID, req)
	if err != nil {
		// Check for specific errors like "username taken"
		utils.WriteError(w, http.StatusConflict, err.Error())
		return
	}

	// Return the updated user (or just success)
	// Returning the public user data is good practice
	utils.WriteJSON(w, http.StatusOK, updatedUser.ToPublic())
}