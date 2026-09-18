import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Extrae el texto de un PDF usando pdftotext (poppler-utils).
export async function extraerTextoPdf(ruta) {
  try {
    const { stdout } = await execFileAsync('pdftotext', [ruta, '-']);
    return stdout;
  } catch {
    return '';
  }
}

function limpiarParte(s) {
  return (s || '')
    .replace(/\s*\/\s*[A-Z]{2,}\s*$/i, '') // quita "/ARGENTINA", "/BOLIVIA"
    .replace(/\s*\d[\d.,]*\s*(?:USD|BS|BOB|US\$)?\s*$/i, '') // quita montos y moneda
    .replace(/\s*(?:S\.A\.|S\.A|S\.R\.L\.|S\.R\.L|LTDA\.?|SRL)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parsea el texto de una factura de transporte (TR-018).
export function parsearFacturaTransporte(texto) {
  if (!texto) return { tipoCambioTrans: null, tramoFlete: null };

  // Tipo de cambio: "T/C: 9.96", "T/C 11.52", "T/C USD 11.58", "TIPO DE CAMBIO: 11.58"
  let tipoCambioTrans = null;
  const mTc = texto.match(/(?:T\/C|T\.C\.?|TIPO\s+DE\s+CAMBIO)\s*:?\s*(?:USD\s*)?([\d]+(?:[.,]\d+)?)/i);
  if (mTc) {
    const v = parseFloat(mTc[1].replace(',', '.'));
    if (!Number.isNaN(v)) tipoCambioTrans = v;
  }

  // Recolectar bloques de TRAMO (multi-línea).
  const tramos = [];
  const lineas = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const terminador = /^(CANTIDAD|PRECIO|MONTO|CRT|PLACA|PLACAS|VOLUMEN|PRODUCTO|FACTURA|T\/C|TOTAL|SUBTOTAL|SON:|NIT|CODIGO|NRO|N[º°])/i;
  let current = null;
  for (const linea of lineas) {
    const mTramo = linea.match(/^TRAMO\s*(?:\d+)?\s*:\s*(.*)$/i);
    if (mTramo) {
      if (current) tramos.push(current);
      current = { partes: [] };
      const rest = mTramo[1].trim();
      if (rest) current.partes.push(rest);
    } else if (current) {
      if (terminador.test(linea)) {
        tramos.push(current);
        current = null;
      } else {
        current.partes.push(linea);
      }
    }
  }
  if (current) tramos.push(current);

  // Parsear cada tramo: origen antes del primer "-", destino después.
  const tramosOk = [];
  for (const t of tramos) {
    const full = t.partes.join(' ').replace(/\s+/g, ' ').trim();
    if (!full) continue;
    const i = full.indexOf('-');
    if (i < 0) continue;
    const origen = limpiarParte(full.slice(0, i));
    const destino = limpiarParte(full.slice(i + 1));
    if (origen && destino) tramosOk.push({ origen, destino });
  }

  let tramoFlete = null;
  if (tramosOk.length >= 2) {
    const origen = tramosOk[0].origen;
    const destinoFinal = tramosOk[tramosOk.length - 1].destino;
    if (origen && destinoFinal) tramoFlete = `${origen} - ${destinoFinal}`;
  } else if (tramosOk.length === 1) {
    tramoFlete = `${tramosOk[0].origen} - ${tramosOk[0].destino}`;
  }

  return { tipoCambioTrans, tramoFlete };
}
