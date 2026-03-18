const SEVERE_WMO_CODES = new Set([95, 96, 99]);

const WMO_LABELS = {
  0: 'Ciel dégagé', 1: 'Principalement dégagé', 2: 'Partiellement nuageux',
  3: 'Couvert', 45: 'Brouillard', 48: 'Brouillard givrant',
  51: 'Bruine légère', 53: 'Bruine modérée', 55: 'Bruine dense',
  61: 'Pluie légère', 63: 'Pluie modérée', 65: 'Pluie forte',
  71: 'Neige légère', 73: 'Neige modérée', 75: 'Neige forte',
  80: 'Averses légères', 81: 'Averses modérées', 82: 'Averses violentes',
  85: 'Averses de neige légères', 86: 'Averses de neige fortes',
  95: 'Orage', 96: 'Orage avec grêle légère', 99: 'Orage avec grêle forte',
};

export async function fetchOpenMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const data = await res.json();
  const c = data.current;

  const alerts = [];
  if (c.temperature_2m > 40) alerts.push(`Canicule ${c.temperature_2m}°C`);
  if (c.temperature_2m < -10) alerts.push(`Gel extrême ${c.temperature_2m}°C`);
  if (c.wind_speed_10m > 80) alerts.push(`Vent violent ${c.wind_speed_10m} km/h`);
  if (SEVERE_WMO_CODES.has(c.weather_code)) alerts.push(WMO_LABELS[c.weather_code]);

  const weatherLabel = WMO_LABELS[c.weather_code] || `Code ${c.weather_code}`;

  if (alerts.length === 0) {
    return {
      hasAlert: false,
      severity: 'none',
      summary: `${weatherLabel}, ${c.temperature_2m}°C, vent ${c.wind_speed_10m} km/h.`,
      details: c,
    };
  }

  return {
    hasAlert: true,
    severity: 'danger',
    summary: alerts.join(' — '),
    details: c,
  };
}
