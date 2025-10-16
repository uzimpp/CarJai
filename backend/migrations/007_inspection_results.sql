-- Inspection results (summary)
-- Summary results parsed from QR codes

CREATE TABLE inspection_results (
    irid SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars (cid) ON DELETE CASCADE,
    overall_pass BOOLEAN,
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

-- Brake test details
CREATE TABLE brake_tests (
    btid SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspection_results (irid) ON DELETE CASCADE,
    axle1_left DECIMAL(10, 2), -- Brake force axle 1 left
    axle1_right DECIMAL(10, 2), -- Brake force axle 1 right
    axle2_left DECIMAL(10, 2), -- Brake force axle 2 left
    axle2_right DECIMAL(10, 2), -- Brake force axle 2 right
    axle3_left DECIMAL(10, 2), -- Brake force axle 3 left
    axle3_right DECIMAL(10, 2), -- Brake force axle 3 right
    axle4_left DECIMAL(10, 2), -- Brake force axle 4 left
    axle4_right DECIMAL(10, 2), -- Brake force axle 4 right
    weight_axle1 DECIMAL(10, 2), -- Axle 1 load weight
    weight_axle2 DECIMAL(10, 2), -- Axle 2 load weight
    weight_axle3 DECIMAL(10, 2), -- Axle 3 load weight
    weight_axle4 DECIMAL(10, 2), -- Axle 4 load weight
    diff_axle1 DECIMAL(10, 2), -- Difference axle 1 (%)
    diff_axle2 DECIMAL(10, 2), -- Difference axle 2 (%)
    diff_axle3 DECIMAL(10, 2), -- Difference axle 3 (%)
    diff_axle4 DECIMAL(10, 2), -- Difference axle 4 (%)
    handbrake_left DECIMAL(10, 2), -- Handbrake force left
    handbrake_right DECIMAL(10, 2), -- Handbrake force right
    brake_efficiency DECIMAL(10, 2), -- Braking efficiency (%)
    handbrake_efficiency DECIMAL(10, 2), -- Handbrake efficiency (%)
    wheel_alignment DECIMAL(10, 2) -- Wheel alignment
);

-- Light test details
CREATE TABLE light_tests (
    ltid SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspection_results (irid) ON DELETE CASCADE,
    high_beam_left_intensity DECIMAL(10, 2), -- High beam intensity left
    high_beam_right_intensity DECIMAL(10, 2), -- High beam intensity right
    low_beam_left_intensity DECIMAL(10, 2), -- Low beam intensity left
    low_beam_right_intensity DECIMAL(10, 2), -- Low beam intensity right
    high_beam_left_position DECIMAL(10, 2), -- High beam position left
    high_beam_right_position DECIMAL(10, 2), -- High beam position right
    low_beam_left_position DECIMAL(10, 2), -- Low beam position left
    low_beam_right_position DECIMAL(10, 2) -- Low beam position right
);

-- Emission test details
CREATE TABLE emission_tests (
    etid SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspection_results (irid) ON DELETE CASCADE,
    noise_level DECIMAL(10, 2), -- Noise level (dB)
    emission_co DECIMAL(10, 2) -- Exhaust CO (%)
);

-- Visual inspection checklist
CREATE TABLE visual_inspections (
    viid SERIAL PRIMARY KEY,
    inspection_id INTEGER NOT NULL REFERENCES inspection_results (irid) ON DELETE CASCADE,
    windshield_result VARCHAR(20), -- Windshield result (pass/fail)
    steering_result VARCHAR(20), -- Steering system result (pass/fail)
    wheels_tires_result VARCHAR(20), -- Wheels and tires result (pass/fail)
    fuel_tank_result VARCHAR(20), -- Fuel tank result (pass/fail)
    chassis_result VARCHAR(20), -- Undercarriage result (pass/fail)
    body_result VARCHAR(20), -- Body result (pass/fail)
    doors_floor_result VARCHAR(20), -- Doors/floor result (pass/fail)
    seatbelt_result VARCHAR(20), -- Seatbelt result (pass/fail)
    wiper_result VARCHAR(20), -- Wipers result (pass/fail)
    horn_result VARCHAR(20), -- Horn result (pass/fail)
    speedometer_result VARCHAR(20) -- Speedometer result (pass/fail)
);
-- ================================================================================

-- Indexes
CREATE INDEX idx_inspection_results_car_id ON inspection_results (car_id);

CREATE INDEX idx_inspection_results_inspected_at ON inspection_results (inspected_at);

CREATE INDEX idx_brake_tests_inspection_id ON brake_tests (inspection_id);

CREATE INDEX idx_light_tests_inspection_id ON light_tests (inspection_id);

CREATE INDEX idx_emission_tests_inspection_id ON emission_tests (inspection_id);

CREATE INDEX idx_visual_inspections_inspection_id ON visual_inspections (inspection_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_inspection_results_updated_at BEFORE UPDATE ON inspection_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
