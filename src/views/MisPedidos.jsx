// Vista de Mis pedidos (ruta /pedidos). Se abre al confirmar el carrito.
// Muestra los grupos de ejemplo que recibe de App. Solo tiene estado de carga y error.
import { useState } from 'react'
import OrderCard from '../components/OrderCard'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// Props:
//  - ordersInProgress: pedidos en curso, con sus platos y estado actual.
//  - previousOrders: pedidos anteriores, ya separados por el padre.
function MisPedidos({ ordersInProgress, previousOrders }) {
  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos en
  // "no cargando" y "sin error". Solo desestructuramos el primer valor: el setter (setCargando /
  // setError) se agrega en el paso 12, cuando haya un fetch que los cambie.
  //  - cargando: true mientras esperamos la respuesta de la API.
  //  - error: null si todo está bien, o el texto del error si la API falló.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando tus pedidos..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

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
