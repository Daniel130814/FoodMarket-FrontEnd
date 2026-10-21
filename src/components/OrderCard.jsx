// Tarjeta de un pedido: datos, seguimiento de estado y platos agrupados por chef. Se usa en views/MisPedidos.
import OrderTrack from './OrderTrack'

// Props:
//  - order: pedido con la forma de OrderResponse de la API
//    { id, fechaCreacion, estado, precioFinal, pagoBloqueado,
//      subPedidos: [{ id, chefId, chefNombre, estado, subtotal, detalles: [{ id, platoId, platoNombre, cantidad, precioUnitario, subtotal }] }] }
//  - steps: pasos del seguimiento [{ estado, etiqueta }] (los arma el padre con los textos amigables)
//  - payment: el ÚLTIMO pago de este pedido con la forma de PagoResponse de la API
//    { id, pedidoId, monto, medioPago, estado, fechaCreacion, fechaPago }, o null si todavía no tiene ninguno
//  - onCancel: función del padre (pedidoId); se llama al tocar "Cancelar pedido". La tarjeta no
//    cancela nada: solo avisa "quiero cancelar este pedido".
//  - onPay: función del padre (pedidoId); se llama al tocar "Pagar". La tarjeta no paga nada: solo avisa.
function OrderCard({ order, steps, payment, onCancel, onPay }) {
  // Formatea el importe en pesos con separadores argentinos, igual que en el carrito.
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  // La fecha llega en formato ISO ('2026-10-19T18:20:00'); la pasamos a un texto legible.
  const fecha = new Date(order.fechaCreacion).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

  // Cantidad de porciones: flatMap junta los detalles de todos los subpedidos en un solo array
  // y reduce los suma.
  const cantidadTotal = order.subPedidos
    .flatMap((subPedido) => subPedido.detalles)
    .reduce((acumulado, detalle) => acumulado + detalle.cantidad, 0)

  // Estados del pago de la API -> texto y color del badge. Es un objeto usado como "diccionario".
  const ETIQUETAS_PAGO = {
    PENDIENTE: { texto: 'Pago pendiente de aprobación', clase: 'badge-sand' },
    APROBADO: { texto: 'Pago aprobado', clase: 'badge-leaf' },
    RECHAZADO: { texto: 'Pago rechazado', clase: 'badge-terra' },
    REEMBOLSADO: { texto: 'Pago reembolsado', clase: 'badge-mute' },
  }

  // VALORES CALCULADOS (no se guardan aparte): cuándo se puede pagar.
  //  - el pedido tiene que estar PENDIENTE (no cancelado ni avanzado);
  //  - si la API bloqueó los pagos (5 rechazados), no se puede más;
  //  - sin pago todavía, o con el último RECHAZADO, se puede (re)intentar.
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

      {/* Renderizado condicional: un pedido cancelado no tiene seguimiento, solo su badge */}
      <div className="mt-7">
        {order.estado === 'CANCELADO' ? (
          <span className="badge badge-terra">Cancelado</span>
        ) : (
          <OrderTrack steps={steps} currentState={order.estado} />
        )}
      </div>

      {/* Un bloque por chef (subpedido), con sus platos. key = id del subpedido / del detalle */}
      <ul className="mt-7 space-y-4 border-t border-hairline pt-5">
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

      {/* Estado del pago: renderizado condicional. Un pedido cancelado no muestra pago. */}
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

      {/* Solo se puede cancelar mientras el pedido está pendiente de confirmación (regla de la API) */}
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
