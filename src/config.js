// Config en TIEMPO DE EJECUCION: la app lee /config.json al arrancar, en vez de
// hornear valores en el build. Asi el mismo dist sirve para cualquier cuenta;
// Terraform sube un config.json con la URL de la API y los datos de Cognito.
//
// Si /config.json no esta (p. ej. `npm run dev` sin backend), quedan los
// defaults de abajo.

export const config = {
  apiUrl: 'http://localhost:8080',
  cognitoDomain: '',
  cognitoClientId: '',
  region: 'us-east-1',
  // Vacía = sin mapa (el front degrada a solo la dirección)
  googleMapsApiKey: '',
}

export async function cargarConfig() {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (res.ok) Object.assign(config, await res.json())
  } catch {
    // Sin config.json: se usan los defaults (desarrollo local).
  }
}
