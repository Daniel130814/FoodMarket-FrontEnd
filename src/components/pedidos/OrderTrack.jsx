// Línea de seguimiento de un pedido (Pendiente > Recibido > Cocinando > ...). Solo dibuja los pasos que le pasan.

// Clase CSS de un paso según su posición: anteriores is-done, actual is-current, siguientes sin clase.
const claseDelPaso = (index, posicionActual) => {
  if (index < posicionActual) {
    return 'is-done'
  }
  if (index === posicionActual) {
    return 'is-current'
  }
  return ''
}

// Props: steps (pasos ordenados { estado, etiqueta }), currentState (estado actual, uno de los de steps).
function OrderTrack({ steps, currentState }) {
  const posicionActual = steps.findIndex((paso) => paso.estado === currentState)

  return (
    // El diseño trae 4 columnas fijas: con style se ajusta a la cantidad real de pasos.
    <ol
      className="track"
      lang="es"
      aria-label="Estado del pedido"
      style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
    >
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
