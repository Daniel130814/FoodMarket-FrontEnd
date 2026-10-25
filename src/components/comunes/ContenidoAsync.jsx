// Resuelve los 4 estados de una lista del backend (cargando, error, vacía o con datos) sin ternarios anidados en las vistas.
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'

// Props: cargando, error (null o el texto), vacio (la vista lo calcula), mensajeCarga, mensajeVacio,
// contenidoVacio (opcional: JSX propio para el caso vacío), children (lo que se muestra con datos).
function ContenidoAsync({ cargando, error, vacio, mensajeCarga, mensajeVacio, contenidoVacio, children }) {
  // El orden es la prioridad: primero carga, después error, después vacío.
  if (cargando) {
    return <LoadingState message={mensajeCarga} />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }
  if (vacio) {
    if (contenidoVacio !== undefined) {
      return contenidoVacio
    }
    return <p className="mt-10 text-body-md text-on-surface-variant">{mensajeVacio}</p>
  }
  return <>{children}</>
}

export default ContenidoAsync
