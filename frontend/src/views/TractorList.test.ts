import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import TractorList from './TractorList.vue'
import * as tractorsApi from '@/api/tractors'

vi.mock('@/api/tractors')
const mockedApi = vi.mocked(tractorsApi)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: TractorList },
    { path: '/tractors/:serialNumber', name: 'tractor-detail', component: { template: '<div/>' } }
  ]
})

describe('TractorList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays loading state initially', () => {
    mockedApi.getTractors.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(TractorList, {
      global: { plugins: [router] }
    })

    // Should show skeleton loaders during loading
    expect(wrapper.findComponent({ name: 'TractorCardSkeleton' }).exists()).toBe(true)
  })

  it('displays tractors after loading', async () => {
    mockedApi.getTractors.mockResolvedValueOnce([
      { serial_number: 'ABC123', total_working_hours_counter: 150.5 },
      { serial_number: 'DEF456', total_working_hours_counter: 200.0 }
    ])

    const wrapper = mount(TractorList, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('ABC123')
    expect(wrapper.text()).toContain('DEF456')
    expect(wrapper.text()).toContain('150.5')
    expect(wrapper.text()).toContain('200.0')
  })

  it('displays correct tractor count in stats', async () => {
    mockedApi.getTractors.mockResolvedValueOnce([
      { serial_number: 'ABC123', total_working_hours_counter: 150.5 },
      { serial_number: 'DEF456', total_working_hours_counter: 200.0 },
      { serial_number: 'GHI789', total_working_hours_counter: 300.0 }
    ])

    const wrapper = mount(TractorList, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('Active Tractors')
  })

  it('displays error message when API fails', async () => {
    mockedApi.getTractors.mockRejectedValueOnce(new Error('API Error'))

    const wrapper = mount(TractorList, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load tractors')
  })

  it('formats working hours correctly', async () => {
    mockedApi.getTractors.mockResolvedValueOnce([
      { serial_number: 'ABC123', total_working_hours_counter: 1234.567 }
    ])

    const wrapper = mount(TractorList, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('1,234.6')
  })

  it('handles null working hours', async () => {
    mockedApi.getTractors.mockResolvedValueOnce([
      { serial_number: 'ABC123', total_working_hours_counter: null as unknown as number }
    ])

    const wrapper = mount(TractorList, {
      global: { plugins: [router] }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('N/A')
  })

  it('creates links to tractor detail page', async () => {
    mockedApi.getTractors.mockResolvedValueOnce([
      { serial_number: 'ABC123', total_working_hours_counter: 100 }
    ])

    const wrapper = mount(TractorList, {
      global: { plugins: [router] }
    })

    await flushPromises()

    const link = wrapper.find('a[href="/tractors/ABC123"]')
    expect(link.exists()).toBe(true)
  })
})
