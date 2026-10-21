// Tarjeta de un subpedido (la parte de un pedido que le toca a un chef): seguimiento de estado, platos y
// el botón para avanzarlo. Se usa en views/PedidosRecibidos.
import OrderTrack from './OrderTrack'

// Props:
//  - subPedido: subpedido con la forma de SubPedidoChefResponse de la API
//    { id, chefId, chefNombre, estado, subtotal, detalles: [{ id, platoId, platoNombre, cantidad, precioUnitario, subtotal }] }
//  - steps: pasos del seguimiento [{ estado, etiqueta }] (los arma el padre con los textos amigables)
//  - accion: { boton } con el texto del botón que avanza al paso siguiente, o null si ya no se puede avanzar
//  - onAdvance: función del padre (subPedido); se llama al tocar el botón. La tarjeta no avanza nada:
//    solo avisa "quiero avanzar este subpedido".
function SubPedidoCard({ subPedido, steps, accion, onAdvance }) {
  // Formatea el importe en pesos con separadores argentinos, igual que en el resto de la app.
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  // Cantidad de porciones: reduce suma la cantidad de cada detalle.
  const cantidadTotal = subPedido.detalles.reduce((acumulado, detalle) => acumulado + detalle.cantidad, 0)

  return (
    <article className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-7" aria-labelledby={`subpedido-${subPedido.id}`}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h3 id={`subpedido-${subPedido.id}`} className="min-w-0 flex-1 basis-[220px] font-display text-headline-sm text-primary">
          Subpedido n.º {subPedido.id}
        </h3>
        <div className="flex-none text-right">
          <p className="font-display text-price-md tabular text-primary">{formatear(subPedido.subtotal)}</p>
          <p className="text-body-sm text-on-surface-variant">{cantidadTotal} {cantidadTotal === 1 ? 'plato' : 'platos'}</p>
        </div>
      </header>

      {/* Renderizado condicional: un subpedido cancelado no tiene seguimiento, solo su badge */}
      <div className="mt-7">
        {subPedido.estado === 'CANCELADO' ? (
          <span className="badge badge-terra">Cancelado</span>
        ) : (
          <OrderTrack steps={steps} currentState={subPedido.estado} />
        )}
      </div>

      {/* Los platos de este subpedido. map: un <li> por detalle; key = id del detalle */}
      <ul className="mt-7 border-t border-hairline pt-5">
        {subPedido.detalles.map((detalle) => (
          <li key={detalle.id} className="flex justify-between gap-4 text-body-sm text-primary">
            <span>{detalle.cantidad} × {detalle.platoNombre}</span>
            <span className="tabular">{formatear(detalle.subtotal)}</span>
          </li>
        ))}
      </ul>

      {/* Renderizado condicional: según el estado, el botón de avanzar o una explicación */}
      {accion !== null && (
        <div className="mt-5 flex justify-end">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onAdvance(subPedido)}>
            {accion.boton}
          </button>
        </div>
      )}
      {subPedido.estado === 'PENDIENTE' && (
        <p className="mt-5 text-body-sm text-on-surface-variant">
          Esperando que aprueben el pago del pedido. Hasta entonces no se puede avanzar.
        </p>
      )}
    </article>
  )
}

export default SubPedidoCard
