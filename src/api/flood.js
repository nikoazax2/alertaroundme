export async function fetchFlood(lat, lon) {
  const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo Flood HTTP ${res.status}`);
  const data = await res.json();

  const discharges = data.daily?.river_discharge || [];
  const dates = data.daily?.time || [];

  if (discharges.length === 0) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: 'Aucune donnée de débit fluvial disponible.',
      details: null,
    };
  }

  const current = discharges[0];
  const max = Math.max(...discharges);
  const avg = discharges.reduce((a, b) => a + b, 0) / discharges.length;
  const trend = discharges[discharges.length - 1] - current;
  const rising = trend > current * 0.5;
  const spike = max > current * 3 && max > 50;

  const forecast = dates.map((d, i) => ({
    date: d,
    discharge: discharges[i],
  }));

  if (spike) {
    return {
      hasAlert: true,
      severity: 'warning',
      summary: `Pic de débit prévu : ${max.toFixed(0)} m³/s (actuel ${current.toFixed(0)} m³/s).`,
      details: { current, max, forecast },
    };
  }

  if (rising) {
    return {
      hasAlert: true,
      severity: 'info',
      summary: `Débit fluvial en hausse : ${current.toFixed(0)} → ${discharges[discharges.length - 1].toFixed(0)} m³/s.`,
      details: { current, max, forecast },
    };
  }

  return {
    hasAlert: false,
    severity: 'none',
    summary: `Débit fluvial stable : ${current.toFixed(0)} m³/s.`,
    details: { current, max, forecast },
  };
}
