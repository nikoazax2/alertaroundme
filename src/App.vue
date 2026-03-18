<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <header class="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 mb-6">
      <h1 class="text-2xl font-bold text-center">🌍 Alerte près de moi</h1>
    </header>

    <main class="max-w-4xl mx-auto px-4 pb-8">
      <LocationBar
        :communeName="geo.communeName.value"
        :loading="geo.loading.value"
        :error="geo.error.value"
        :gpsRefused="geo.gpsRefused.value"
        :citySuggestions="geo.citySuggestions.value"
        @search="geo.searchCity"
        @select="onCitySelect"
      />

      <button
        @click="refresh"
        :disabled="alerts.isAnyLoading.value"
        class="mb-6 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
               text-white font-medium py-2 px-6 rounded-lg transition-colors"
      >
        🔄 {{ alerts.isAnyLoading.value ? 'Chargement...' : 'Rechercher' }}
      </button>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AlertCard
          v-for="source in alerts.sources.value"
          :key="source.id"
          :source="source"
          @retry="onRetry"
        />
      </div>

      <NotifyForm
        :latitude="geo.latitude.value"
        :longitude="geo.longitude.value"
        :communeName="geo.communeName.value"
      />
    </main>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import LocationBar from './components/LocationBar.vue';
import AlertCard from './components/AlertCard.vue';
import NotifyForm from './components/NotifyForm.vue';
import { useGeolocation } from './composables/useGeolocation.js';
import { useAlerts } from './composables/useAlerts.js';

const geo = useGeolocation();
const alerts = useAlerts();

geo.requestGps();

watch(
  [geo.latitude, geo.longitude],
  ([lat, lon]) => {
    if (lat != null && lon != null) {
      alerts.fetchAll(lat, lon);
    }
  }
);

function onCitySelect(city) {
  geo.selectCity(city);
}

function onRetry(id) {
  if (geo.latitude.value != null && geo.longitude.value != null) {
    alerts.retryOne(id, geo.latitude.value, geo.longitude.value);
  }
}

function refresh() {
  if (geo.latitude.value != null && geo.longitude.value != null) {
    alerts.fetchAll(geo.latitude.value, geo.longitude.value);
  } else {
    geo.requestGps();
  }
}
</script>
