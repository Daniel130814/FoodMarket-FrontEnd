// Vista de la cesta (ruta /cesta). Lee la cesta que le pasa App y la muestra como una lista simple.
// Desde acá se sigue al checkout (/checkout), donde se elige el domicilio y se confirma el pedido.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CartItem from '../components/cesta/CartItem'
import OrderSummary from '../components/cesta/OrderSummary'
import EmptyState from '../components/comunes/EmptyState'
import Dialog from '../components/comunes/Dialog'

// Costo de envío fijo de ejemplo (en el diseño es $3.200). Más adelante lo calcula el backend.
const ENVIO = 3200

// Props (todas vienen de App, que es la dueña del estado de la cesta):
//  - carrito: { id, items, totalEstimado } con la forma de CarritoResponse de la API
//  - cartCount: total de unidades (ya calculado por App)
//  - onQuantityChange: función (itemId, nuevaCantidad); App aplica las reglas de stock
//  - onRemove: función (itemId) para quitar un ítem
//  - onClear: función () para vaciar toda la cesta (DELETE /carrito); App la ejecuta al confirmar el diálogo
function Carrito({ carrito, cartCount, onQuantityChange, onRemove, onClear }) {
  const navigate = useNavigate()

  // Estado local de UI: si el diálogo de "Vaciar cesta" está abierto. Va ANTES del return de la
  // cesta vacía porque los hooks no pueden quedar dentro de un condicional.
  const [confirmandoVaciar, setConfirmandoVaciar] = useState(false)

  // Desestructuración: sacamos del carrito las dos partes que usa la vista.
  const { items, totalEstimado } = carrito

  // Cesta vacía: mostramos el EmptyState y cortamos acá.
  if (items.length === 0) {
    return (
      <EmptyState
        title="Tu cesta está vacía"
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
      <h1 className="mt-4 font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Tu cesta</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          {/* Lista simple de ítems (la API no trae el chef en los ítems, así que no se agrupa).
              map: un CartItem por ítem. key = id del ítem, único y estable. */}
          <ul className="divide-hair rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-7">
            {items.map((item) => (
              <CartItem key={item.id} item={item} onQuantityChange={onQuantityChange} onRemove={onRemove} />
            ))}
          </ul>
          {/* Vaciar toda la cesta: abre el diálogo de confirmación */}
          <button type="button" className="btn btn-quiet mt-4" onClick={() => setConfirmandoVaciar(true)}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete_sweep</span>
            Vaciar cesta
          </button>
        </div>
        <div className="lg:col-span-4">
          <OrderSummary
            units={cartCount}
            subtotal={totalEstimado}
            shipping={ENVIO}
            onConfirm={() => navigate('/checkout')}
            buttonLabel="Continuar con la compra"
          />
        </div>
      </div>

      {/* Diálogo de confirmación, controlado por estado. Al confirmar se vacía y se cierra. */}
      <Dialog
        open={confirmandoVaciar}
        title="¿Vaciar tu cesta?"
        message="Se van a quitar todos los platos que agregaste."
        confirmLabel="Vaciar cesta"
        cancelLabel="Mantener"
        onConfirm={() => {
          onClear()
          setConfirmandoVaciar(false)
        }}
        onCancel={() => setConfirmandoVaciar(false)}
      />
    </>
  )
}

export default Carrito
