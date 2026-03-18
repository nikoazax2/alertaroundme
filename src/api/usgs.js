export async function fetchUsgs(lat, lon) {
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=100&minmagnitude=4&orderby=time&limit=5`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
  const data = await res.json();

  if (data.features.length === 0) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: 'Aucun séisme M4+ dans un rayon de 100 km.',
      details: null,
    };
  }

  const quakes = data.features.map((f) => ({
    magnitude: f.properties.mag,
    place: f.properties.place,
    time: new Date(f.properties.time).toLocaleString(),
  }));

  const max = Math.max(...quakes.map((q) => q.magnitude));
  return {
    hasAlert: true,
    severity: max >= 6 ? 'danger' : 'warning',
    summary: `${quakes.length} séisme(s) détecté(s), max M${max}.`,
    details: quakes,
  };
}
