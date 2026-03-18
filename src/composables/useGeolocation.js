import { ref } from 'vue';

export function useGeolocation() {
  const latitude = ref(null);
  const longitude = ref(null);
  const communeName = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const gpsRefused = ref(false);
  const citySuggestions = ref([]);

  async function requestGps() {
    loading.value = true;
    error.value = null;
    gpsRefused.value = false;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
        });
      });
      latitude.value = pos.coords.latitude;
      longitude.value = pos.coords.longitude;
      await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    } catch (e) {
      gpsRefused.value = true;
      if (e.code === 1) error.value = 'Accès GPS refusé.';
      else if (e.code === 3) error.value = 'Délai GPS dépassé.';
      else error.value = 'Position GPS indisponible.';
    } finally {
      loading.value = false;
    }
  }

  async function reverseGeocode(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AlertAroundMe/1.0' },
      });
      const data = await res.json();
      communeName.value = data.display_name;
    } catch {
      // non-bloquant
    }
  }

  async function searchCity(query) {
    if (!query || query.length < 2) {
      citySuggestions.value = [];
      return;
    }
    try {
      const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=code,nom,centre&boost=population&limit=5`;
      const res = await fetch(url);
      citySuggestions.value = await res.json();
    } catch {
      citySuggestions.value = [];
    }
  }

  function selectCity(city) {
    latitude.value = city.centre.coordinates[1];
    longitude.value = city.centre.coordinates[0];
    communeName.value = city.nom;
    citySuggestions.value = [];
    gpsRefused.value = false;
    error.value = null;
  }

  return {
    latitude,
    longitude,
    communeName,
    loading,
    error,
    gpsRefused,
    citySuggestions,
    requestGps,
    searchCity,
    selectCity,
  };
}
