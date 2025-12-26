<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getGPSData, type GPSData } from '@/api/tractors'
import L from 'leaflet'

const route = useRoute()
const serialNumber = computed(() => route.params.serialNumber as string)

const gpsData = ref<GPSData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const mapContainer = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let tractorMarker: L.Marker | null = null
let pathLine: L.Polyline | null = null

// Timeline state
const currentIndex = ref(0)
const isPlaying = ref(false)
const playbackSpeed = ref(1) // 1 = normal, 2 = fast, 0.5 = slow
let playInterval: number | null = null

const speedOptions = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
  { label: '4x', value: 4 }
]

const currentPosition = computed(() => {
  if (gpsData.value.length === 0) return null
  return gpsData.value[currentIndex.value]
})

// Format speed with fixed width (e.g., "  8.5" or "123.4")
const formattedSpeed = computed(() => {
  const speed = currentPosition.value?.ground_speed_gearbox
  if (speed === null || speed === undefined) return '——.—'
  return speed.toFixed(1).padStart(5, '\u2007')
})

// Format engine speed with fixed width (e.g., "  540" or "1850")
const formattedEngineSpeed = computed(() => {
  const rpm = currentPosition.value?.engine_speed
  if (rpm === null || rpm === undefined) return '————'
  return rpm.toString().padStart(4, '\u2007')
})

// Format position counter with fixed width
const formattedPosition = computed(() => {
  const total = gpsData.value.length
  const current = currentIndex.value + 1
  const totalDigits = total.toString().length
  return `${current.toString().padStart(totalDigits, '\u2007')} / ${total}`
})

const progressPercent = computed(() => {
  if (gpsData.value.length <= 1) return 0
  return (currentIndex.value / (gpsData.value.length - 1)) * 100
})

// Create tractor icon
const tractorIcon = L.divIcon({
  html: `<div class="tractor-marker">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="#0f2419">
      <circle cx="12" cy="12" r="11" fill="#c9a227"/>
      <path d="M19 17h1c.55 0 1-.45 1-1v-2c0-1.1-.9-2-2-2h-1l-1.18-3.18A2.01 2.01 0 0 0 15 7h-2V6c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h1c0 1.66 1.34 3 3 3s3-1.34 3-3h3c0 1.66 1.34 3 3 3s3-1.34 3-3c0-.35-.06-.68-.17-1H19zM10 17c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm9 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" transform="scale(0.65) translate(5.5, 5.5)" fill="#0f2419"/>
    </svg>
  </div>`,
  className: 'tractor-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
})

// Calculate distance between two GPS points in meters (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const data = await getGPSData(serialNumber.value)
    // Filter valid GPS coordinates and sort by date_time
    const filtered = data
      .filter(d =>
        d.gps_latitude && d.gps_longitude &&
        d.gps_latitude !== 0 && d.gps_longitude !== 0 &&
        Math.abs(d.gps_latitude) <= 90 && Math.abs(d.gps_longitude) <= 180
      )
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())

    // Remove GPS outliers - points that jump more than 500m from previous point
    // (tractor can't realistically move that fast between readings)
    const smoothed: typeof filtered = []
    for (const point of filtered) {
      if (smoothed.length === 0) {
        smoothed.push(point)
      } else {
        const prev = smoothed[smoothed.length - 1]
        const distance = getDistance(
          prev.gps_latitude, prev.gps_longitude,
          point.gps_latitude, point.gps_longitude
        )
        // Only include if within 500m of previous point (reasonable for tractor movement)
        if (distance < 500) {
          smoothed.push(point)
        }
      }
    }

    gpsData.value = smoothed
  } catch (e) {
    error.value = 'Failed to load GPS data'
    console.error(e)
  } finally {
    loading.value = false
  }
}

function initMap() {
  if (!mapContainer.value || gpsData.value.length === 0) return

  map = L.map(mapContainer.value, {
    zoomControl: false
  }).setView([0, 0], 15)

  // Add zoom control to bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map)

  // Use CartoDB Positron for a cleaner look
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map)

  const pathCoords: L.LatLngExpression[] = gpsData.value.map(d => [d.gps_latitude, d.gps_longitude])

  // Draw path with gradient effect
  pathLine = L.polyline(pathCoords, {
    color: '#2d5a42',
    weight: 4,
    opacity: 0.8,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map)

  map.fitBounds(pathLine.getBounds(), { padding: [60, 60] })

  const firstPos = gpsData.value[0]
  tractorMarker = L.marker([firstPos.gps_latitude, firstPos.gps_longitude], {
    icon: tractorIcon
  }).addTo(map)

  updateMarkerPopup()
}

function updateMarkerPosition() {
  if (!tractorMarker || !currentPosition.value) return

  tractorMarker.setLatLng([
    currentPosition.value.gps_latitude,
    currentPosition.value.gps_longitude
  ])
  updateMarkerPopup()
}

function updateMarkerPopup() {
  if (!tractorMarker || !currentPosition.value) return

  tractorMarker.bindPopup(`
    <div style="font-family: 'DM Sans', sans-serif; padding: 4px 0;">
      <p style="font-weight: 600; color: #0f2419; margin-bottom: 8px;">${currentPosition.value.date_time}</p>
      <div style="display: grid; gap: 4px; font-size: 13px; color: #5c5c5c;">
        <p><strong>Speed:</strong> ${currentPosition.value.ground_speed_gearbox?.toFixed(1) ?? 'N/A'} km/h</p>
        <p><strong>Engine:</strong> ${currentPosition.value.engine_speed ?? 'N/A'} rpm</p>
      </div>
    </div>
  `)
}

function handleTimelineChange(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value)
  currentIndex.value = value
  updateMarkerPosition()
}

function play() {
  if (gpsData.value.length === 0) return

  isPlaying.value = true
  // Base interval of 150ms, adjusted by playback speed
  // At 1x with 72k points, full playback takes ~3 hours of data in ~18 minutes
  const interval = Math.round(150 / playbackSpeed.value)
  playInterval = window.setInterval(() => {
    if (currentIndex.value >= gpsData.value.length - 1) {
      pause()
      currentIndex.value = 0
    } else {
      currentIndex.value++
      updateMarkerPosition()
    }
  }, interval)
}

function setSpeed(speed: number) {
  playbackSpeed.value = speed
  if (isPlaying.value) {
    pause()
    play()
  }
}

function pause() {
  isPlaying.value = false
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

function reset() {
  pause()
  currentIndex.value = 0
  updateMarkerPosition()
}

function skipBack() {
  const newIndex = Math.max(0, currentIndex.value - Math.floor(gpsData.value.length * 0.1))
  currentIndex.value = newIndex
  updateMarkerPosition()
}

function skipForward() {
  const newIndex = Math.min(gpsData.value.length - 1, currentIndex.value + Math.floor(gpsData.value.length * 0.1))
  currentIndex.value = newIndex
  updateMarkerPosition()
}

onMounted(async () => {
  await fetchData()
  if (gpsData.value.length > 0) {
    setTimeout(initMap, 100)
  }
})

onUnmounted(() => {
  pause()
  if (map) {
    map.remove()
  }
})

watch(currentIndex, updateMarkerPosition)
</script>

<template>
  <div class="h-screen flex flex-col bg-[var(--color-cream)]">
    <!-- Header -->
    <header class="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] z-20">
      <div class="container-app py-4">
        <div class="flex items-center justify-between">
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
              <p class="text-overline mb-0.5">Movement Map</p>
              <h1 class="heading-2">{{ serialNumber }}</h1>
            </div>
          </div>

          <div v-if="gpsData.length > 0" class="badge badge-amber">
            {{ gpsData.length.toLocaleString() }} GPS points
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="loader mb-4"></div>
        <p class="text-caption">Loading GPS data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center p-6">
      <div class="alert alert-error max-w-md">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ error }}
        </div>
      </div>
    </div>

    <!-- No Data State -->
    <div v-else-if="gpsData.length === 0" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-[var(--color-cream)] flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-[var(--color-text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
        </div>
        <p class="text-[var(--color-text-muted)]">No GPS data available for this tractor.</p>
      </div>
    </div>

    <!-- Map & Controls -->
    <template v-else>
      <!-- Map Container -->
      <div ref="mapContainer" class="flex-1 z-0"></div>

      <!-- Timeline Controls -->
      <div class="bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)] shadow-lg">
        <div class="container-app py-5">
          <!-- Current Position Info -->
          <div v-if="currentPosition" class="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
            <div class="flex items-center gap-2 min-w-[200px]">
              <div class="w-8 h-8 rounded-lg bg-[var(--color-cream)] flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-[var(--color-forest-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-[var(--color-text-subtle)]">Time</p>
                <p class="text-sm font-medium text-[var(--color-text)] tabular-nums font-mono whitespace-nowrap">{{ currentPosition.date_time }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 min-w-[120px]">
              <div class="w-8 h-8 rounded-lg bg-[var(--color-cream)] flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-[var(--color-forest-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-[var(--color-text-subtle)]">Speed</p>
                <p class="text-sm font-medium text-[var(--color-text)] tabular-nums font-mono whitespace-nowrap">
                  {{ formattedSpeed }} km/h
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 min-w-[110px]">
              <div class="w-8 h-8 rounded-lg bg-[var(--color-cream)] flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-[var(--color-forest-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-[var(--color-text-subtle)]">Engine</p>
                <p class="text-sm font-medium text-[var(--color-text)] tabular-nums font-mono whitespace-nowrap">
                  {{ formattedEngineSpeed }} rpm
                </p>
              </div>
            </div>

            <div class="ml-auto text-right hidden sm:block min-w-[120px]">
              <p class="text-xs text-[var(--color-text-subtle)]">Position</p>
              <p class="text-sm font-medium text-[var(--color-text)] tabular-nums font-mono whitespace-nowrap">
                {{ formattedPosition }}
              </p>
            </div>
          </div>

          <!-- Timeline Slider -->
          <div class="flex items-center gap-4">
            <!-- Control Buttons -->
            <div class="flex items-center gap-1">
              <button
                @click="reset"
                class="btn-ghost !p-2 rounded-lg"
                title="Reset to start"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>

              <button
                @click="skipBack"
                class="btn-ghost !p-2 rounded-lg"
                title="Skip back 10%"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"/>
                </svg>
              </button>

              <button
                @click="isPlaying ? pause() : play()"
                class="w-12 h-12 rounded-full bg-[var(--color-forest)] text-white flex items-center justify-center hover:bg-[var(--color-forest-light)] transition-colors shadow-md"
              >
                <svg v-if="!isPlaying" class="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <svg v-else class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </button>

              <button
                @click="skipForward"
                class="btn-ghost !p-2 rounded-lg"
                title="Skip forward 10%"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"/>
                </svg>
              </button>

              <!-- Speed Control -->
              <div class="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-[var(--color-border)]">
                <button
                  v-for="opt in speedOptions"
                  :key="opt.value"
                  @click="setSpeed(opt.value)"
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded transition-colors',
                    playbackSpeed === opt.value
                      ? 'bg-[var(--color-forest)] text-white'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-cream)]'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Progress Slider -->
            <div class="flex-1 relative">
              <div class="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div
                  class="h-full bg-[var(--color-forest)] transition-all duration-75"
                  :style="{ width: `${progressPercent}%` }"
                ></div>
              </div>
              <input
                type="range"
                :min="0"
                :max="gpsData.length - 1"
                :value="currentIndex"
                @input="handleTimelineChange"
                class="timeline-slider absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
