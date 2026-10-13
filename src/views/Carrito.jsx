// Vista del carrito (ruta /carrito). Lee el carrito compartido y lo muestra agrupado por chef.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import CartGroup from '../components/CartGroup'
import OrderSummary from '../components/OrderSummary'
import EmptyState from '../components/EmptyState'
import Alert from '../components/Alert'
import PLATOS_EJEMPLO from '../data/platosEjemplo'

// Costo de envío fijo de ejemplo (en el diseño es $3.200). Más adelante lo calcula el backend.
const ENVIO = 3200

function Carrito() {
  const navigate = useNavigate()

  // Todo viene del contexto: los ítems, las acciones y los totales ya calculados.
  const { items, cambiarCantidad, quitar, vaciar, cantidadTotal, subtotal } = useCart()

  // Estado: mensajes de conflicto de stock al confirmar. Lista vacía = sin conflictos.
  // Va antes del return de "carrito vacío" porque los hooks siempre se llaman primero.
  const [conflictos, setConflictos] = useState([])

  // Confirmar pedido (versión sin backend). Revisa que cada ítem siga teniendo stock.
  const confirmar = () => {
    // Por cada ítem buscamos el plato "actual" en los datos de ejemplo. El ítem guarda una
    // copia del plato de cuando se agregó; el stock real puede haber cambiado desde entonces.
    const mensajes = []
    items.forEach((item) => {
      const actual = PLATOS_EJEMPLO.find((p) => p.id === item.plato.id)
      const disponible = actual === undefined ? 0 : actual.stock

      if (disponible === 0) {
        mensajes.push(`${item.plato.title} se agotó.`)
      } else if (item.cantidad > disponible) {
        mensajes.push(`De ${item.plato.title} quedan ${disponible} y pediste ${item.cantidad}.`)
      }
    })

    if (mensajes.length > 0) {
      // Hay conflicto: lo mostramos y NO confirmamos.
      setConflictos(mensajes)
      return
    }

    // Todo bien: limpiamos avisos, vaciamos el carrito y vamos a "Mis pedidos".
    setConflictos([])
    vaciar()
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
              onQuantityChange={cambiarCantidad}
              onRemove={quitar}
            />
          ))}
        </div>
        <div className="lg:col-span-4">
          <OrderSummary units={cantidadTotal} subtotal={subtotal} shipping={ENVIO} onConfirm={confirmar} />
        </div>
      </div>
    </>
  )
}

export default Carrito
