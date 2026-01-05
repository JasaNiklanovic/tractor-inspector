<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { getTractorData, type PaginatedResponse } from '@/api/tractors'
import ErrorAlert from '@/components/ErrorAlert.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import Icon from '@/components/Icon.vue'

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
              <Icon name="arrow-left" />
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
              <Icon name="map" size="sm" />
              View Movement Map
            </RouterLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container-app py-8">
      <!-- Loading State with Skeleton -->
      <div v-if="loading">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div class="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div class="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <TableSkeleton :rows="10" :columns="8" />
      </div>

      <!-- Error State with Retry -->
      <ErrorAlert
        v-else-if="error"
        :message="error"
        :show-retry="true"
        @retry="fetchData"
      />

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
              <Icon name="chevron-double-left" size="sm" />
            </button>
            <button
              @click="page = page - 1"
              :disabled="page === 1"
              class="pagination-btn"
              title="Previous page"
            >
              <Icon name="arrow-left" size="sm" />
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
              <Icon name="arrow-right" size="sm" />
            </button>
            <button
              @click="page = data.totalPages"
              :disabled="page >= data.totalPages"
              class="pagination-btn"
              title="Last page"
            >
              <Icon name="chevron-double-right" size="sm" />
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
