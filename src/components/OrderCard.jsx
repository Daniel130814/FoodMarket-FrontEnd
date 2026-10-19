// Tarjeta de un pedido: datos, fotos de los platos y estado como texto.
// Se usa en views/MisPedidos para los pedidos en curso y los anteriores.

// Props:
//  - order: pedido con id, when (fecha), chefs, status (estado), message,
//    delivery (estimación de entrega o null) e items ({ plato, cantidad }).
function OrderCard({ order }) {
  // Como en CartGroup, los importes y las cantidades se calculan desde los ítems.
  // reduce acumula un resultado: suma los precios o las porciones de cada ítem.
  const total = order.items.reduce((acumulado, item) => acumulado + item.plato.price * item.cantidad, 0)
  const cantidadTotal = order.items.reduce((acumulado, item) => acumulado + item.cantidad, 0)

  // Formatea el importe en pesos con separadores argentinos, igual que en el carrito.
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <article className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-7" aria-labelledby={`pedido-${order.id}`}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-[220px]">
          <h3 id={`pedido-${order.id}`} className="font-display text-headline-sm text-primary">Pedido n.º {order.id}</h3>
          <p className="text-body-sm text-on-surface-variant">{order.when} · {order.chefs}</p>
        </div>
        <div className="flex-none text-right">
          <p className="font-display text-price-md tabular text-primary">{formatear(total)}</p>
          <p className="text-body-sm text-on-surface-variant">{cantidadTotal} {cantidadTotal === 1 ? 'plato' : 'platos'}</p>
        </div>
      </header>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
          <ul className="flex -space-x-2" aria-label="Platos del pedido">
            {/* Una foto por plato; la cantidad ya está incluida en el total de porciones. */}
            {order.items.map((item) => (
              <li key={item.plato.id}>
                <img
                  src={item.plato.images[0]}
                  alt={item.plato.title}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-surface-container-lowest"
                />
              </li>
            ))}
          </ul>
          <div className="min-w-0 flex-1 basis-[180px]">
            <p className="text-label-lg text-primary">{order.message}</p>
            {/* Renderizado condicional: los pedidos entregados no tienen estimación. */}
            {order.delivery !== null && (
              <p className="text-body-sm text-on-surface-variant">{order.delivery}</p>
            )}
          </div>
        </div>
        <span className={`badge ${order.status === 'Entregado' ? 'badge-leaf' : 'badge-sand'}`}>{order.status}</span>
      </div>
    </article>
  )
}

export default OrderCard
