<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getTractors, type Tractor } from '@/api/tractors'
import ErrorAlert from '@/components/ErrorAlert.vue'
import TractorCardSkeleton from '@/components/TractorCardSkeleton.vue'
import Icon from '@/components/Icon.vue'

const tractors = ref<Tractor[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchTractors() {
  loading.value = true
  error.value = null
  try {
    tractors.value = await getTractors()
  } catch (e) {
    error.value = 'Failed to load tractors'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchTractors)

function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return 'N/A'
  return hours.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function getTractorImage(index: number): string {
  const imageNumber = (index % 3) + 1
  return `/images/tractor${imageNumber}.jpg`
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Header -->
    <header class="relative overflow-hidden bg-[#0a1f14]">
      <!-- Gradient Mesh Background -->
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-gradient-to-br from-[#0f2419] via-[#1a3c2a] to-[#0a1f14]"></div>
        <!-- Animated gradient orbs -->
        <div class="absolute top-0 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#c9a227]/20 to-transparent blur-3xl"></div>
        <div class="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#2d5a42]/30 to-transparent blur-3xl"></div>
      </div>

      <!-- Subtle grain texture -->
      <div class="absolute inset-0 opacity-[0.15]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E');"></div>

      <div class="container-app relative py-16 md:py-20 lg:py-24">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div class="max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-amber)]/10 border border-[var(--color-amber)]/20 mb-6">
              <span class="w-2 h-2 rounded-full bg-[var(--color-amber)] animate-pulse"></span>
              <span class="text-xs font-semibold tracking-wide text-[var(--color-amber)] uppercase">Fleet Management</span>
            </div>
            <h1 class="font-[var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white mb-5">
              Tractor Inspector
            </h1>
            <p class="text-lg md:text-xl text-white/70 leading-relaxed max-w-xl">
              Monitor your fleet's telemetry data, track working hours, and analyze movement patterns across your agricultural operations.
            </p>
          </div>

          <!-- Stats Cards -->
          <div class="flex gap-4 lg:gap-6">
            <div class="px-6 py-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <p class="text-3xl md:text-4xl font-semibold text-white tabular-nums">{{ tractors.length }}</p>
              <p class="text-sm text-white/50 mt-1">Active Tractors</p>
            </div>
            <div class="px-6 py-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <p class="text-3xl md:text-4xl font-semibold text-[var(--color-amber)] tabular-nums">24/7</p>
              <p class="text-sm text-white/50 mt-1">Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom fade -->
      <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </header>

    <!-- Main Content -->
    <main class="container-app py-12 md:py-16">
      <!-- Section Header -->
      <div class="flex items-center justify-between mb-8">
        <h2 class="heading-2">Your Fleet</h2>
        <div class="badge badge-success">
          <span class="w-2 h-2 bg-current rounded-full mr-2 pulse-subtle"></span>
          All Systems Active
        </div>
      </div>

      <!-- Loading State with Skeletons -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <TractorCardSkeleton v-for="i in 3" :key="i" />
      </div>

      <!-- Error State with Retry -->
      <ErrorAlert
        v-else-if="error"
        :message="error"
        :show-retry="true"
        @retry="fetchTractors"
      />

      <!-- Tractor Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        <RouterLink
          v-for="(tractor, index) in tractors"
          :key="tractor.serial_number"
          :to="{ name: 'tractor-detail', params: { serialNumber: tractor.serial_number } }"
          class="card-interactive group stagger-item"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <!-- Card Image Area -->
          <div class="relative h-52 overflow-hidden">
            <!-- Tractor Photo -->
            <img
              :src="getTractorImage(index)"
              :alt="`Tractor ${tractor.serial_number}`"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />

            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

            <!-- Status Badge -->
            <div class="absolute top-4 right-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-[var(--color-forest)] backdrop-blur-sm shadow-md">
                <span class="w-1.5 h-1.5 bg-[var(--color-success)] rounded-full animate-pulse"></span>
                Active
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <p class="text-overline mb-1">Serial Number</p>
                <h3 class="heading-3 group-hover:text-[var(--color-forest-muted)] transition-colors">
                  {{ tractor.serial_number }}
                </h3>
              </div>
              <div class="w-10 h-10 rounded-full bg-[var(--color-cream)] flex items-center justify-center group-hover:bg-[var(--color-amber)] group-hover:text-[var(--color-forest)] transition-all">
                <Icon name="arrow-right" class="transform group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div class="divider mb-4"></div>

            <!-- Metrics -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-[var(--color-cream)] flex items-center justify-center">
                <Icon name="clock" class="text-[var(--color-forest-muted)]" />
              </div>
              <div>
                <p class="text-xs text-[var(--color-text-subtle)] mb-0.5">Total Working Hours</p>
                <p class="text-lg font-semibold text-[var(--color-forest)] tabular-nums">
                  {{ formatHours(tractor.total_working_hours_counter) }}
                  <span class="text-sm font-normal text-[var(--color-text-muted)]">hrs</span>
                </p>
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </main>

    <!-- Footer -->
    <footer class="container-app py-8 border-t border-[var(--color-border)]">
      <p class="text-center text-caption">
        Tractor Inspector &mdash; Agricultural Fleet Management System
      </p>
    </footer>
  </div>
</template>
