import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import EditSession from './EditSession.vue'
import * as tractorsApi from '@/api/tractors'

vi.mock('@/api/tractors')
const mockedApi = vi.mocked(tractorsApi)

const mockSession: tractorsApi.TractorSession = {
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div/>' } },
    { path: '/tractors/:serialNumber', name: 'tractor-detail', component: { template: '<div/>' } },
    { path: '/tractors/:serialNumber/edit/:id', name: 'edit-session', component: EditSession }
  ]
})

describe('EditSession', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await router.push('/tractors/ABC123/edit/1')
    await router.isReady()
  })

  it('displays loading state initially', () => {
    mockedApi.getSession.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    expect(wrapper.text()).toContain('Loading session data')
  })

  it('displays session data in form after loading', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const engineSpeedInput = wrapper.find('#engine_speed')
    expect((engineSpeedInput.element as HTMLInputElement).value).toBe('1500')

    const engineLoadInput = wrapper.find('#engine_load')
    expect((engineLoadInput.element as HTMLInputElement).value).toBe('75')
  })

  it('displays error when session load fails', async () => {
    mockedApi.getSession.mockRejectedValueOnce(new Error('Not found'))

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load session data')
  })

  it('validates engine load must be between 0 and 100', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const engineLoadInput = wrapper.find('#engine_load')
    await engineLoadInput.setValue(150)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Must be between 0 and 100')
  })

  it('validates GPS longitude must be between -180 and 180', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const longitudeInput = wrapper.find('#gps_longitude')
    await longitudeInput.setValue(200)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Must be between -180 and 180')
  })

  it('validates GPS latitude must be between -90 and 90', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const latitudeInput = wrapper.find('#gps_latitude')
    await latitudeInput.setValue(-100)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Must be between -90 and 90')
  })

  it('validates total working hours cannot be negative', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const hoursInput = wrapper.find('#total_working_hours_counter')
    await hoursInput.setValue(-10)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.text()).toContain('Cannot be negative')
  })

  it('submits form with valid data', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)
    mockedApi.updateSession.mockResolvedValueOnce(mockSession)

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const engineSpeedInput = wrapper.find('#engine_speed')
    await engineSpeedInput.setValue(1600)
    await wrapper.find('form').trigger('submit')

    await flushPromises()

    expect(mockedApi.updateSession).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Changes saved successfully')
  })

  it('displays error when save fails', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)
    mockedApi.updateSession.mockRejectedValueOnce(new Error('Save failed'))

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to save changes')
  })

  it('displays all field groups', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Location')
    expect(wrapper.text()).toContain('Engine')
    expect(wrapper.text()).toContain('Performance')
    expect(wrapper.text()).toContain('Power Take-Off')
    expect(wrapper.text()).toContain('Status')
  })

  it('has cancel button that links back to tractor detail', async () => {
    mockedApi.getSession.mockResolvedValueOnce(mockSession)

    const wrapper = mount(EditSession, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const cancelLink = wrapper.find('a.btn-secondary')
    expect(cancelLink.exists()).toBe(true)
    expect(cancelLink.text()).toContain('Cancel')
  })
})
