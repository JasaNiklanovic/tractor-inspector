import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import {
  getTractors,
  getTractorData,
  getSession,
  updateSession,
  getGPSData,
  type Tractor,
  type TractorSession,
  type PaginatedResponse,
  type GPSData
} from './tractors'

vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('tractors API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTractors', () => {
    it('fetches list of tractors', async () => {
      const mockTractors: Tractor[] = [
        { serial_number: 'ABC123', total_working_hours_counter: 100.5 },
        { serial_number: 'DEF456', total_working_hours_counter: 200.0 }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: mockTractors })

      const result = await getTractors()

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/tractors')
      expect(result).toEqual(mockTractors)
    })

    it('throws error when API fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

      await expect(getTractors()).rejects.toThrow('Network error')
    })
  })

  describe('getTractorData', () => {
    it('fetches paginated tractor data with default params', async () => {
      const mockResponse: PaginatedResponse = {
        data: [],
        total: 100,
        page: 1,
        pageSize: 25,
        totalPages: 4
      }
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await getTractorData('ABC123')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/tractors/ABC123',
        { params: { page: 1, pageSize: 25, sortBy: 'date_time', sortOrder: 'asc' } }
      )
      expect(result).toEqual(mockResponse)
    })

    it('fetches paginated data with custom params', async () => {
      const mockResponse: PaginatedResponse = {
        data: [],
        total: 100,
        page: 2,
        pageSize: 50,
        totalPages: 2
      }
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse })

      const result = await getTractorData('ABC123', 2, 50, 'engine_speed', 'desc')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/tractors/ABC123',
        { params: { page: 2, pageSize: 50, sortBy: 'engine_speed', sortOrder: 'desc' } }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSession', () => {
    it('fetches a single session by id', async () => {
      const mockSession: TractorSession = {
        id: 1,
        date_time: '2024-01-15T10:00:00',
        serial_number: 'ABC123',
        gps_longitude: 15.5,
        gps_latitude: 46.0,
        total_working_hours_counter: 100.5,
        engine_speed: 1500,
        engine_load: 75,
        fuel_consumption: 12.5,
        ground_speed_gearbox: 8.5,
        ground_speed_radar: 8.3,
        coolant_temperature: 85,
        speed_front_pto: 540,
        speed_rear_pto: 1000,
        current_gear_shift: 5,
        ambient_temperature: 22.0,
        parking_brake_status: 0,
        transverse_differential_lock_status: 0,
        all_wheel_drive_status: 'ON',
        actual_status_of_creeper: 'OFF'
      }
      mockedAxios.get.mockResolvedValueOnce({ data: mockSession })

      const result = await getSession('ABC123', 1)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/tractors/ABC123/sessions/1'
      )
      expect(result).toEqual(mockSession)
    })
  })

  describe('updateSession', () => {
    it('updates a session with partial data', async () => {
      const updateData = { engine_speed: 1600, engine_load: 80 }
      const mockUpdated: TractorSession = {
        id: 1,
        date_time: '2024-01-15T10:00:00',
        serial_number: 'ABC123',
        gps_longitude: 15.5,
        gps_latitude: 46.0,
        total_working_hours_counter: 100.5,
        engine_speed: 1600,
        engine_load: 80,
        fuel_consumption: 12.5,
        ground_speed_gearbox: 8.5,
        ground_speed_radar: 8.3,
        coolant_temperature: 85,
        speed_front_pto: 540,
        speed_rear_pto: 1000,
        current_gear_shift: 5,
        ambient_temperature: 22.0,
        parking_brake_status: 0,
        transverse_differential_lock_status: 0,
        all_wheel_drive_status: 'ON',
        actual_status_of_creeper: 'OFF'
      }
      mockedAxios.put.mockResolvedValueOnce({ data: mockUpdated })

      const result = await updateSession('ABC123', 1, updateData)

      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:3000/tractors/ABC123/sessions/1',
        updateData
      )
      expect(result).toEqual(mockUpdated)
    })
  })

  describe('getGPSData', () => {
    it('fetches GPS data for a tractor', async () => {
      const mockGPSData: GPSData[] = [
        {
          id: 1,
          date_time: '2024-01-15T10:00:00',
          gps_longitude: 15.5,
          gps_latitude: 46.0,
          ground_speed_gearbox: 8.5,
          engine_speed: 1500
        },
        {
          id: 2,
          date_time: '2024-01-15T10:01:00',
          gps_longitude: 15.51,
          gps_latitude: 46.01,
          ground_speed_gearbox: 9.0,
          engine_speed: 1550
        }
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: mockGPSData })

      const result = await getGPSData('ABC123')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/tractors/ABC123/gps'
      )
      expect(result).toEqual(mockGPSData)
    })
  })
})
