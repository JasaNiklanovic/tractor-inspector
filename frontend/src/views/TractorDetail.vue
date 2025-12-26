<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getTractorData, type PaginatedResponse } from '@/api/tractors'

const route = useRoute()
const router = useRouter()

const serialNumber = computed(() => route.params.serialNumber as string)
const data = ref<PaginatedResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Pagination state from URL
const page = computed({
  get: () => parseInt(route.query.page as string) || 1,
  set: (val: number) => updateQuery({ page: val.toString() })
})
const pageSize = computed({
  get: () => parseInt(route.query.pageSize as string) || 25,
  set: (val: number) => updateQuery({ pageSize: val.toString(), page: '1' })
})
const sortBy = computed({
  get: () => (route.query.sortBy as string) || 'date_time',
  set: (val: string) => updateQuery({ sortBy: val, page: '1' })
})
const sortOrder = computed({
  get: () => (route.query.sortOrder as string) || 'asc',
  set: (val: string) => updateQuery({ sortOrder: val, page: '1' })
})

function updateQuery(newParams: Record<string, string>) {
  router.push({
    query: { ...route.query, ...newParams }
  })
}

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    data.value = await getTractorData(
      serialNumber.value,
      page.value,
      pageSize.value,
      sortBy.value,
      sortOrder.value as 'asc' | 'desc'
    )
  } catch (e) {
    error.value = 'Failed to load tractor data'
    console.error(e)
  } finally {
    loading.value = false
  }
}

function toggleSort(column: string) {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
}

function getSortIcon(column: string): string {
  if (sortBy.value !== column) return ''
  return sortOrder.value === 'asc' ? '↑' : '↓'
}

const columns = [
  { key: 'date_time', label: 'Date / Time' },
  { key: 'total_working_hours_counter', label: 'Working Hours' },
  { key: 'engine_speed', label: 'Engine (rpm)' },
  { key: 'engine_load', label: 'Load (%)' },
  { key: 'fuel_consumption', label: 'Fuel (l/h)' },
  { key: 'ground_speed_gearbox', label: 'Speed (km/h)' },
  { key: 'coolant_temperature', label: 'Coolant (°C)' },
  { key: 'ambient_temperature', label: 'Ambient (°C)' }
]

const pageSizeOptions = [10, 25, 50, 100]

// Computed for visible page numbers
const visiblePages = computed(() => {
  if (!data.value) return []
  const total = data.value.totalPages
  const current = page.value
  const pages: (number | string)[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

onMounted(fetchData)
watch([() => route.query], fetchData)
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border)] sticky top-0 z-20">
      <div class="container-app py-4">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex items-center gap-4">
            <RouterLink
              to="/"
              class="btn-ghost !p-2 rounded-lg"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </RouterLink>
            <div>
              <p class="text-overline mb-0.5">Tractor Telemetry</p>
              <h1 class="heading-2">{{ serialNumber }}</h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <RouterLink
              :to="{ name: 'tractor-map', params: { serialNumber } }"
              class="btn-accent"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              View Movement Map
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container-app py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-24">
        <div class="loader mb-4"></div>
        <p class="text-caption">Loading telemetry data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-error max-w-md mx-auto">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ error }}
        </div>
      </div>

      <template v-else-if="data">
        <!-- Controls Bar -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div class="text-caption">
            Showing
            <span class="font-medium text-[var(--color-text)]">{{ ((page - 1) * pageSize) + 1 }}</span>
            –
            <span class="font-medium text-[var(--color-text)]">{{ Math.min(page * pageSize, data.total) }}</span>
            of
            <span class="font-medium text-[var(--color-text)]">{{ data.total.toLocaleString() }}</span>
            records
          </div>

          <div class="flex items-center gap-3">
            <label class="text-caption">Rows per page:</label>
            <select
              :value="pageSize"
              @change="pageSize = parseInt(($event.target as HTMLSelectElement).value)"
              class="select !w-auto !py-2 !pl-3 !pr-10"
            >
              <option v-for="size in pageSizeOptions" :key="size" :value="size">
                {{ size }}
              </option>
            </select>
          </div>
        </div>

        <!-- Data Table -->
        <div class="card overflow-hidden mb-6">
          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th
                    v-for="col in columns"
                    :key="col.key"
                    @click="toggleSort(col.key)"
                    :class="{ sorted: sortBy === col.key }"
                  >
                    <div class="flex items-center gap-2">
                      {{ col.label }}
                      <span v-if="sortBy === col.key" class="text-[var(--color-amber)]">
                        {{ getSortIcon(col.key) }}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in data.data" :key="row.id" class="fade-in">
                  <td>
                    <RouterLink
                      :to="{ name: 'edit-session', params: { serialNumber, id: row.id } }"
                      class="text-[var(--color-forest-muted)] hover:text-[var(--color-forest)] font-medium underline-offset-2 hover:underline transition-colors"
                    >
                      {{ row.date_time }}
                    </RouterLink>
                  </td>
                  <td class="numeric tabular-nums">{{ row.total_working_hours_counter?.toFixed(2) ?? '—' }}</td>
                  <td class="numeric tabular-nums">{{ row.engine_speed ?? '—' }}</td>
                  <td class="numeric tabular-nums">
                    <span
                      v-if="row.engine_load !== null"
                      :class="{
                        'text-[var(--color-success)]': row.engine_load < 50,
                        'text-[var(--color-amber-dark)]': row.engine_load >= 50 && row.engine_load < 80,
                        'text-[var(--color-error)]': row.engine_load >= 80
                      }"
                    >
                      {{ row.engine_load }}%
                    </span>
                    <span v-else>—</span>
                  </td>
                  <td class="numeric tabular-nums">{{ row.fuel_consumption?.toFixed(2) ?? '—' }}</td>
                  <td class="numeric tabular-nums">{{ row.ground_speed_gearbox?.toFixed(1) ?? '—' }}</td>
                  <td class="numeric tabular-nums">{{ row.coolant_temperature ?? '—' }}</td>
                  <td class="numeric tabular-nums">{{ row.ambient_temperature?.toFixed(1) ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="pagination">
            <button
              @click="page = 1"
              :disabled="page === 1"
              class="pagination-btn"
              title="First page"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              </svg>
            </button>
            <button
              @click="page = page - 1"
              :disabled="page === 1"
              class="pagination-btn"
              title="Previous page"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>

          <div class="pagination">
            <template v-for="p in visiblePages" :key="p">
              <span v-if="p === '...'" class="px-2 text-[var(--color-text-subtle)]">...</span>
              <button
                v-else
                @click="page = p as number"
                :class="['pagination-btn', { active: p === page }]"
              >
                {{ p }}
              </button>
            </template>
          </div>

          <div class="pagination">
            <button
              @click="page = page + 1"
              :disabled="page >= data.totalPages"
              class="pagination-btn"
              title="Next page"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <button
              @click="page = data.totalPages"
              :disabled="page >= data.totalPages"
              class="pagination-btn"
              title="Last page"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
