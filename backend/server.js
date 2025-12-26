import express from "express";
import cors from "cors";
import { query } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Valid columns for sorting
const VALID_COLUMNS = [
  'id', 'date_time', 'serial_number', 'gps_longitude', 'gps_latitude',
  'total_working_hours_counter', 'engine_speed', 'engine_load', 'fuel_consumption',
  'ground_speed_gearbox', 'ground_speed_radar', 'coolant_temperature',
  'speed_front_pto', 'speed_rear_pto', 'current_gear_shift', 'ambient_temperature',
  'parking_brake_status', 'transverse_differential_lock_status',
  'all_wheel_drive_status', 'actual_status_of_creeper'
];

// Get all tractors with their latest working hours
app.get("/tractors", async (req, res) => {
  try {
    const result = await query(`
      SELECT DISTINCT ON (serial_number)
        serial_number,
        total_working_hours_counter
      FROM vehicle_sessions
      ORDER BY serial_number, date_time DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

// Get tractor summary (for list page)
app.get("/tractors/:serialNumber/summary", async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const result = await query(`
      SELECT
        serial_number,
        MAX(total_working_hours_counter) as total_working_hours,
        COUNT(*) as total_records,
        MIN(date_time) as first_record,
        MAX(date_time) as last_record
      FROM vehicle_sessions
      WHERE serial_number = $1
      GROUP BY serial_number
    `, [serialNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tractor not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: "Failed to retrieve summary" });
  }
});

// Get tractor data with pagination and sorting
app.get("/tractors/:serialNumber", async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 25));
    const sortBy = VALID_COLUMNS.includes(req.query.sortBy) ? req.query.sortBy : 'date_time';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await query(
      "SELECT COUNT(*) FROM vehicle_sessions WHERE serial_number = $1",
      [serialNumber]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataResult = await query(
      `SELECT * FROM vehicle_sessions
       WHERE serial_number = $1
       ORDER BY ${sortBy} ${sortOrder}
       LIMIT $2 OFFSET $3`,
      [serialNumber, pageSize, offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

// Get single session by ID
app.get("/tractors/:serialNumber/sessions/:id", async (req, res) => {
  try {
    const { serialNumber, id } = req.params;
    const result = await query(
      "SELECT * FROM vehicle_sessions WHERE serial_number = $1 AND id = $2",
      [serialNumber, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to retrieve session" });
  }
});

// Update session data
app.put("/tractors/:serialNumber/sessions/:id", async (req, res) => {
  try {
    const { serialNumber, id } = req.params;
    const {
      gps_longitude,
      gps_latitude,
      total_working_hours_counter,
      engine_speed,
      engine_load,
      fuel_consumption,
      ground_speed_gearbox,
      ground_speed_radar,
      coolant_temperature,
      speed_front_pto,
      speed_rear_pto,
      current_gear_shift,
      ambient_temperature,
      parking_brake_status,
      transverse_differential_lock_status,
      all_wheel_drive_status,
      actual_status_of_creeper
    } = req.body;

    // Basic validation
    if (engine_load !== undefined && (engine_load < 0 || engine_load > 100)) {
      return res.status(400).json({ error: "Engine load must be between 0 and 100" });
    }

    const result = await query(
      `UPDATE vehicle_sessions SET
        gps_longitude = COALESCE($3, gps_longitude),
        gps_latitude = COALESCE($4, gps_latitude),
        total_working_hours_counter = COALESCE($5, total_working_hours_counter),
        engine_speed = COALESCE($6, engine_speed),
        engine_load = COALESCE($7, engine_load),
        fuel_consumption = COALESCE($8, fuel_consumption),
        ground_speed_gearbox = COALESCE($9, ground_speed_gearbox),
        ground_speed_radar = COALESCE($10, ground_speed_radar),
        coolant_temperature = COALESCE($11, coolant_temperature),
        speed_front_pto = COALESCE($12, speed_front_pto),
        speed_rear_pto = COALESCE($13, speed_rear_pto),
        current_gear_shift = COALESCE($14, current_gear_shift),
        ambient_temperature = COALESCE($15, ambient_temperature),
        parking_brake_status = COALESCE($16, parking_brake_status),
        transverse_differential_lock_status = COALESCE($17, transverse_differential_lock_status),
        all_wheel_drive_status = COALESCE($18, all_wheel_drive_status),
        actual_status_of_creeper = COALESCE($19, actual_status_of_creeper)
      WHERE serial_number = $1 AND id = $2
      RETURNING *`,
      [
        serialNumber, id, gps_longitude, gps_latitude, total_working_hours_counter,
        engine_speed, engine_load, fuel_consumption, ground_speed_gearbox,
        ground_speed_radar, coolant_temperature, speed_front_pto, speed_rear_pto,
        current_gear_shift, ambient_temperature, parking_brake_status,
        transverse_differential_lock_status, all_wheel_drive_status, actual_status_of_creeper
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// Get all GPS data for map visualization
app.get("/tractors/:serialNumber/gps", async (req, res) => {
  try {
    const { serialNumber } = req.params;
    const result = await query(
      `SELECT id, date_time, gps_longitude, gps_latitude, ground_speed_gearbox, engine_speed
       FROM vehicle_sessions
       WHERE serial_number = $1
       ORDER BY date_time ASC`,
      [serialNumber]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching GPS data:", error);
    res.status(500).json({ error: "Failed to retrieve GPS data" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API running at http://localhost:${PORT}`);
});
