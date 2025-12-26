<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getSession, updateSession, type TractorSession } from '@/api/tractors'

const route = useRoute()
const router = useRouter()

const serialNumber = computed(() => route.params.serialNumber as string)
const sessionId = computed(() => parseInt(route.params.id as string))

const session = ref<TractorSession | null>(null)
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const formData = ref({
  gps_longitude: null as number | null,
  gps_latitude: null as number | null,
  total_working_hours_counter: null as number | null,
  engine_speed: null as number | null,
  engine_load: null as number | null,
  fuel_consumption: null as number | null,
  ground_speed_gearbox: null as number | null,
  ground_speed_radar: null as number | null,
  coolant_temperature: null as number | null,
  speed_front_pto: null as number | null,
  speed_rear_pto: null as number | null,
  current_gear_shift: null as number | null,
  ambient_temperature: null as number | null,
  parking_brake_status: null as number | null,
  transverse_differential_lock_status: null as number | null,
  all_wheel_drive_status: null as string | null,
  actual_status_of_creeper: null as string | null
})

const validationErrors = ref<Record<string, string>>({})

function validate(): boolean {
  validationErrors.value = {}

  if (formData.value.engine_load !== null && (formData.value.engine_load < 0 || formData.value.engine_load > 100)) {
    validationErrors.value.engine_load = 'Must be between 0 and 100'
  }

  if (formData.value.gps_longitude !== null && (formData.value.gps_longitude < -180 || formData.value.gps_longitude > 180)) {
    validationErrors.value.gps_longitude = 'Must be between -180 and 180'
  }

  if (formData.value.gps_latitude !== null && (formData.value.gps_latitude < -90 || formData.value.gps_latitude > 90)) {
    validationErrors.value.gps_latitude = 'Must be between -90 and 90'
  }

  if (formData.value.total_working_hours_counter !== null && formData.value.total_working_hours_counter < 0) {
    validationErrors.value.total_working_hours_counter = 'Cannot be negative'
  }

  if (formData.value.engine_speed !== null && formData.value.engine_speed < 0) {
    validationErrors.value.engine_speed = 'Cannot be negative'
  }

  if (formData.value.fuel_consumption !== null && formData.value.fuel_consumption < 0) {
    validationErrors.value.fuel_consumption = 'Cannot be negative'
  }

  return Object.keys(validationErrors.value).length === 0
}

async function fetchSession() {
  loading.value = true
  error.value = null
  try {
    session.value = await getSession(serialNumber.value, sessionId.value)
    formData.value = {
      gps_longitude: session.value.gps_longitude,
      gps_latitude: session.value.gps_latitude,
      total_working_hours_counter: session.value.total_working_hours_counter,
      engine_speed: session.value.engine_speed,
      engine_load: session.value.engine_load,
      fuel_consumption: session.value.fuel_consumption,
      ground_speed_gearbox: session.value.ground_speed_gearbox,
      ground_speed_radar: session.value.ground_speed_radar,
      coolant_temperature: session.value.coolant_temperature,
      speed_front_pto: session.value.speed_front_pto,
      speed_rear_pto: session.value.speed_rear_pto,
      current_gear_shift: session.value.current_gear_shift,
      ambient_temperature: session.value.ambient_temperature,
      parking_brake_status: session.value.parking_brake_status,
      transverse_differential_lock_status: session.value.transverse_differential_lock_status,
      all_wheel_drive_status: session.value.all_wheel_drive_status,
      actual_status_of_creeper: session.value.actual_status_of_creeper
    }
  } catch (e) {
    error.value = 'Failed to load session data'
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!validate()) return

  saving.value = true
  error.value = null
  success.value = false

  try {
    await updateSession(serialNumber.value, sessionId.value, formData.value)
    success.value = true
    setTimeout(() => {
      router.push({ name: 'tractor-detail', params: { serialNumber: serialNumber.value } })
    }, 1500)
  } catch (e) {
    error.value = 'Failed to save changes'
    console.error(e)
  } finally {
    saving.value = false
  }
}

const fieldGroups = [
  {
    title: 'Location',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    fields: [
      { key: 'gps_longitude', label: 'GPS Longitude', type: 'number', step: '0.000001', unit: '°' },
      { key: 'gps_latitude', label: 'GPS Latitude', type: 'number', step: '0.000001', unit: '°' }
    ]
  },
  {
    title: 'Engine',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    fields: [
      { key: 'engine_speed', label: 'Engine Speed', type: 'number', step: '1', unit: 'rpm' },
      { key: 'engine_load', label: 'Engine Load', type: 'number', step: '1', min: 0, max: 100, unit: '%' },
      { key: 'fuel_consumption', label: 'Fuel Consumption', type: 'number', step: '0.01', unit: 'l/h' },
      { key: 'coolant_temperature', label: 'Coolant Temperature', type: 'number', step: '1', unit: '°C' }
    ]
  },
  {
    title: 'Performance',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    fields: [
      { key: 'total_working_hours_counter', label: 'Total Working Hours', type: 'number', step: '0.01', unit: 'h' },
      { key: 'ground_speed_gearbox', label: 'Ground Speed (Gearbox)', type: 'number', step: '0.1', unit: 'km/h' },
      { key: 'ground_speed_radar', label: 'Ground Speed (Radar)', type: 'number', step: '0.1', unit: 'km/h' },
      { key: 'ambient_temperature', label: 'Ambient Temperature', type: 'number', step: '0.1', unit: '°C' }
    ]
  },
  {
    title: 'Power Take-Off',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    fields: [
      { key: 'speed_front_pto', label: 'Front PTO Speed', type: 'number', step: '1', unit: 'rpm' },
      { key: 'speed_rear_pto', label: 'Rear PTO Speed', type: 'number', step: '1', unit: 'rpm' },
      { key: 'current_gear_shift', label: 'Current Gear', type: 'number', step: '1', unit: '' }
    ]
  },
  {
    title: 'Status',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    fields: [
      { key: 'parking_brake_status', label: 'Parking Brake', type: 'number', step: '1', min: 0, max: 1, unit: '' },
      { key: 'transverse_differential_lock_status', label: 'Differential Lock', type: 'number', step: '1', min: 0, max: 1, unit: '' },
      { key: 'all_wheel_drive_status', label: 'All-Wheel Drive', type: 'text', unit: '' },
      { key: 'actual_status_of_creeper', label: 'Creeper Status', type: 'text', unit: '' }
    ]
  }
]

onMounted(fetchSession)
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-20">
      <div class="container-app py-4">
        <div class="flex items-center gap-4">
          <RouterLink
            :to="{ name: 'tractor-detail', params: { serialNumber } }"
            class="btn-ghost !p-2 rounded-lg"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </RouterLink>
          <div>
            <p class="text-overline mb-0.5">Edit Session</p>
            <h1 class="heading-2">{{ serialNumber }}</h1>
            <p v-if="session" class="text-caption mt-1">{{ session.date_time }}</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container-app py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24">
        <div class="loader mb-4"></div>
        <p class="text-caption">Loading session data...</p>
      </div>

      <!-- Error State (no session) -->
      <div v-else-if="error && !session" class="alert alert-error max-w-md mx-auto">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ error }}
        </div>
      </div>

      <!-- Form -->
      <form v-else-if="session" @submit.prevent="handleSubmit" class="max-w-5xl mx-auto">
        <!-- Success Message -->
        <div v-if="success" class="alert alert-success mb-6 fade-in">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Changes saved successfully! Redirecting...
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-error mb-6">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ error }}
          </div>
        </div>

        <!-- Field Groups -->
        <div class="space-y-8">
          <div
            v-for="group in fieldGroups"
            :key="group.title"
            class="card p-6 fade-in"
          >
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-lg bg-[var(--color-cream)] flex items-center justify-center">
                <svg class="w-5 h-5 text-[var(--color-forest-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="group.icon"/>
                </svg>
              </div>
              <h2 class="heading-3">{{ group.title }}</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="field in group.fields" :key="field.key">
                <label :for="field.key" class="block text-sm font-medium text-[var(--color-text)] mb-2">
                  {{ field.label }}
                  <span v-if="field.unit" class="text-[var(--color-text-subtle)] font-normal">({{ field.unit }})</span>
                </label>
                <div class="relative">
                  <input
                    v-if="field.type === 'number'"
                    :id="field.key"
                    v-model.number="(formData as Record<string, unknown>)[field.key]"
                    :type="field.type"
                    :step="field.step"
                    :min="field.min"
                    :max="field.max"
                    class="input tabular-nums"
                    :class="{ 'input-error': validationErrors[field.key] }"
                    placeholder="—"
                  />
                  <input
                    v-else
                    :id="field.key"
                    v-model="(formData as Record<string, unknown>)[field.key]"
                    :type="field.type"
                    class="input"
                    :class="{ 'input-error': validationErrors[field.key] }"
                    placeholder="—"
                  />
                </div>
                <p v-if="validationErrors[field.key]" class="mt-1.5 text-sm text-[var(--color-error)]">
                  {{ validationErrors[field.key] }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-[var(--color-border)]">
          <RouterLink
            :to="{ name: 'tractor-detail', params: { serialNumber } }"
            class="btn-secondary"
          >
            Cancel
          </RouterLink>
          <button
            type="submit"
            :disabled="saving"
            class="btn-primary"
          >
            <template v-if="saving">
              <div class="loader-sm"></div>
              Saving...
            </template>
            <template v-else>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Save Changes
            </template>
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
