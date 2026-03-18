const DANGER_TYPES = new Set([
  'Complex Emergency', 'Tropical Cyclone', 'Tsunami', 'Volcano',
]);
const WARNING_TYPES = new Set([
  'Earthquake', 'Flood', 'Flash Flood', 'Epidemic', 'Fire', 'Wild Fire',
  'Storm Surge', 'Severe Local Storm', 'Technological Disaster', 'Land Slide',
]);

async function getCountryName(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=3&addressdetails=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AlertAroundMe/1.0' },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  return data.address?.country || null;
}

export async function fetchReliefWeb(lat, lon) {
  const country = await getCountryName(lat, lon);
  if (!country) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: 'Pays non identifié — données crises indisponibles.',
      details: null,
    };
  }

  const res = await fetch('https://api.reliefweb.int/v1/disasters?appname=alertaroundme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: {
        operator: 'AND',
        conditions: [
          { field: 'status', value: 'current' },
          { field: 'country.name', value: country },
        ],
      },
      fields: {
        include: ['name', 'date', 'type', 'country', 'status'],
      },
      sort: ['date.created:desc'],
      limit: 10,
    }),
  });

  if (!res.ok) throw new Error(`ReliefWeb HTTP ${res.status}`);
  const data = await res.json();

  const crises = (data.data || []).map((d) => ({
    name: d.fields.name,
    types: d.fields.type?.map((t) => t.name) || [],
    date: d.fields.date?.created,
  }));

  if (crises.length === 0) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: `Aucune crise active signalée en ${country}.`,
      details: null,
    };
  }

  const allTypes = crises.flatMap((c) => c.types);
  let severity = 'info';
  if (allTypes.some((t) => DANGER_TYPES.has(t))) severity = 'danger';
  else if (allTypes.some((t) => WARNING_TYPES.has(t))) severity = 'warning';

  return {
    hasAlert: true,
    severity,
    summary: `${crises.length} crise(s) active(s) en ${country}.`,
    details: crises,
  };
}
