package models

import (
	"database/sql"
	"fmt"
	"time"
)

// InspectionResult represents an inspection result record
type InspectionResult struct {
	ID          int        `json:"id" db:"id"`
	CarID       int        `json:"carId" db:"car_id"`
	OverallPass *bool      `json:"overallPass" db:"overall_pass"`
	InspectedAt *time.Time `json:"inspectedAt" db:"inspected_at"`
	Station     *string    `json:"station" db:"station"`

	// Basic test results
	BrakeResult        *bool `json:"brakeResult" db:"brake_result"`
	HandbrakeResult    *bool `json:"handbrakeResult" db:"handbrake_result"`
	AlignmentResult    *bool `json:"alignmentResult" db:"alignment_result"`
	NoiseResult        *bool `json:"noiseResult" db:"noise_result"`
	EmissionResult     *bool `json:"emissionResult" db:"emission_result"`
	HornResult         *bool `json:"hornResult" db:"horn_result"`
	SpeedometerResult  *bool `json:"speedometerResult" db:"speedometer_result"`
	HighLowBeamResult  *bool `json:"highLowBeamResult" db:"high_low_beam_result"`
	SignalLightsResult *bool `json:"signalLightsResult" db:"signal_lights_result"`
	OtherLightsResult  *bool `json:"otherLightsResult" db:"other_lights_result"`
	WindshieldResult   *bool `json:"windshieldResult" db:"windshield_result"`
	SteeringResult     *bool `json:"steeringResult" db:"steering_result"`
	WheelsTiresResult  *bool `json:"wheelsTiresResult" db:"wheels_tires_result"`
	FuelTankResult     *bool `json:"fuelTankResult" db:"fuel_tank_result"`
	ChassisResult      *bool `json:"chassisResult" db:"chassis_result"`
	BodyResult         *bool `json:"bodyResult" db:"body_result"`
	DoorsFloorResult   *bool `json:"doorsFloorResult" db:"doors_floor_result"`
	SeatbeltResult     *bool `json:"seatbeltResult" db:"seatbelt_result"`
	WiperResult        *bool `json:"wiperResult" db:"wiper_result"`

	CreatedAt time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
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
		INSERT INTO car_inspection_results (
			car_id, inspected_at, station, overall_pass,
			brake_result, handbrake_result, alignment_result, noise_result, emission_result,
			horn_result, speedometer_result, high_low_beam_result, signal_lights_result,
			other_lights_result, windshield_result, steering_result, wheels_tires_result,
			fuel_tank_result, chassis_result, body_result, doors_floor_result, seatbelt_result, wiper_result
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
			$17, $18, $19, $20, $21, $22, $23
		)
		RETURNING id, created_at, updated_at`

	err := r.db.DB.QueryRow(query,
		inspection.CarID, inspection.InspectedAt, inspection.Station, inspection.OverallPass,
		inspection.BrakeResult, inspection.HandbrakeResult, inspection.AlignmentResult,
		inspection.NoiseResult, inspection.EmissionResult, inspection.HornResult,
		inspection.SpeedometerResult, inspection.HighLowBeamResult, inspection.SignalLightsResult,
		inspection.OtherLightsResult, inspection.WindshieldResult, inspection.SteeringResult, inspection.WheelsTiresResult,
		inspection.FuelTankResult, inspection.ChassisResult, inspection.BodyResult, inspection.DoorsFloorResult, inspection.SeatbeltResult, inspection.WiperResult,
	).Scan(&inspection.ID, &inspection.CreatedAt, &inspection.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create inspection result: %w", err)
	}

	return nil
}

// GetInspectionByCarID retrieves inspection results for a car
func (r *InspectionRepository) GetInspectionByCarID(carID int) (*InspectionResult, error) {
	inspection := &InspectionResult{}
	query := `
		SELECT id, car_id, inspected_at, station, overall_pass,
			brake_result, handbrake_result, alignment_result, noise_result, emission_result,
			horn_result, speedometer_result, high_low_beam_result, signal_lights_result,
			other_lights_result, windshield_result, steering_result, wheels_tires_result,
			fuel_tank_result, chassis_result, body_result, doors_floor_result, seatbelt_result, wiper_result,
			created_at, updated_at
		FROM car_inspection_results
		WHERE car_id = $1
		ORDER BY created_at DESC
		LIMIT 1`

	err := r.db.DB.QueryRow(query, carID).Scan(
		&inspection.ID, &inspection.CarID, &inspection.InspectedAt, &inspection.Station, &inspection.OverallPass,
		&inspection.BrakeResult, &inspection.HandbrakeResult, &inspection.AlignmentResult, &inspection.NoiseResult, &inspection.EmissionResult,
		&inspection.HornResult, &inspection.SpeedometerResult, &inspection.HighLowBeamResult, &inspection.SignalLightsResult,
		&inspection.OtherLightsResult, &inspection.WindshieldResult, &inspection.SteeringResult, &inspection.WheelsTiresResult,
		&inspection.FuelTankResult, &inspection.ChassisResult, &inspection.BodyResult, &inspection.DoorsFloorResult, &inspection.SeatbeltResult, &inspection.WiperResult,
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
		UPDATE car_inspection_results SET
			inspected_at = $2, station = $3, overall_pass = $4,
			brake_result = $5, handbrake_result = $6, alignment_result = $7,
			noise_result = $8, emission_result = $9, horn_result = $10,
			speedometer_result = $11, high_low_beam_result = $12, signal_lights_result = $13,
			other_lights_result = $14, windshield_result = $15, steering_result = $16, wheels_tires_result = $17,
			fuel_tank_result = $18, chassis_result = $19, body_result = $20, doors_floor_result = $21, seatbelt_result = $22, wiper_result = $23
		WHERE id = $1`

	result, err := r.db.DB.Exec(query,
		inspection.ID, inspection.InspectedAt, inspection.Station, inspection.OverallPass,
		inspection.BrakeResult, inspection.HandbrakeResult, inspection.AlignmentResult,
		inspection.NoiseResult, inspection.EmissionResult, inspection.HornResult,
		inspection.SpeedometerResult, inspection.HighLowBeamResult, inspection.SignalLightsResult,
		inspection.OtherLightsResult, inspection.WindshieldResult, inspection.SteeringResult, inspection.WheelsTiresResult,
		inspection.FuelTankResult, inspection.ChassisResult, inspection.BodyResult, inspection.DoorsFloorResult, inspection.SeatbeltResult, inspection.WiperResult,
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
	query := `DELETE FROM car_inspection_results WHERE car_id = $1`

	_, err := r.db.DB.Exec(query, carID)
	if err != nil {
		return fmt.Errorf("failed to delete inspection results: %w", err)
	}

	return nil
}
