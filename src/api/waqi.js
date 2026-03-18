const AQI_LEVELS = [
  { max: 50, label: 'Bon', color: 'green', severity: 'none' },
  { max: 100, label: 'Modéré', color: 'yellow', severity: 'info' },
  { max: 150, label: 'Nocif (sensibles)', color: 'orange', severity: 'warning' },
  { max: 200, label: 'Nocif', color: 'red', severity: 'warning' },
  { max: 300, label: 'Très nocif', color: 'purple', severity: 'danger' },
  { max: Infinity, label: 'Dangereux', color: 'maroon', severity: 'danger' },
];

function getAqiLevel(aqi) {
  return AQI_LEVELS.find((l) => aqi <= l.max);
}

export async function fetchWaqi(lat, lon) {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=demo`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WAQI HTTP ${res.status}`);
  const data = await res.json();

  if (data.status !== 'ok') {
    throw new Error(data.data || 'WAQI: réponse invalide');
  }

  const aqi = data.data.aqi;
  const level = getAqiLevel(aqi);

  return {
    hasAlert: aqi > 100,
    severity: level.severity,
    summary: `AQI ${aqi} — ${level.label}.`,
    details: { aqi, color: level.color, station: data.data.city?.name },
  };
}
