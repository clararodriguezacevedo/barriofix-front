// Carga el SDK de Google Maps una sola vez y lo comparte entre componentes.
// Con loading=async las librerías se piden con importLibrary.
let mapsPromise = null
export function cargarMaps(apiKey) {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    window.__barriofixMapsListo = () => resolve(window.google.maps)
    const s = document.createElement('script')
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${apiKey}` +
      '&loading=async&language=es&region=AR&callback=__barriofixMapsListo'
    s.async = true
    s.onerror = () => {
      mapsPromise = null
      reject(new Error('No se pudo cargar Google Maps'))
    }
    document.head.appendChild(s)
  })
  return mapsPromise
}
