import axios from 'axios'

const API_BASE = 'http://localhost:3000'

export interface Tractor {
  serial_number: string
  total_working_hours_counter: number
}

export interface TractorSession {
  id: number
  date_time: string
  serial_number: string
  gps_longitude: number | null
  gps_latitude: number | null
  total_working_hours_counter: number | null
  engine_speed: number | null
  engine_load: number | null
  fuel_consumption: number | null
  ground_speed_gearbox: number | null
  ground_speed_radar: number | null
  coolant_temperature: number | null
  speed_front_pto: number | null
  speed_rear_pto: number | null
  current_gear_shift: number | null
  ambient_temperature: number | null
  parking_brake_status: number | null
  transverse_differential_lock_status: number | null
  all_wheel_drive_status: string | null
  actual_status_of_creeper: string | null
}

export interface PaginatedResponse {
  data: TractorSession[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface GPSData {
  id: number
  date_time: string
  gps_longitude: number
  gps_latitude: number
  ground_speed_gearbox: number
  engine_speed: number
}

export async function getTractors(): Promise<Tractor[]> {
  const response = await axios.get<Tractor[]>(`${API_BASE}/tractors`)
  return response.data
}

export async function getTractorData(
  serialNumber: string,
  page: number = 1,
  pageSize: number = 25,
  sortBy: string = 'date_time',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<PaginatedResponse> {
  const response = await axios.get<PaginatedResponse>(
    `${API_BASE}/tractors/${serialNumber}`,
    {
      params: { page, pageSize, sortBy, sortOrder }
    }
  )
  return response.data
}

export async function getSession(serialNumber: string, id: number): Promise<TractorSession> {
  const response = await axios.get<TractorSession>(
    `${API_BASE}/tractors/${serialNumber}/sessions/${id}`
  )
  return response.data
}

export async function updateSession(
  serialNumber: string,
  id: number,
  data: Partial<TractorSession>
): Promise<TractorSession> {
  const response = await axios.put<TractorSession>(
    `${API_BASE}/tractors/${serialNumber}/sessions/${id}`,
    data
  )
  return response.data
}

export async function getGPSData(serialNumber: string): Promise<GPSData[]> {
  const response = await axios.get<GPSData[]>(
    `${API_BASE}/tractors/${serialNumber}/gps`
  )
  return response.data
}
