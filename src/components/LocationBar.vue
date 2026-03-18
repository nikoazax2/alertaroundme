<template>
  <div class="mb-6">
    <!-- GPS detected -->
    <div v-if="communeName && !gpsRefused" class="text-gray-600 dark:text-gray-400 text-sm">
      📍 {{ communeName }}
    </div>

    <!-- GPS refused / manual input -->
    <div v-if="gpsRefused || (!communeName && !loading)">
      <p v-if="error" class="text-red-500 text-sm mb-2">{{ error }}</p>
      <div class="relative">
        <input
          type="text"
          :value="query"
          @input="onInput"
          placeholder="Saisissez une ville..."
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <ul
          v-if="citySuggestions.length"
          class="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300
                 dark:border-gray-600 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto"
        >
          <li
            v-for="city in citySuggestions"
            :key="city.code"
            class="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700
                   text-gray-900 dark:text-gray-100 text-sm"
            @click="onSelect(city)"
          >
            {{ city.nom }} ({{ city.code }})
          </li>
        </ul>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-gray-500 text-sm">📡 Localisation en cours...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  communeName: String,
  loading: Boolean,
  error: String,
  gpsRefused: Boolean,
  citySuggestions: { type: Array, default: () => [] },
});

const emit = defineEmits(['search', 'select']);

const query = ref('');
let debounceTimer = null;

function onInput(e) {
  query.value = e.target.value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit('search', query.value);
  }, 300);
}

function onSelect(city) {
  query.value = city.nom;
  emit('select', city);
}
</script>
