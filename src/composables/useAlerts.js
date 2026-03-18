import { ref, reactive } from 'vue';
import { fetchUsgs } from '../api/usgs.js';
import { fetchGeorisques } from '../api/georisques.js';
import { fetchOpenMeteo } from '../api/openmeteo.js';
import { fetchEonet } from '../api/eonet.js';
import { fetchWaqi } from '../api/waqi.js';
import { fetchReliefWeb } from '../api/reliefweb.js';
import { fetchUv } from '../api/uv.js';

const SOURCE_DEFS = [
  { id: 'usgs', label: 'Séismes (USGS)', icon: '🌍', fetcher: fetchUsgs },
  { id: 'georisques', label: 'Radon (Géorisques)', icon: '☢️', fetcher: fetchGeorisques },
  { id: 'openmeteo', label: 'Météo extrême', icon: '🌡️', fetcher: fetchOpenMeteo },
  { id: 'eonet', label: 'Événements NASA', icon: '🛰️', fetcher: fetchEonet },
  { id: 'waqi', label: 'Qualité de l\'air', icon: '💨', fetcher: fetchWaqi },
  { id: 'reliefweb', label: 'Crises (ONU)', icon: '🚨', fetcher: fetchReliefWeb },
  { id: 'uv', label: 'Index UV', icon: '☀️', fetcher: fetchUv },
];

export function useAlerts() {
  const sources = ref(
    SOURCE_DEFS.map((s) => ({
      id: s.id,
      label: s.label,
      icon: s.icon,
      status: 'idle',
      data: null,
      error: null,
    }))
  );

  const isAnyLoading = ref(false);

  function findSource(id) {
    return sources.value.find((s) => s.id === id);
  }

  async function fetchAll(lat, lon) {
    isAnyLoading.value = true;
    sources.value.forEach((s) => {
      s.status = 'loading';
      s.data = null;
      s.error = null;
    });

    const results = await Promise.allSettled(
      SOURCE_DEFS.map((def) => def.fetcher(lat, lon))
    );

    results.forEach((result, i) => {
      const source = findSource(SOURCE_DEFS[i].id);
      if (result.status === 'fulfilled') {
        source.data = result.value;
        source.status = 'done';
      } else {
        source.error = result.reason?.message || 'Erreur inconnue';
        source.status = 'error';
      }
    });

    isAnyLoading.value = false;
  }

  async function retryOne(id, lat, lon) {
    const source = findSource(id);
    const def = SOURCE_DEFS.find((d) => d.id === id);
    if (!source || !def) return;

    source.status = 'loading';
    source.error = null;
    try {
      source.data = await def.fetcher(lat, lon);
      source.status = 'done';
    } catch (e) {
      source.error = e.message || 'Erreur inconnue';
      source.status = 'error';
    }
  }

  return { sources, isAnyLoading, fetchAll, retryOne };
}
