package models

import (
	"database/sql"
	"fmt"
	"time"
)

// InspectionResult represents an inspection result record
type InspectionResult struct {
	IRID        int        `json:"irid" db:"irid"`
	CarID       int        `json:"carId" db:"car_id"`
	OverallPass *bool      `json:"overallPass" db:"overall_pass"`
	InspectedAt *time.Time `json:"inspectedAt" db:"inspected_at"`
	Station     *string    `json:"station" db:"station"`

	// Basic test results
	BrakeResult        *string `json:"brakeResult" db:"brake_result"`
	HandbrakeResult    *string `json:"handbrakeResult" db:"handbrake_result"`
	AlignmentResult    *string `json:"alignmentResult" db:"alignment_result"`
	NoiseResult        *string `json:"noiseResult" db:"noise_result"`
	EmissionResult     *string `json:"emissionResult" db:"emission_result"`
	HornResult         *string `json:"hornResult" db:"horn_result"`
	SpeedometerResult  *string `json:"speedometerResult" db:"speedometer_result"`
	HighLowBeamResult  *string `json:"highLowBeamResult" db:"high_low_beam_result"`
	SignalLightsResult *string `json:"signalLightsResult" db:"signal_lights_result"`
	OtherLightsResult  *string `json:"otherLightsResult" db:"other_lights_result"`
	DifferenceResult   *string `json:"differenceResult" db:"difference_result"`

	// Performance metrics
	BrakePerformance     *string `json:"brakePerformance" db:"brake_performance"`
	HandbrakePerformance *string `json:"handbrakePerformance" db:"handbrake_performance"`
	EmissionCO           *string `json:"emissionCo" db:"emission_co"`
	NoiseLevel           *string `json:"noiseLevel" db:"noise_level"`
	WheelAlignment       *string `json:"wheelAlignment" db:"wheel_alignment"`
	ChassisCondition     *string `json:"chassisCondition" db:"chassis_condition"`

	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

// CreateInspectionRequest represents the request to create an inspection result
// This is embedded in CreateCarRequest but separated here for clarity
type CreateInspectionRequest struct {
	OverallResult          *string `json:"overallResult"`
	BrakeResult            *string `json:"brakeResult"`
	WheelAlignmentResult   *string `json:"wheelAlignmentResult"`
	EmissionResult         *string `json:"emissionResult"`
	ChassisConditionResult *string `json:"chassisConditionResult"`
	BrakePerformance       *string `json:"brakePerformance"`
	HandbrakePerformance   *string `json:"handbrakePerformance"`
	EmissionValue          *string `json:"emissionValue"`
	NoiseLevel             *string `json:"noiseLevel"`
}

// InspectionRepository handles inspection-related database operations
type InspectionRepository struct {
	db *Database
}

// NewInspectionRepository creates a new inspection repository
func NewInspectionRepository(db *Database) *InspectionRepository {
	return &InspectionRepository{db: db}
}

// CreateInspectionResult creates a new inspection result
func (r *InspectionRepository) CreateInspectionResult(inspection *InspectionResult) error {
	query := `
		INSERT INTO inspection_results (
			car_id, overall_pass, inspected_at, station,
			brake_result, handbrake_result, alignment_result, noise_result, emission_result,
			horn_result, speedometer_result, high_low_beam_result, signal_lights_result,
			other_lights_result, difference_result,
			brake_performance, handbrake_performance, emission_co, noise_level,
			wheel_alignment, chassis_condition
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
			$16, $17, $18, $19, $20, $21
		)
		RETURNING irid, created_at, updated_at`

	err := r.db.DB.QueryRow(query,
		inspection.CarID, inspection.OverallPass, inspection.InspectedAt, inspection.Station,
		inspection.BrakeResult, inspection.HandbrakeResult, inspection.AlignmentResult,
		inspection.NoiseResult, inspection.EmissionResult, inspection.HornResult,
		inspection.SpeedometerResult, inspection.HighLowBeamResult, inspection.SignalLightsResult,
		inspection.OtherLightsResult, inspection.DifferenceResult,
		inspection.BrakePerformance, inspection.HandbrakePerformance, inspection.EmissionCO,
		inspection.NoiseLevel, inspection.WheelAlignment, inspection.ChassisCondition,
	).Scan(&inspection.IRID, &inspection.CreatedAt, &inspection.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create inspection result: %w", err)
	}

	return nil
}

// GetInspectionByCarID retrieves inspection results for a car
func (r *InspectionRepository) GetInspectionByCarID(carID int) (*InspectionResult, error) {
	inspection := &InspectionResult{}
	query := `
		SELECT irid, car_id, overall_pass, inspected_at, station,
			brake_result, handbrake_result, alignment_result, noise_result, emission_result,
			horn_result, speedometer_result, high_low_beam_result, signal_lights_result,
			other_lights_result, difference_result,
			brake_performance, handbrake_performance, emission_co, noise_level,
			wheel_alignment, chassis_condition, created_at, updated_at
		FROM inspection_results
		WHERE car_id = $1
		ORDER BY created_at DESC
		LIMIT 1`

	err := r.db.DB.QueryRow(query, carID).Scan(
		&inspection.IRID, &inspection.CarID, &inspection.OverallPass, &inspection.InspectedAt,
		&inspection.Station, &inspection.BrakeResult, &inspection.HandbrakeResult,
		&inspection.AlignmentResult, &inspection.NoiseResult, &inspection.EmissionResult,
		&inspection.HornResult, &inspection.SpeedometerResult, &inspection.HighLowBeamResult,
		&inspection.SignalLightsResult, &inspection.OtherLightsResult, &inspection.DifferenceResult,
		&inspection.BrakePerformance, &inspection.HandbrakePerformance, &inspection.EmissionCO,
		&inspection.NoiseLevel, &inspection.WheelAlignment, &inspection.ChassisCondition,
		&inspection.CreatedAt, &inspection.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No inspection found is OK
		}
		return nil, fmt.Errorf("failed to get inspection result: %w", err)
	}

	return inspection, nil
}

// UpdateInspectionResult updates an inspection result
func (r *InspectionRepository) UpdateInspectionResult(inspection *InspectionResult) error {
	query := `
		UPDATE inspection_results SET
			overall_pass = $2, inspected_at = $3, station = $4,
			brake_result = $5, handbrake_result = $6, alignment_result = $7,
			noise_result = $8, emission_result = $9, horn_result = $10,
			speedometer_result = $11, high_low_beam_result = $12, signal_lights_result = $13,
			other_lights_result = $14, difference_result = $15,
			brake_performance = $16, handbrake_performance = $17, emission_co = $18,
			noise_level = $19, wheel_alignment = $20, chassis_condition = $21
		WHERE irid = $1`

	result, err := r.db.DB.Exec(query,
		inspection.IRID, inspection.OverallPass, inspection.InspectedAt, inspection.Station,
		inspection.BrakeResult, inspection.HandbrakeResult, inspection.AlignmentResult,
		inspection.NoiseResult, inspection.EmissionResult, inspection.HornResult,
		inspection.SpeedometerResult, inspection.HighLowBeamResult, inspection.SignalLightsResult,
		inspection.OtherLightsResult, inspection.DifferenceResult,
		inspection.BrakePerformance, inspection.HandbrakePerformance, inspection.EmissionCO,
		inspection.NoiseLevel, inspection.WheelAlignment, inspection.ChassisCondition,
	)

	if err != nil {
		return fmt.Errorf("failed to update inspection result: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("inspection result not found")
	}

	return nil
}

// DeleteInspectionByCarID deletes all inspection results for a car
func (r *InspectionRepository) DeleteInspectionByCarID(carID int) error {
	query := `DELETE FROM inspection_results WHERE car_id = $1`

	_, err := r.db.DB.Exec(query, carID)
	if err != nil {
		return fmt.Errorf("failed to delete inspection results: %w", err)
	}

	return nil
}
