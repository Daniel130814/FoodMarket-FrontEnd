// Vista del carrito (ruta /carrito). Lee el carrito compartido y lo muestra agrupado por chef.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CartGroup from '../components/CartGroup'
import OrderSummary from '../components/OrderSummary'
import EmptyState from '../components/EmptyState'
import Alert from '../components/Alert'
import PLATOS_EJEMPLO from '../data/platosEjemplo'

// Costo de envío fijo de ejemplo (en el diseño es $3.200). Más adelante lo calcula el backend.
const ENVIO = 3200

// Props (todas vienen de App, que es la dueña del estado del carrito):
//  - items: array de { plato, cantidad } con lo que hay en el carrito
//  - cartCount: total de unidades (ya calculado por App)
//  - subtotal: suma de precios (ya calculada por App)
//  - onQuantityChange: función (platoId, nuevaCantidad); App aplica las reglas de stock
//  - onRemove: función (platoId) para quitar un ítem
//  - onClear: función sin argumentos para vaciar el carrito al confirmar el pedido
function Carrito({ items, cartCount, subtotal, onQuantityChange, onRemove, onClear }) {
  const navigate = useNavigate()

  // Estado: mensajes de conflicto de stock al confirmar. Lista vacía = sin conflictos.
  // Va antes del return de "carrito vacío" porque los hooks siempre se llaman primero.
  const [conflictos, setConflictos] = useState([])

  // Confirmar pedido (versión sin backend). Revisa que cada ítem siga teniendo stock.
  const confirmar = () => {
    // Por cada ítem buscamos el plato "actual" en los datos de ejemplo. El ítem guarda una
    // copia del plato de cuando se agregó; el stock real puede haber cambiado desde entonces.
    // La regla de la profe pide .map() para recorrer (nunca forEach), así que lo hacemos en 2 pasos:
    //  1) .map() convierte CADA ítem en un mensaje de conflicto, o en null si está todo bien.
    //  2) .filter() descarta los null y deja solo los conflictos reales.
    // Ventaja: no hay que ir mutando un array de afuera con push; el resultado sale de la cadena.
    const mensajes = items
      .map((item) => {
        const actual = PLATOS_EJEMPLO.find((p) => p.id === item.plato.id)
        const disponible = actual === undefined ? 0 : actual.stock

        if (disponible === 0) {
          return `${item.plato.title} se agotó.`
        }
        if (item.cantidad > disponible) {
          return `De ${item.plato.title} quedan ${disponible} y pediste ${item.cantidad}.`
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

  // AGRUPAR POR CHEF con un solo recorrido. reduce va armando un objeto donde la
  // clave es el id del chef y el valor es { seller, items: [...] }.
  //  - Si el chef todavía no está en el objeto (grupos[id] === undefined), creamos su grupo.
  //  - Después agregamos el ítem a la lista de ese chef.
  // Ejemplo: [ravioli(Matteo), curry(Clara), tagliatelle(Matteo)]
  //   -> { 1: { seller: Matteo, items: [ravioli, tagliatelle] }, 2: { seller: Clara, items: [curry] } }
  const grupos = items.reduce((acumulado, item) => {
    const sellerId = item.plato.seller.id
    if (acumulado[sellerId] === undefined) {
      acumulado[sellerId] = { seller: item.plato.seller, items: [] }
    }
    acumulado[sellerId].items.push(item)
    return acumulado
  }, {})

  // Object.values pasa el objeto a array para poder usar .map. (El push de arriba modifica
  // un objeto que creamos nosotros acá mismo, no el estado de React, así que no hay problema.)
  const listaGrupos = Object.values(grupos)

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
        <div className="space-y-8 lg:col-span-8">
          {listaGrupos.map((grupo) => (
            <CartGroup
              key={grupo.seller.id}
              seller={grupo.seller}
              items={grupo.items}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
            />
          ))}
        </div>
        <div className="lg:col-span-4">
          <OrderSummary units={cartCount} subtotal={subtotal} shipping={ENVIO} onConfirm={confirmar} />
        </div>
      </div>
    </>
  )
}

export default Carrito
