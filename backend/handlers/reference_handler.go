package handlers

import (
	"database/sql"
	"net/http"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/utils"
)

// ReferenceHandler handles reference data HTTP requests
type ReferenceHandler struct {
	db *sql.DB
}

// NewReferenceHandler creates a new reference handler
func NewReferenceHandler(db *sql.DB) *ReferenceHandler {
	return &ReferenceHandler{db: db}
}

// ReferenceDataResponse contains all reference data
type ReferenceDataResponse struct {
	Success bool          `json:"success"`
	Data    ReferenceData `json:"data"`
	Message string        `json:"message,omitempty"`
}

// ReferenceData contains all dropdown options
type ReferenceData struct {
	BodyTypes     []models.BodyType     `json:"bodyTypes"`
	Transmissions []models.Transmission `json:"transmissions"`
	FuelTypes     []models.FuelType     `json:"fuelTypes"`
	Drivetrains   []models.Drivetrain   `json:"drivetrains"`
}

// GetReferenceData handles GET /api/reference-data
func (h *ReferenceHandler) GetReferenceData(w http.ResponseWriter, r *http.Request) {
	// Get body types
	bodyTypes, err := h.getBodyTypes()
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch body types",
		})
		return
	}

	// Get transmissions
	transmissions, err := h.getTransmissions()
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch transmissions",
		})
		return
	}

	// Get fuel types
	fuelTypes, err := h.getFuelTypes()
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch fuel types",
		})
		return
	}

	// Get drivetrains
	drivetrains, err := h.getDrivetrains()
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch drivetrains",
		})
		return
	}

	utils.RespondJSON(w, http.StatusOK, ReferenceDataResponse{
		Success: true,
		Data: ReferenceData{
			BodyTypes:     bodyTypes,
			Transmissions: transmissions,
			FuelTypes:     fuelTypes,
			Drivetrains:   drivetrains,
		},
	})
}

func (h *ReferenceHandler) getBodyTypes() ([]models.BodyType, error) {
	query := "SELECT id, name, created_at FROM body_types ORDER BY name"
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bodyTypes []models.BodyType
	for rows.Next() {
		var bt models.BodyType
		if err := rows.Scan(&bt.ID, &bt.Name, &bt.CreatedAt); err != nil {
			return nil, err
		}
		bodyTypes = append(bodyTypes, bt)
	}
	return bodyTypes, nil
}

func (h *ReferenceHandler) getTransmissions() ([]models.Transmission, error) {
	query := "SELECT id, name, created_at FROM transmissions ORDER BY name"
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transmissions []models.Transmission
	for rows.Next() {
		var t models.Transmission
		if err := rows.Scan(&t.ID, &t.Name, &t.CreatedAt); err != nil {
			return nil, err
		}
		transmissions = append(transmissions, t)
	}
	return transmissions, nil
}

func (h *ReferenceHandler) getFuelTypes() ([]models.FuelType, error) {
	query := "SELECT id, name, created_at FROM fuel_types ORDER BY name"
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fuelTypes []models.FuelType
	for rows.Next() {
		var ft models.FuelType
		if err := rows.Scan(&ft.ID, &ft.Name, &ft.CreatedAt); err != nil {
			return nil, err
		}
		fuelTypes = append(fuelTypes, ft)
	}
	return fuelTypes, nil
}

func (h *ReferenceHandler) getDrivetrains() ([]models.Drivetrain, error) {
	query := "SELECT id, name, created_at FROM drivetrains ORDER BY name"
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var drivetrains []models.Drivetrain
	for rows.Next() {
		var d models.Drivetrain
		if err := rows.Scan(&d.ID, &d.Name, &d.CreatedAt); err != nil {
			return nil, err
		}
		drivetrains = append(drivetrains, d)
	}
	return drivetrains, nil
}
