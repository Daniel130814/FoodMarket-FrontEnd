// Vista del carrito (ruta /cesta). Lee el carrito que le pasa App y lo muestra como una lista simple.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CartItem from '../components/CartItem'
import OrderSummary from '../components/OrderSummary'
import EmptyState from '../components/EmptyState'
import Alert from '../components/Alert'
import PLATOS_EJEMPLO from '../data/platosEjemplo'

// Costo de envío fijo de ejemplo (en el diseño es $3.200). Más adelante lo calcula el backend.
const ENVIO = 3200

// Props (todas vienen de App, que es la dueña del estado del carrito):
//  - carrito: { id, items, totalEstimado } con la forma de CarritoResponse de la API
//  - cartCount: total de unidades (ya calculado por App)
//  - onQuantityChange: función (itemId, nuevaCantidad); App aplica las reglas de stock
//  - onRemove: función (itemId) para quitar un ítem
//  - onClear: función sin argumentos para vaciar el carrito al confirmar el pedido
function Carrito({ carrito, cartCount, onQuantityChange, onRemove, onClear }) {
  // Desestructuración: sacamos del carrito las dos partes que usa la vista.
  const { items, totalEstimado } = carrito

  const navigate = useNavigate()

  // Estado: mensajes de conflicto de stock al confirmar. Lista vacía = sin conflictos.
  // Va antes del return de "carrito vacío" porque los hooks siempre se llaman primero.
  const [conflictos, setConflictos] = useState([])

  // Confirmar pedido (versión sin backend). Revisa que cada ítem siga teniendo stock.
  // TEMPORAL: en producción esto lo valida el backend al hacer el checkout (responde 400 si no
  // hay stock) y esta revisión en el front se elimina.
  const confirmar = () => {
    // Por cada ítem buscamos el plato "actual" en los datos de ejemplo. El ítem del carrito no trae
    // el stock (la API no lo manda), así que lo consultamos acá por platoId.
    // La regla de la profe pide .map() para recorrer (nunca forEach), así que lo hacemos en 2 pasos:
    //  1) .map() convierte CADA ítem en un mensaje de conflicto, o en null si está todo bien.
    //  2) .filter() descarta los null y deja solo los conflictos reales.
    // Ventaja: no hay que ir mutando un array de afuera con push; el resultado sale de la cadena.
    const mensajes = items
      .map((item) => {
        const actual = PLATOS_EJEMPLO.find((p) => p.id === item.platoId)
        const disponible = actual === undefined ? 0 : actual.stockDisponible

        if (disponible === 0) {
          return `${item.nombrePlato} se agotó.`
        }
        if (item.cantidad > disponible) {
          return `De ${item.nombrePlato} quedan ${disponible} y pediste ${item.cantidad}.`
        }
        // Sin conflicto: devolvemos null para que el filter lo saque
        return null
      })
      .filter((mensaje) => mensaje !== null)

    if (mensajes.length > 0) {
      // Hay conflicto: lo mostramos y NO confirmamos.
      setConflictos(mensajes)
      return
    }

    // Todo bien: limpiamos avisos, vaciamos el carrito y vamos a "Mis pedidos".
    setConflictos([])
    onClear()
    navigate('/pedidos')
  }

  // Carrito vacío: mostramos el EmptyState y cortamos acá.
  if (items.length === 0) {
    return (
      <EmptyState
        title="Tu carrito está vacío"
        message="Sumá platos de los chefs de tu barrio y los armamos para entregártelos hoy."
        actionLabel="Ver platos de hoy"
        onAction={() => navigate('/catalogo')}
      />
    )
  }

  return (
    <>
      <Link to="/catalogo" className="inline-flex min-h-[44px] items-center gap-1 text-label-lg text-on-surface-variant hover:text-primary">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
        Seguir explorando
      </Link>
      <h1 className="mt-4 font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Tu carrito</h1>

      {/* Renderizado condicional: el aviso solo aparece si hay conflictos */}
      {conflictos.length > 0 && (
        <div className="mt-6">
          <Alert title="No pudimos confirmar tu pedido" messages={conflictos} />
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          {/* Lista simple de ítems (la API no trae el chef en los ítems, así que no se agrupa).
              map: un CartItem por ítem. key = id del ítem, único y estable. */}
          <ul className="divide-hair rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-7">
            {items.map((item) => (
              <CartItem key={item.id} item={item} onQuantityChange={onQuantityChange} onRemove={onRemove} />
            ))}
          </ul>
        </div>
        <div className="lg:col-span-4">
          <OrderSummary units={cartCount} subtotal={totalEstimado} shipping={ENVIO} onConfirm={confirmar} />
        </div>
      </div>
    </>
  )
}

export default Carrito
