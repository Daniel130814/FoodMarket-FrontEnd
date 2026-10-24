// Línea de seguimiento de un pedido (Pendiente > Recibido > Cocinando > ...). Se usa en components/OrderCard.
// Componente "tonto": solo dibuja los pasos; no sabe qué significa cada estado.

// Devuelve la clase CSS de un paso según su posición respecto del paso actual:
// los anteriores están hechos (is-done), el actual se marca (is-current) y los siguientes no llevan clase.
// Es una función auxiliar: con ifs se lee mejor que dos ternarios encadenados dentro del JSX.
const claseDelPaso = (index, posicionActual) => {
  if (index < posicionActual) {
    return 'is-done'
  }
  if (index === posicionActual) {
    return 'is-current'
  }
  return ''
}

// Props:
//  - steps: array ordenado de pasos { estado, etiqueta } (el padre arma las etiquetas)
//  - currentState: el estado actual del pedido, uno de los de steps (por ejemplo "EN_PREPARACION")
function OrderTrack({ steps, currentState }) {
  // findIndex devuelve la POSICIÓN del primer paso que cumple la condición (o -1 si no hay).
  const posicionActual = steps.findIndex((paso) => paso.estado === currentState)

  return (
    // El diseño trae 4 columnas fijas; con style ajustamos la cantidad real de pasos.
    <ol
      className="track"
      lang="es"
      aria-label="Estado del pedido"
      style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
    >
      {/* map: un <li> por paso. index es la posición del paso en la lista. */}
      {steps.map((paso, index) => (
        <li
          key={paso.estado}
          className={claseDelPaso(index, posicionActual)}
          aria-current={index === posicionActual ? 'step' : undefined}
        >
          {paso.etiqueta}
        </li>
      ))}
    </ol>
  )
}

export default OrderTrack
