<script setup lang="ts">
import Icon from './Icon.vue'

defineProps<{
  message: string
  showRetry?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="alert alert-error max-w-md mx-auto">
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <Icon name="exclamation-circle" class="flex-shrink-0" />
        <span>{{ message }}</span>
      </div>
      <button
        v-if="showRetry"
        @click="emit('retry')"
        class="btn-secondary self-start"
      >
        <Icon name="refresh" size="sm" />
        Try Again
      </button>
    </div>
  </div>
</template>
