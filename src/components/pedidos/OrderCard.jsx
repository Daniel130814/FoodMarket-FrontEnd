// Tarjeta de un pedido (datos, seguimiento y platos por chef) para views/MisPedidos.
import OrderTrack from './OrderTrack'

// Props: order (OrderResponse), steps (pasos { estado, etiqueta } del seguimiento), payment (último pago o null),
// reviewedPlatoIds (platos ya reseñados), onCancel (pedidoId), onPay (pedidoId), onReview (detalle del plato).
function OrderCard({ order, steps, payment, reviewedPlatoIds, onCancel, onPay, onReview }) {
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  const fecha = new Date(order.fechaCreacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  const cantidadTotal = order.subPedidos
    .flatMap((subPedido) => subPedido.detalles)
    .reduce((acumulado, detalle) => acumulado + detalle.cantidad, 0)

  // Estado del pago -> texto y color del badge.
  const ETIQUETAS_PAGO = {
    PENDIENTE: { texto: 'Pago pendiente de aprobación', clase: 'badge-sand' },
    APROBADO: { texto: 'Pago aprobado', clase: 'badge-leaf' },
    RECHAZADO: { texto: 'Pago rechazado', clase: 'badge-terra' },
    REEMBOLSADO: { texto: 'Pago reembolsado', clase: 'badge-mute' },
  }

  // Se puede pagar si el pedido está PENDIENTE, la API no bloqueó los pagos (5 rechazados) y no hay pago o el último fue RECHAZADO.
  const sePuedePagar =
    order.estado === 'PENDIENTE' && !order.pagoBloqueado && (payment === null || payment.estado === 'RECHAZADO')

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

      <div className="mt-7">
        {order.estado === 'CANCELADO' ? (
          <span className="badge badge-terra">Cancelado</span>
        ) : (
          <OrderTrack steps={steps} currentState={order.estado} />
        )}
      </div>

      {/* Un bloque por chef (subpedido), con sus platos */}
      <ul className="mt-7 space-y-4 border-t border-hairline pt-5">
        {order.subPedidos.map((subPedido) => (
          <li key={subPedido.id}>
            <p className="text-label-md text-on-surface-variant">{subPedido.chefNombre}</p>
            <ul className="mt-1">
              {subPedido.detalles.map((detalle) => (
                <li key={detalle.id} className="flex items-center justify-between gap-4 text-body-sm text-primary">
                  <span>{detalle.cantidad} × {detalle.platoNombre}</span>
                  <span className="flex items-center gap-3">
                    {/* La API solo deja reseñar platos de un subpedido ENTREGADO */}
                    {subPedido.estado === 'ENTREGADO' &&
                      (reviewedPlatoIds.includes(detalle.platoId) ? (
                        <span className="badge badge-leaf">Reseñado</span>
                      ) : (
                        <button type="button" className="btn btn-quiet btn-sm" onClick={() => onReview(detalle)}>
                          Reseñar
                        </button>
                      ))}
                    <span className="tabular">{formatear(detalle.subtotal)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {/* Estado del pago (un pedido cancelado no lo muestra) */}
      {order.estado !== 'CANCELADO' && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
          {payment !== null && <span className={`badge ${ETIQUETAS_PAGO[payment.estado].clase}`}>{ETIQUETAS_PAGO[payment.estado].texto}</span>}
          {order.pagoBloqueado && <span className="badge badge-terra">Pagos bloqueados por demasiados rechazos</span>}
          {payment === null && !order.pagoBloqueado && order.estado === 'PENDIENTE' && (
            <span className="text-body-sm text-on-surface-variant">Todavía no pagaste este pedido.</span>
          )}
          {sePuedePagar && (
            <button type="button" className="btn btn-primary btn-sm ml-auto" onClick={() => onPay(order.id)}>
              {payment === null ? 'Pagar' : 'Pagar de nuevo'}
            </button>
          )}
        </div>
      )}

      {/* Solo se cancela un pedido pendiente (regla de la API) */}
      {order.estado === 'PENDIENTE' && (
        <div className="mt-3 flex justify-end">
          <button type="button" className="btn btn-quiet btn-sm text-error" onClick={() => onCancel(order.id)}>
            Cancelar pedido
          </button>
        </div>
      )}
    </article>
  )
}

export default OrderCard
