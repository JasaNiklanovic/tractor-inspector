CREATE TABLE vehicle_sessions (
    id SERIAL PRIMARY KEY,
    date_time TEXT,
    serial_number TEXT,
    gps_longitude DOUBLE PRECISION,
    gps_latitude DOUBLE PRECISION,
    total_working_hours_counter DOUBLE PRECISION,
    engine_speed DOUBLE PRECISION,
    engine_load INT,
    fuel_consumption DOUBLE PRECISION,
    ground_speed_gearbox DOUBLE PRECISION,
    ground_speed_radar DOUBLE PRECISION,
    coolant_temperature INT,
    speed_front_pto INT,
    speed_rear_pto INT,
    current_gear_shift INT NULL,
    ambient_temperature DOUBLE PRECISION NULL,
    parking_brake_status INT,
    transverse_differential_lock_status INT,
    all_wheel_drive_status TEXT,
    actual_status_of_creeper TEXT NULL
);

DO $$
DECLARE
    filenames TEXT[] := ARRAY[
        'csv/LD_A2302895_20190301_20190401.csv',
        'csv/LD_A2302900_20190301_20190401.csv',
        'csv/LD_A6002059_20200314_20200315.csv'
    ];
    filename TEXT;
BEGIN
    FOREACH filename IN ARRAY filenames LOOP
        EXECUTE format(
            'COPY vehicle_sessions (
                date_time, serial_number, gps_longitude, gps_latitude,
                total_working_hours_counter, engine_speed, engine_load,
                fuel_consumption, ground_speed_gearbox, ground_speed_radar,
                coolant_temperature, speed_front_pto, speed_rear_pto,
                current_gear_shift, ambient_temperature, parking_brake_status,
                transverse_differential_lock_status, all_wheel_drive_status,
                actual_status_of_creeper
            )
            FROM ''/docker-entrypoint-initdb.d/%s''
            DELIMITER '';''
            CSV HEADER
            NULL ''NA'';',
            filename
        );
    END LOOP;
END $$;
