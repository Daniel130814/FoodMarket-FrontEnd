// Vista de Mis pedidos (ruta /pedidos). Se abre al confirmar el carrito.
// Muestra los grupos de ejemplo que recibe de App, sin estado propio.
import OrderCard from '../components/OrderCard'

// Props:
//  - ordersInProgress: pedidos en curso, con sus platos y estado actual.
//  - previousOrders: pedidos anteriores, ya separados por el padre.
function MisPedidos({ ordersInProgress, previousOrders }) {
  return (
    <>
      <h1 className="font-display text-headline-lg text-primary">Mis pedidos</h1>
      <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">
        Seguí lo que se está cocinando y volvé a pedir tus favoritos.
      </p>

      <section className="mt-10" aria-labelledby="h-curso">
        <h2 id="h-curso" className="font-display text-headline-md text-primary">En curso</h2>
        <div className="mt-6 space-y-6">
          {/* map dibuja una tarjeta por pedido; key usa su id único y estable. */}
          {ordersInProgress.map((pedido) => (
            <OrderCard key={pedido.id} order={pedido} />
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="h-anteriores">
        <h2 id="h-anteriores" className="font-display text-headline-md text-primary">Anteriores</h2>
        <div className="mt-6 space-y-6">
          {previousOrders.map((pedido) => (
            <OrderCard key={pedido.id} order={pedido} />
          ))}
        </div>
      </section>
    </>
  )
}

export default MisPedidos
