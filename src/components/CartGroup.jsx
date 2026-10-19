// OJO: este componente ya NO se usa (paso 11b): la API no trae el chef en los ítems del carrito,
// así que la Cesta es una lista simple. Sigue con la forma vieja { plato, cantidad }. No se borra a pedido de la consigna.
// Bloque del carrito con los platos de UN chef y su subtotal. Se usa en views/Carrito.
import CartItem from './CartItem'

// Props:
//  - seller: el chef { id, name, avatarUrl }
//  - items: los ítems del carrito que son de ese chef
//  - onQuantityChange / onRemove: se pasan tal cual a cada CartItem
function CartGroup({ seller, items, onQuantityChange, onRemove }) {
  // Subtotal del chef: calculado con reduce a partir de sus ítems
  const subtotal = items.reduce((acumulado, item) => acumulado + item.plato.price * item.cantidad, 0)
  const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

  return (
    <section className="rounded-xl bg-surface-container-lowest shadow-ambient" aria-label={`Pedido a ${seller.name}`}>
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline px-5 py-4 sm:px-7">
        {/* Si el chef tiene foto la mostramos; si no, sus iniciales */}
        {seller.avatarUrl !== null ? (
          <img src={seller.avatarUrl} alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
        ) : (
          <span
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-surface-container-high text-label-md text-primary"
            aria-hidden="true"
          >
            {seller.name[0]}
          </span>
        )}
        <h2 className="min-w-[9rem] flex-1 font-display text-headline-sm text-primary">{seller.name}</h2>
        <p className="w-full text-body-sm text-on-surface-variant sm:w-auto">
          Subtotal <span className="ml-1 font-display text-[18px] tabular text-primary">{formatear(subtotal)}</span>
        </p>
      </header>
      <ul className="divide-hair px-5 py-5 sm:px-7 sm:py-6">
        {items.map((item) => (
          <CartItem key={item.plato.id} item={item} onQuantityChange={onQuantityChange} onRemove={onRemove} />
        ))}
      </ul>
    </section>
  )
}

export default CartGroup
