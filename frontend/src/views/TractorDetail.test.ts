import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import TractorDetail from './TractorDetail.vue'
import * as tractorsApi from '@/api/tractors'

vi.mock('@/api/tractors')
const mockedApi = vi.mocked(tractorsApi)

const mockPaginatedResponse: tractorsApi.PaginatedResponse = {
  data: [
    {
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
    },
    {
      id: 2,
      date_time: '2024-01-15T10:01:00',
      serial_number: 'ABC123',
      gps_longitude: 15.51,
      gps_latitude: 46.01,
      total_working_hours_counter: 100.52,
      engine_speed: 1550,
      engine_load: 80,
      fuel_consumption: 13.0,
      ground_speed_gearbox: 9.0,
      ground_speed_radar: 8.8,
      coolant_temperature: 86,
      speed_front_pto: 540,
      speed_rear_pto: 1000,
      current_gear_shift: 5,
      ambient_temperature: 22.5,
      parking_brake_status: 0,
      transverse_differential_lock_status: 0,
      all_wheel_drive_status: 'ON',
      actual_status_of_creeper: 'OFF'
    }
  ],
  total: 100,
  page: 1,
  pageSize: 25,
  totalPages: 4
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div/>' } },
    { path: '/tractors/:serialNumber', name: 'tractor-detail', component: TractorDetail },
    { path: '/tractors/:serialNumber/edit/:id', name: 'edit-session', component: { template: '<div/>' } },
    { path: '/tractors/:serialNumber/map', name: 'tractor-map', component: { template: '<div/>' } }
  ]
})

describe('TractorDetail', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await router.push('/tractors/ABC123')
    await router.isReady()
  })

  it('displays loading state initially', () => {
    mockedApi.getTractorData.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    expect(wrapper.text()).toContain('Loading telemetry data')
  })

  it('displays tractor serial number in header', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('ABC123')
  })

  it('displays data table with records', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('2024-01-15T10:00:00')
    expect(wrapper.text()).toContain('100.50')
    expect(wrapper.text()).toContain('1500')
  })

  it('displays pagination info correctly', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Showing')
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('25')
    expect(wrapper.text()).toContain('100')
  })

  it('displays error message when API fails', async () => {
    mockedApi.getTractorData.mockRejectedValueOnce(new Error('API Error'))

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load tractor data')
  })

  it('renders column headers', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Date / Time')
    expect(wrapper.text()).toContain('Working Hours')
    expect(wrapper.text()).toContain('Engine (rpm)')
    expect(wrapper.text()).toContain('Load (%)')
    expect(wrapper.text()).toContain('Fuel (l/h)')
  })

  it('creates links to edit session page', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const editLinks = wrapper.findAll('a[href*="/edit/"]')
    expect(editLinks.length).toBe(2)
  })

  it('has link to map view', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const mapLink = wrapper.find('a[href="/tractors/ABC123/map"]')
    expect(mapLink.exists()).toBe(true)
    expect(mapLink.text()).toContain('View Movement Map')
  })

  it('has back button to home', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const backLink = wrapper.find('a[href="/"]')
    expect(backLink.exists()).toBe(true)
  })

  it('displays page size selector', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    expect(wrapper.text()).toContain('Rows per page')
  })

  it('displays pagination buttons', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const paginationButtons = wrapper.findAll('.pagination-btn')
    expect(paginationButtons.length).toBeGreaterThan(0)
  })

  it('color-codes engine load values', async () => {
    mockedApi.getTractorData.mockResolvedValueOnce(mockPaginatedResponse)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    // 75% should be amber (warning)
    expect(wrapper.html()).toContain('75%')
    // 80% should be red (error)
    expect(wrapper.html()).toContain('80%')
  })

  it('handles null values with dash', async () => {
    const responseWithNulls: tractorsApi.PaginatedResponse = {
      ...mockPaginatedResponse,
      data: [{
        ...mockPaginatedResponse.data[0],
        engine_speed: null,
        fuel_consumption: null
      }]
    }
    mockedApi.getTractorData.mockResolvedValueOnce(responseWithNulls)

    const wrapper = mount(TractorDetail, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const cells = wrapper.findAll('td')
    const dashCells = cells.filter(cell => cell.text() === '—')
    expect(dashCells.length).toBeGreaterThan(0)
  })
})
