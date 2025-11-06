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

// ReferenceOption represents a simple code/label pair
type ReferenceOption struct {
	Code  string `json:"code"`
	Label string `json:"label"`
}

// ProvinceOption represents a province with ID and name
type ProvinceOption struct {
	ID    int    `json:"id"`
	Label string `json:"label"`
}

// ReferenceData contains all dropdown options
type ReferenceData struct {
	BodyTypes     []ReferenceOption `json:"bodyTypes"`
	Transmissions []ReferenceOption `json:"transmissions"`
	FuelTypes     []ReferenceOption `json:"fuelTypes"`
	Drivetrains   []ReferenceOption `json:"drivetrains"`
	Colors        []ReferenceOption `json:"colors"`
	Provinces     []ProvinceOption  `json:"provinces"`
}

// GetReferenceData handles GET /api/reference-data
func (h *ReferenceHandler) GetReferenceData(w http.ResponseWriter, r *http.Request) {
	// Get language parameter (default to "en")
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Get body types
	bodyTypes, err := h.getBodyTypes(lang)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch body types",
		})
		return
	}

	// Get transmissions
	transmissions, err := h.getTransmissions(lang)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch transmissions",
		})
		return
	}

	// Get fuel types
	fuelTypes, err := h.getFuelTypes(lang)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch fuel types",
		})
		return
	}

	// Get drivetrains
	drivetrains, err := h.getDrivetrains(lang)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch drivetrains",
		})
		return
	}

	// Get colors
	colors, err := h.getColors(lang)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch colors",
		})
		return
	}

	// Get provinces
	provinces, err := h.getProvinces(lang)
	if err != nil {
		utils.RespondJSON(w, http.StatusInternalServerError, models.UserErrorResponse{
			Success: false,
			Error:   "Failed to fetch provinces",
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
			Colors:        colors,
			Provinces:     provinces,
		},
	})
}

func (h *ReferenceHandler) getBodyTypes(lang string) ([]ReferenceOption, error) {
	nameCol := "name_en"
	if lang == "th" {
		nameCol = "name_th"
	}
	query := "SELECT code, " + nameCol + " FROM body_types ORDER BY " + nameCol
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bodyTypes []ReferenceOption
	for rows.Next() {
		var opt ReferenceOption
		if err := rows.Scan(&opt.Code, &opt.Label); err != nil {
			return nil, err
		}
		bodyTypes = append(bodyTypes, opt)
	}
	return bodyTypes, nil
}

func (h *ReferenceHandler) getTransmissions(lang string) ([]ReferenceOption, error) {
	nameCol := "name_en"
	if lang == "th" {
		nameCol = "name_th"
	}
	query := "SELECT code, " + nameCol + " FROM transmissions ORDER BY " + nameCol
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transmissions []ReferenceOption
	for rows.Next() {
		var opt ReferenceOption
		if err := rows.Scan(&opt.Code, &opt.Label); err != nil {
			return nil, err
		}
		transmissions = append(transmissions, opt)
	}
	return transmissions, nil
}

func (h *ReferenceHandler) getFuelTypes(lang string) ([]ReferenceOption, error) {
	labelCol := "label_en"
	if lang == "th" {
		labelCol = "label_th"
	}
	query := "SELECT code, " + labelCol + " FROM fuel_types ORDER BY " + labelCol
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fuelTypes []ReferenceOption
	for rows.Next() {
		var opt ReferenceOption
		if err := rows.Scan(&opt.Code, &opt.Label); err != nil {
			return nil, err
		}
		fuelTypes = append(fuelTypes, opt)
	}
	return fuelTypes, nil
}

func (h *ReferenceHandler) getDrivetrains(lang string) ([]ReferenceOption, error) {
	nameCol := "name_en"
	if lang == "th" {
		nameCol = "name_th"
	}
	query := "SELECT code, " + nameCol + " FROM drivetrains ORDER BY " + nameCol
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var drivetrains []ReferenceOption
	for rows.Next() {
		var opt ReferenceOption
		if err := rows.Scan(&opt.Code, &opt.Label); err != nil {
			return nil, err
		}
		drivetrains = append(drivetrains, opt)
	}
	return drivetrains, nil
}

func (h *ReferenceHandler) getProvinces(lang string) ([]ProvinceOption, error) {
	nameCol := "name_en"
	if lang == "th" {
		nameCol = "name_th"
	}
	query := "SELECT id, " + nameCol + " FROM provinces ORDER BY " + nameCol
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var provinces []ProvinceOption
	for rows.Next() {
		var opt ProvinceOption
		if err := rows.Scan(&opt.ID, &opt.Label); err != nil {
			return nil, err
		}
		provinces = append(provinces, opt)
	}
	return provinces, nil
}

func (h *ReferenceHandler) getColors(lang string) ([]ReferenceOption, error) {
	labelCol := "label_en"
	if lang == "th" {
		labelCol = "label_th"
	}
	query := "SELECT code, " + labelCol + " FROM colors ORDER BY " + labelCol
	rows, err := h.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var colors []ReferenceOption
	for rows.Next() {
		var opt ReferenceOption
		if err := rows.Scan(&opt.Code, &opt.Label); err != nil {
			return nil, err
		}
		colors = append(colors, opt)
	}
	return colors, nil
}
