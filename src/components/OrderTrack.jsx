// Línea de seguimiento de un pedido (Pendiente > Recibido > Cocinando > ...). Se usa en components/OrderCard.
// Componente "tonto": solo dibuja los pasos; no sabe qué significa cada estado.

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
      aria-label="Estado del pedido"
      style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
    >
      {/* map: un <li> por paso. index es la posición del paso en la lista.
          Los pasos anteriores al actual están hechos (is-done), el actual se marca (is-current). */}
      {steps.map((paso, index) => {
        const clase = index < posicionActual ? 'is-done' : index === posicionActual ? 'is-current' : ''
        return (
          <li key={paso.estado} className={clase} aria-current={index === posicionActual ? 'step' : undefined}>
            {paso.etiqueta}
          </li>
        )
      })}
    </ol>
  )
}

export default OrderTrack
