<template>
  <div
    class="rounded-lg shadow-md p-4 border-l-4 bg-white dark:bg-gray-800"
    :class="borderClass"
  >
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xl">{{ source.icon }}</span>
      <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ source.label }}</h3>
    </div>

    <!-- Loading -->
    <div v-if="source.status === 'loading'" class="animate-pulse space-y-2">
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>

    <!-- Error -->
    <div v-else-if="source.status === 'error'" class="text-red-500 text-sm">
      <p>{{ source.error }}</p>
      <button
        class="mt-2 text-xs underline text-blue-500 hover:text-blue-700"
        @click="$emit('retry', source.id)"
      >
        Réessayer
      </button>
    </div>

    <!-- Result -->
    <div v-else-if="source.data" class="text-sm text-gray-700 dark:text-gray-300">
      <p>{{ source.data.summary }}</p>

      <!-- USGS details -->
      <ul v-if="source.id === 'usgs' && source.data.details" class="mt-2 space-y-1 text-xs">
        <li v-for="(q, i) in source.data.details" :key="i">
          M{{ q.magnitude }} — {{ q.place }} ({{ q.time }})
        </li>
      </ul>

      <!-- EONET details -->
      <ul v-if="source.id === 'eonet' && source.data.details" class="mt-2 space-y-1 text-xs">
        <li v-for="(e, i) in source.data.details" :key="i">
          {{ e.category }} — {{ e.title }} ({{ e.distance }} km)
        </li>
      </ul>

      <!-- WAQI color indicator -->
      <div
        v-if="source.id === 'waqi' && source.data.details"
        class="mt-2 flex items-center gap-2 text-xs"
      >
        <span
          class="inline-block w-3 h-3 rounded-full"
          :style="{ backgroundColor: source.data.details.color }"
        ></span>
        <span v-if="source.data.details.station">{{ source.data.details.station }}</span>
      </div>
    </div>

    <!-- Idle -->
    <div v-else class="text-sm text-gray-400">En attente...</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  source: { type: Object, required: true },
});

defineEmits(['retry']);

const borderClass = computed(() => {
  if (props.source.status === 'loading') return 'border-gray-300';
  if (props.source.status === 'error') return 'border-red-400';
  if (!props.source.data) return 'border-gray-300';
  const map = {
    none: 'border-green-400',
    info: 'border-blue-400',
    warning: 'border-orange-400',
    danger: 'border-red-500',
  };
  return map[props.source.data.severity] || 'border-gray-300';
});
</script>
