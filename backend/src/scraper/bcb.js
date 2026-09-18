const BCB_BASE = 'https://www.bcb.gob.bo/librerias/indicadores/otras';

// Obtiene el tipo de cambio oficial (Bs/USD) del BCB para una fecha 'YYYY-MM-DD'.
export async function obtenerTipoCambioBcb(fecha) {
  const [aa, mm, dd] = fecha.split('-');
  const url = `${BCB_BASE}/otras_imprimir.php?qdd=${dd}&qmm=${mm}&qaa=${aa}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`BCB HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/ESTADOS UNIDOS[\s\S]*?<td class="numero">([\d.,]+)<\/td>/i);
  if (!m) return null;
  const v = parseFloat(m[1].replace(',', '.'));
  return Number.isNaN(v) ? null : v;
}
