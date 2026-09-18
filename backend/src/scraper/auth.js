import { config } from '../config.js';

const SSO_URL = `${config.suma.baseUrl}/b-sso/rest`;

export async function login() {
  const res = await fetch(`${SSO_URL}/autenticar/portal?operador=ip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombreUsuario: config.suma.usuario,
      password: config.suma.password,
      tipo: 'EXTERNO',
    }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`Login fallido: ${data.result}`);
  }
  return data.result.token;
}
