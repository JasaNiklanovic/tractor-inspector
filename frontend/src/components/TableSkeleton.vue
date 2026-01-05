<script setup lang="ts">
defineProps<{
  rows?: number
  columns?: number
}>()
</script>

<template>
  <div class="card overflow-hidden animate-pulse">
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in (columns || 8)" :key="col">
              <div class="h-4 bg-gray-300 rounded w-24"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in (rows || 5)" :key="row">
            <td v-for="col in (columns || 8)" :key="col">
              <div class="h-4 bg-gray-200 rounded" :class="col === 1 ? 'w-32' : 'w-16'"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
