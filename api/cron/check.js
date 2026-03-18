import { Redis } from '@upstash/redis';
import { fetchUsgs } from '../../src/api/usgs.js';
import { fetchGeorisques } from '../../src/api/georisques.js';
import { fetchOpenMeteo } from '../../src/api/openmeteo.js';
import { fetchEonet } from '../../src/api/eonet.js';
import { fetchWaqi } from '../../src/api/waqi.js';
import { fetchReliefWeb } from '../../src/api/reliefweb.js';
import { fetchUv } from '../../src/api/uv.js';
import { fetchFlood } from '../../src/api/flood.js';

const redis = Redis.fromEnv();

const SOURCES = [
  { id: 'usgs', label: 'Séismes', icon: '🌍', fetcher: fetchUsgs },
  { id: 'georisques', label: 'Radon', icon: '☢️', fetcher: fetchGeorisques },
  { id: 'openmeteo', label: 'Météo extrême', icon: '🌡️', fetcher: fetchOpenMeteo },
  { id: 'eonet', label: 'Événements NASA', icon: '🛰️', fetcher: fetchEonet },
  { id: 'waqi', label: 'Qualité air', icon: '💨', fetcher: fetchWaqi },
  { id: 'reliefweb', label: 'Crises', icon: '🚨', fetcher: fetchReliefWeb },
  { id: 'uv', label: 'UV', icon: '☀️', fetcher: fetchUv },
  { id: 'flood', label: 'Inondation', icon: '🌊', fetcher: fetchFlood },
];

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const subscriberIds = await redis.smembers('subscribers');
  let notified = 0;

  for (const id of subscriberIds) {
    try {
      const raw = await redis.get(`sub:${id}`);
      if (!raw) continue;
      const sub = typeof raw === 'string' ? JSON.parse(raw) : raw;

      const results = await Promise.allSettled(
        SOURCES.map((s) => s.fetcher(sub.lat, sub.lon))
      );

      const currentState = SOURCES.map((s, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') return `${s.id}:${r.value.hasAlert}`;
        return `${s.id}:error`;
      }).join('|');

      if (currentState !== sub.lastState && sub.lastState !== null) {
        const alertData = SOURCES.map((s, i) => ({
          ...s,
          result: results[i].status === 'fulfilled' ? results[i].value : null,
          error: results[i].status === 'rejected' ? results[i].reason?.message : null,
        }));

        await sendEmail(sub, alertData, id);
        notified++;
      }

      await redis.set(`sub:${id}`, JSON.stringify({ ...sub, lastState: currentState }));
    } catch (e) {
      console.error(`Error processing subscriber ${id}:`, e.message);
    }
  }

  return res.status(200).json({ ok: true, checked: subscriberIds.length, notified });
}

async function sendEmail(sub, alertData, subId) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return;
  }

  const baseUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;
  const unsubUrl = `${baseUrl}/api/unsubscribe?id=${subId}&token=${sub.token}`;
  const html = buildEmailHtml(alertData, sub, unsubUrl);

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'AlertAroundMe <onboarding@resend.dev>',
      to: sub.email,
      subject: '🌍 Changement d\'alertes — AlertAroundMe',
      html,
    }),
  });
}

function buildEmailHtml(alertData, sub, unsubUrl) {
  const rows = alertData.map((a) => {
    if (a.error) {
      return `<tr><td style="padding:8px">${a.icon} ${a.label}</td><td style="padding:8px;color:#9ca3af">Erreur</td></tr>`;
    }
    if (!a.result) return '';
    const color = a.result.hasAlert
      ? (a.result.severity === 'danger' ? '#ef4444' : a.result.severity === 'warning' ? '#f59e0b' : '#3b82f6')
      : '#22c55e';
    return `<tr>
      <td style="padding:8px">${a.icon} ${a.label}</td>
      <td style="padding:8px"><span style="color:${color};font-weight:600">${a.result.summary}</span></td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:system-ui,sans-serif;background:#f9fafb;padding:20px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
  <h1 style="font-size:1.3rem;margin-bottom:4px">🌍 AlertAroundMe</h1>
  <p style="color:#6b7280;margin-top:0">Changement détecté${sub.communeName ? ` près de ${sub.communeName}` : ''}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tbody>${rows}</tbody>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
  <p style="font-size:12px;color:#9ca3af;text-align:center">
    <a href="${unsubUrl}" style="color:#6b7280">Se désabonner</a>
  </p>
</div></body></html>`;
}
