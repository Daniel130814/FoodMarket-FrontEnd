// Tarjeta de un pedido: datos, platos por chef y estado. Se usa en views/MisPedidos.

// Props:
//  - order: pedido con la forma de OrderResponse de la API
//    { id, fechaCreacion, estado, precioFinal, pagoBloqueado,
//      subPedidos: [{ id, chefId, chefNombre, estado, subtotal, detalles: [{ id, platoId, platoNombre, cantidad, precioUnitario, subtotal }] }] }
function OrderCard({ order }) {
  // Formatea el importe en pesos con separadores argentinos, igual que en el carrito.
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  // La fecha llega en formato ISO ('2026-10-19T18:20:00'); la pasamos a un texto legible.
  const fecha = new Date(order.fechaCreacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  // Cantidad de porciones: flatMap junta los detalles de todos los subpedidos en un solo array
  // y reduce los suma.
  const cantidadTotal = order.subPedidos
    .flatMap((subPedido) => subPedido.detalles)
    .reduce((acumulado, detalle) => acumulado + detalle.cantidad, 0)

  // TEMPORAL: el estado se muestra tal cual lo manda la API, sin guion bajo. En el paso 11b.8 se
  // reemplaza por el mapeo a textos amigables (Cocinando, En camino...).
  const nombreEstado = order.estado.replace('_', ' ')
  const claseBadge = order.estado === 'ENTREGADO' ? 'badge-leaf' : order.estado === 'CANCELADO' ? 'badge-dark' : 'badge-sand'

  return (
    <article className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-7" aria-labelledby={`pedido-${order.id}`}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-[220px]">
          <h3 id={`pedido-${order.id}`} className="font-display text-headline-sm text-primary">Pedido n.º {order.id}</h3>
          <p className="text-body-sm text-on-surface-variant">{fecha}</p>
        </div>
        <div className="flex-none text-right">
          <p className="font-display text-price-md tabular text-primary">{formatear(order.precioFinal)}</p>
          <p className="text-body-sm text-on-surface-variant">{cantidadTotal} {cantidadTotal === 1 ? 'plato' : 'platos'}</p>
        </div>
      </header>

      <div className="mt-7 border-t border-hairline pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-label-lg text-primary">Estado del pedido</p>
          <span className={`badge ${claseBadge}`}>{nombreEstado}</span>
        </div>
        {/* Un bloque por chef (subpedido), con sus platos. key = id del subpedido / del detalle */}
        <ul className="mt-4 space-y-4">
          {order.subPedidos.map((subPedido) => (
            <li key={subPedido.id}>
              <p className="text-label-md text-on-surface-variant">{subPedido.chefNombre}</p>
              <ul className="mt-1">
                {subPedido.detalles.map((detalle) => (
                  <li key={detalle.id} className="flex justify-between gap-4 text-body-sm text-primary">
                    <span>{detalle.cantidad} × {detalle.platoNombre}</span>
                    <span className="tabular">{formatear(detalle.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export default OrderCard
