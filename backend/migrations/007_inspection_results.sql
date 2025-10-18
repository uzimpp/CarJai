-- Inspection results (summary)
-- Summary results parsed from QR codes

CREATE TABLE inspection_results (
    irid SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars (cid) ON DELETE CASCADE,
    inspected_at TIMESTAMP,
    station VARCHAR(200),
    brake_result VARCHAR(50), -- Brake test result (pass/fail)
    handbrake_result VARCHAR(50), -- Handbrake result (pass/fail)
    alignment_result VARCHAR(50), -- Wheel alignment result (pass/fail)
    noise_result VARCHAR(50), -- Noise level result (pass/fail)
    emission_result VARCHAR(50), -- Emissions result (pass/fail)
    horn_result VARCHAR(50), -- Horn result (pass/fail)
    speedometer_result VARCHAR(50), -- Speedometer result (pass/fail)
    high_low_beam_result VARCHAR(50), -- High/low beam lights result (pass/fail)
    signal_lights_result VARCHAR(50), -- Turn/plate/brake signal lights result (pass/fail)
    other_lights_result VARCHAR(50), -- License plate/other lights result (pass/fail)
    difference_result VARCHAR(50), -- Brake force difference result (pass/fail)
    brake_performance VARCHAR(50), -- Braking performance (%)
    handbrake_performance VARCHAR(50), -- Handbrake performance (%)
    emission_co VARCHAR(50), -- Exhaust CO/HC values (%)
    noise_level VARCHAR(50), -- Noise level (dBA)
    wheel_alignment VARCHAR(50), -- Wheel alignment
    chassis_condition VARCHAR(50), -- Chassis and body condition
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- Indexes
CREATE INDEX idx_inspection_results_car_id ON inspection_results (car_id);

CREATE INDEX idx_inspection_results_inspected_at ON inspection_results (inspected_at);

CREATE TRIGGER update_inspection_results_updated_at BEFORE UPDATE ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
