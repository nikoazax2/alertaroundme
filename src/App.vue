<template>
    <div class="p-6 text-center">
      <h1 class="text-3xl font-bold mb-4">🌍 Alert Around Me</h1>
      <p v-if="loading">📡 Searching for nearby alerts...</p>
      <p v-else-if="error" class="text-red-500">{{ error }}</p>
  
      <div v-else>
        <div v-if="alertQuake" class="text-orange-600 font-semibold">
          <p>⚠️ 🌍 Earthquake (USGS): Verified, {{ alertQuake }}</p>
        </div>
  
        <div v-if="alertRadiation" class="text-yellow-600 font-semibold">
          <p>⚠️ ☢️ Radiation (Safecast): Verified, {{ alertRadiation }}</p>
        </div>
  
        <div v-if="!alertQuake && !alertRadiation" class="text-green-600">
          <p>✅ No alerts detected. The following APIs were checked:</p>
          <ul class="list-disc text-left ml-6">
            <li>🌍 Earthquake (USGS): No recent events nearby.</li>
            <li>☢️ Radiation (Safecast): No elevated readings nearby.</li>
          </ul>
        </div>
  
        <div v-if="verifiedAddress" class="text-gray-700 mt-4">
          <p>📍 Verified location: {{ verifiedAddress }}</p>
        </div>
      </div>
  
      <button @click="reload" class="mt-4 bg-blue-500 text-white py-2 px-4 rounded">
        🔄 Search again
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  
  const loading = ref(true);
  const error = ref(null);
  const alertQuake = ref(null);
  const alertRadiation = ref(null);
  const verifiedAddress = ref(null);
  
  async function getUserLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        () => reject("❌ Location access denied or unavailable.")
      );
    });
  }
  
  async function getAddress(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const response = await fetch(url);
    const data = await response.json();
    return data.display_name;
  }
  
  async function fetchAlerts() {
    try {
      loading.value = true;
      const coords = await getUserLocation();
      const { latitude, longitude } = coords;
  
      // Earthquake check (USGS)
      const quakeRes = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradiuskm=100&minmagnitude=4&orderby=time&limit=1`);
      const quakeData = await quakeRes.json();
      if (quakeData.features.length > 0) {
        const quake = quakeData.features[0];
        const mag = quake.properties.mag;
        const place = quake.properties.place;
        alertQuake.value = `M${mag} earthquake detected near ${place}`;
      }
  
      // Radiation check (Safecast)
      const radiationRes = await fetch(`https://api.safecast.org/measurements?latitude=${latitude}&longitude=${longitude}&distance=5&unit=usv`);
      const radData = await radiationRes.json();
      if (radData.length > 0) {
        const readings = radData.map(r => r.value);
        const avg = readings.reduce((a, b) => a + b, 0) / readings.length;
  
        if (avg > 0.3) {
          alertRadiation.value = `High average radiation detected: ${avg.toFixed(2)} μSv/h`;
        } else {
          alertRadiation.value = null;
        }
      }
  
      // Reverse geocoding
      verifiedAddress.value = await getAddress(latitude, longitude);
  
    } catch (e) {
      error.value = typeof e === 'string' ? e : 'Error retrieving data.';
    } finally {
      loading.value = false;
    }
  }
  
  function reload() {
    alertQuake.value = null;
    alertRadiation.value = null;
    verifiedAddress.value = null;
    error.value = null;
    fetchAlerts();
  }
  
  onMounted(() => {
    fetchAlerts();
  });
  </script>
  
  <style>
  ul {
    list-style-type: none;
  }
  </style>
  