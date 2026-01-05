<script setup lang="ts">
defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  filled?: boolean
}>()

const icons: Record<string, string> = {
  // Navigation
  'arrow-left': 'M15 19l-7-7 7-7',
  'arrow-right': 'M9 5l7 7-7 7',
  'chevron-double-left': 'M11 19l-7-7 7-7m8 14l-7-7 7-7',
  'chevron-double-right': 'M13 5l7 7-7 7M5 5l7 7-7 7',
  'x': 'M6 18L18 6M6 6l12 12',

  // Status
  'check-circle': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  'exclamation-circle': 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'info-circle': 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'check': 'M5 13l4 4L19 7',

  // Actions
  'refresh': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',

  // Media controls
  'play': 'M8 5v14l11-7z',
  'pause': 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  'skip-back': 'M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z',
  'skip-forward': 'M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z',

  // Time & metrics
  'clock': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'lightning': 'M13 10V3L4 14h7v7l9-11h-7z',
  'chart': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',

  // Location
  'location': 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  'map': 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',

  // Settings
  'cog': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
}

const sizeClasses: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
}
</script>

<template>
  <svg
    :class="sizeClasses[size || 'md']"
    :fill="filled ? 'currentColor' : 'none'"
    :stroke="filled ? 'none' : 'currentColor'"
    viewBox="0 0 24 24"
  >
    <path
      v-if="!filled"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      :d="icons[name]"
    />
    <path
      v-else
      :d="icons[name]"
    />
  </svg>
</template>
