-- Inspection results (summary)
-- Summary results parsed from QR codes

CREATE TABLE car_inspection_results (
    irid SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars (cid) ON DELETE CASCADE,
    inspected_at TIMESTAMP,
    station VARCHAR(200),
    overall_pass BOOLEAN,
    brake_result BOOLEAN, -- Brake test (pass/fail)
    handbrake_result BOOLEAN, -- Handbrake (pass/fail)
    alignment_result BOOLEAN, -- Wheel alignment (pass/fail)
    noise_result BOOLEAN, -- Noise level (pass/fail)
    emission_result BOOLEAN, -- Emissions (pass/fail)
    horn_result BOOLEAN, -- Horn (pass/fail)
    speedometer_result BOOLEAN, -- Speedometer (pass/fail)
    high_low_beam_result BOOLEAN, -- High/low beams (pass/fail)
    signal_lights_result BOOLEAN, -- Turn/plate/brake lights (pass/fail)
    other_lights_result BOOLEAN, -- License plate/other lights (pass/fail)
    windshield_result BOOLEAN, -- Windshields/windows (pass/fail)
    steering_result BOOLEAN, -- Steering system (pass/fail)
    wheels_tires_result BOOLEAN, -- Wheels and tires (pass/fail)
    fuel_tank_result BOOLEAN, -- Fuel tank and lines (pass/fail)
    chassis_result BOOLEAN, -- Undercarriage (pass/fail)
    body_result BOOLEAN, -- Body and frame (pass/fail)
    doors_floor_result BOOLEAN, -- Doors and floor (pass/fail)
    seatbelt_result BOOLEAN, -- Seatbelts (pass/fail)
    wiper_result BOOLEAN, -- Wipers (pass/fail)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- Indexes
CREATE INDEX idx_inspection_results_car_id ON car_inspection_results (car_id);

CREATE INDEX idx_inspection_results_inspected_at ON car_inspection_results (inspected_at);

CREATE TRIGGER update_inspection_results_updated_at BEFORE UPDATE ON car_inspection_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
