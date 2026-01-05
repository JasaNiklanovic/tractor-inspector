<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { getGPSData, type GPSData } from '@/api/tractors'
import L from 'leaflet'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorAlert from '@/components/ErrorAlert.vue'
import Icon from '@/components/Icon.vue'

const route = useRoute()
const serialNumber = computed(() => route.params.serialNumber as string)

const gpsData = ref<GPSData[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const mapContainer = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let tractorMarker: L.Marker | null = null
let pathLines: L.Polyline[] = []
const showLegend = ref(true)

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

// Get color based on speed (km/h)
function getSpeedColor(speed: number | null | undefined): string {
  if (speed === null || speed === undefined) return '#9ca3af' // gray for unknown
  if (speed < 5) return '#10b981' // green for slow/stationary
  if (speed < 15) return '#f59e0b' // amber for medium
  return '#ef4444' // red for fast
}

// Speed legend data
const speedLegend = [
  { color: '#10b981', label: '< 5 km/h', description: 'Stationary/Slow' },
  { color: '#f59e0b', label: '5-15 km/h', description: 'Medium' },
  { color: '#ef4444', label: '> 15 km/h', description: 'Fast' },
  { color: '#9ca3af', label: 'Unknown', description: 'No speed data' }
]

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

  // Create color-coded path segments based on speed
  const allCoords: L.LatLngExpression[] = []
  for (let i = 0; i < gpsData.value.length - 1; i++) {
    const current = gpsData.value[i]
    const next = gpsData.value[i + 1]

    const segmentCoords: L.LatLngExpression[] = [
      [current.gps_latitude, current.gps_longitude],
      [next.gps_latitude, next.gps_longitude]
    ]

    allCoords.push([current.gps_latitude, current.gps_longitude])

    // Use average speed of the two points for segment color
    const avgSpeed = ((current.ground_speed_gearbox || 0) + (next.ground_speed_gearbox || 0)) / 2
    const color = getSpeedColor(avgSpeed)

    const segment = L.polyline(segmentCoords, {
      color: color,
      weight: 4,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map)

    pathLines.push(segment)
  }

  // Add last point to coords for bounds calculation
  if (gpsData.value.length > 0) {
    const last = gpsData.value[gpsData.value.length - 1]
    allCoords.push([last.gps_latitude, last.gps_longitude])
  }

  // Fit map to show all coordinates
  if (allCoords.length > 0) {
    const bounds = L.latLngBounds(allCoords)
    map.fitBounds(bounds, { padding: [60, 60] })
  }

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
              <Icon name="arrow-left" />
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
      <LoadingSpinner message="Loading GPS data..." />
    </div>

    <!-- Error State with Retry -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center p-6">
      <ErrorAlert
        :message="error"
        :show-retry="true"
        @retry="fetchData"
      />
    </div>

    <!-- No Data State -->
    <div v-else-if="gpsData.length === 0" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-[var(--color-cream)] flex items-center justify-center mx-auto mb-4">
          <Icon name="map" size="xl" class="text-[var(--color-text-subtle)]" />
        </div>
        <p class="text-[var(--color-text-muted)]">No GPS data available for this tractor.</p>
      </div>
    </div>

    <!-- Map & Controls -->
    <template v-else>
      <!-- Map Container -->
      <div class="flex-1 relative">
        <div ref="mapContainer" class="absolute inset-0 z-0"></div>

        <!-- Speed Legend -->
        <div v-if="showLegend" class="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-[200px]">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-[var(--color-forest)]">Speed Legend</h3>
            <button
              @click="showLegend = false"
              class="text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"
              title="Hide legend"
            >
              <Icon name="x" size="sm" />
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="item in speedLegend"
              :key="item.label"
              class="flex items-center gap-2"
            >
              <div
                class="w-8 h-1 rounded-full"
                :style="{ backgroundColor: item.color }"
              ></div>
              <div class="flex-1">
                <p class="text-xs font-medium text-[var(--color-text)]">{{ item.label }}</p>
                <p class="text-[10px] text-[var(--color-text-subtle)]">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Toggle Legend Button (when hidden) -->
        <button
          v-else
          @click="showLegend = true"
          class="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-sm font-medium text-[var(--color-forest)] hover:bg-white transition-colors"
          title="Show legend"
        >
          <Icon name="info-circle" />
        </button>
      </div>

      <!-- Timeline Controls -->
      <div class="bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)] shadow-lg">
        <div class="container-app py-5">
          <!-- Current Position Info -->
          <div v-if="currentPosition" class="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
            <div class="flex items-center gap-2 min-w-[200px]">
              <div class="w-8 h-8 rounded-lg bg-[var(--color-cream)] flex items-center justify-center flex-shrink-0">
                <Icon name="clock" size="sm" class="text-[var(--color-forest-muted)]" />
              </div>
              <div>
                <p class="text-xs text-[var(--color-text-subtle)]">Time</p>
                <p class="text-sm font-medium text-[var(--color-text)] tabular-nums font-mono whitespace-nowrap">{{ currentPosition.date_time }}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 min-w-[120px]">
              <div class="w-8 h-8 rounded-lg bg-[var(--color-cream)] flex items-center justify-center flex-shrink-0">
                <Icon name="lightning" size="sm" class="text-[var(--color-forest-muted)]" />
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
                <Icon name="cog" size="sm" class="text-[var(--color-forest-muted)]" />
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
                <Icon name="refresh" />
              </button>

              <button
                @click="skipBack"
                class="btn-ghost !p-2 rounded-lg"
                title="Skip back 10%"
              >
                <Icon name="skip-back" />
              </button>

              <button
                @click="isPlaying ? pause() : play()"
                class="w-12 h-12 rounded-full bg-[var(--color-forest)] text-white flex items-center justify-center hover:bg-[var(--color-forest-light)] transition-colors shadow-md"
              >
                <Icon v-if="!isPlaying" name="play" size="lg" filled class="ml-0.5" />
                <Icon v-else name="pause" size="lg" filled />
              </button>

              <button
                @click="skipForward"
                class="btn-ghost !p-2 rounded-lg"
                title="Skip forward 10%"
              >
                <Icon name="skip-forward" />
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
