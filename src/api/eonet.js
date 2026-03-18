import { haversineDistance } from '../utils/geo.js';

const MAX_DISTANCE_KM = 500;

const CATEGORY_LABELS = {
  wildfires: 'Feu', severeStorms: 'Tempête', volcanoes: 'Volcan',
  floods: 'Inondation', earthquakes: 'Séisme', landslides: 'Glissement',
  seaLakeIce: 'Glace', snow: 'Neige',
};

export async function fetchEonet(lat, lon) {
  const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`EONET HTTP ${res.status}`);
  const data = await res.json();

  const nearby = [];
  for (const event of data.events) {
    const geo = event.geometry?.[event.geometry.length - 1];
    if (!geo?.coordinates) continue;
    const [eLon, eLat] = geo.coordinates;
    const dist = haversineDistance(lat, lon, eLat, eLon);
    if (dist <= MAX_DISTANCE_KM) {
      const catId = event.categories?.[0]?.id;
      nearby.push({
        title: event.title,
        category: CATEGORY_LABELS[catId] || catId,
        distance: Math.round(dist),
        date: geo.date,
      });
    }
  }

  if (nearby.length === 0) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: 'Aucun événement naturel actif dans un rayon de 500 km.',
      details: null,
    };
  }

  return {
    hasAlert: true,
    severity: nearby.length >= 3 ? 'danger' : 'warning',
    summary: `${nearby.length} événement(s) actif(s) à proximité.`,
    details: nearby,
  };
}
