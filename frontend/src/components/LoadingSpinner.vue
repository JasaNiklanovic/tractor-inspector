<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-24">
    <div class="loader mb-4"></div>
    <p class="text-caption">{{ message || 'Loading...' }}</p>
  </div>
</template>
