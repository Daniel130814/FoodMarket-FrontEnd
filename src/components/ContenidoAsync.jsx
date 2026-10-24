// Resuelve los 4 estados de una lista que viene del backend: cargando, error, vacía o con datos.
// Lo usan las vistas que piden una lista (empieza en views/Inicio) para no repetir ternarios anidados.
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'

// Props:
//  - cargando: true mientras el pedido al backend no respondió
//  - error: null si todo está bien, o el texto del error si la API falló
//  - vacio: true si la lista llegó sin elementos (la vista lo calcula, ej: platos.length === 0)
//  - mensajeCarga: texto que se muestra mientras carga
//  - mensajeVacio: texto que se muestra si la lista está vacía
//  - contenidoVacio: opcional, un elemento JSX propio para el caso vacío (ej: un EmptyState con botón).
//    Si no se pasa, se muestra mensajeVacio como un párrafo simple.
//  - children: lo que se muestra cuando hay datos (lo que se escribe entre <ContenidoAsync> y </ContenidoAsync>)
function ContenidoAsync({ cargando, error, vacio, mensajeCarga, mensajeVacio, contenidoVacio, children }) {
  // Cada "if" con return corta la función: el orden es la prioridad (primero carga, después error, después vacío).
  if (cargando) {
    return <LoadingState message={mensajeCarga} />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }
  if (vacio) {
    // Una prop que la vista no pasó vale undefined: si llegó algo, mostramos eso en lugar del párrafo.
    if (contenidoVacio !== undefined) {
      return contenidoVacio
    }
    return <p className="mt-10 text-body-md text-on-surface-variant">{mensajeVacio}</p>
  }
  // Hay datos: devolvemos tal cual lo que la vista puso adentro.
  return <>{children}</>
}

export default ContenidoAsync
