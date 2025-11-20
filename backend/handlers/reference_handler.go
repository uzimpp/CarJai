package handlers

import (
	"database/sql"
	"net/http"

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

// GetAll handles GET /api/reference-data/all
func (h *ReferenceHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	// Get language parameter (default to "en")
	lang := r.URL.Query().Get("lang")
	if lang == "" {
		lang = "en"
	}

	// Get body types
	bodyTypes, err := h.getBodyTypes(lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to fetch body types")
		return
	}

	// Get transmissions
	transmissions, err := h.getTransmissions(lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to fetch transmissions")
		return
	}

	// Get fuel types
	fuelTypes, err := h.getFuelTypes(lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to fetch fuel types")
		return
	}

	// Get drivetrains
	drivetrains, err := h.getDrivetrains(lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to fetch drivetrains")
		return
	}

	// Get colors
	colors, err := h.getColors(lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to fetch colors")
		return
	}

	// Get provinces
	provinces, err := h.getProvinces(lang)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to fetch provinces")
		return
	}

	utils.WriteJSON(w, http.StatusOK, ReferenceData{
		BodyTypes:     bodyTypes,
		Transmissions: transmissions,
		FuelTypes:     fuelTypes,
		Drivetrains:   drivetrains,
		Colors:        colors,
		Provinces:     provinces,
	}, "")
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

// GetBrands handles GET /api/reference-data/brands
func (h *ReferenceHandler) GetBrands(w http.ResponseWriter, r *http.Request) {
	query := `SELECT DISTINCT brand FROM market_price WHERE brand IS NOT NULL AND brand != '' ORDER BY brand;`

	rows, err := h.db.Query(query)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to query brands: "+err.Error())
		return
	}
	defer rows.Close()

	// Use make to ensure an empty slice [] is returned, not nil (which becomes null in JSON)
	brands := make([]string, 0)
	for rows.Next() {
		var brand string
		if err := rows.Scan(&brand); err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to scan brand: "+err.Error())
			return
		}
		brands = append(brands, brand)
	}

	utils.WriteJSON(w, http.StatusOK, brands, "")
}

// GetModels handles GET /api/reference-data/models
func (h *ReferenceHandler) GetModels(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	if brand == "" {
		utils.WriteError(w, http.StatusBadRequest, "Brand query parameter is required")
		return
	}

	query := `SELECT DISTINCT model FROM market_price WHERE brand = $1 AND model IS NOT NULL AND model != '' ORDER BY model;`
	rows, err := h.db.Query(query, brand)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to query models: "+err.Error())
		return
	}
	defer rows.Close()

	// Use make to ensure an empty slice [] is returned, not nil
	modelsList := make([]string, 0)
	for rows.Next() {
		var model string
		if err := rows.Scan(&model); err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to scan model: "+err.Error())
			return
		}
		modelsList = append(modelsList, model)
	}

	utils.WriteJSON(w, http.StatusOK, modelsList, "")
}

// GetSubModels handles GET /api/reference-data/submodels
func (h *ReferenceHandler) GetSubModels(w http.ResponseWriter, r *http.Request) {
	brand := r.URL.Query().Get("brand")
	model := r.URL.Query().Get("model")
	if brand == "" || model == "" {
		utils.WriteError(w, http.StatusBadRequest, "Brand and Model query parameters are required")
		return
	}

	query := `SELECT DISTINCT sub_model FROM market_price WHERE brand = $1 AND model = $2 AND sub_model IS NOT NULL AND sub_model != '' ORDER BY sub_model;`
	rows, err := h.db.Query(query, brand, model)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, "Failed to query submodels: "+err.Error())
		return
	}
	defer rows.Close()

	// Use make to ensure an empty slice [] is returned, not nil
	subModels := make([]string, 0)
	for rows.Next() {
		var subModel string
		if err := rows.Scan(&subModel); err != nil {
			utils.WriteError(w, http.StatusInternalServerError, "Failed to scan submodel: "+err.Error())
			return
		}
		subModels = append(subModels, subModel)
	}

	utils.WriteJSON(w, http.StatusOK, subModels, "")
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
