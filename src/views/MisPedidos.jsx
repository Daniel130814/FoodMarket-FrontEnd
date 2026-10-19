// Vista de Mis pedidos (ruta /pedidos). Se abre al confirmar el pedido en el checkout.
// Muestra los pedidos del cliente en dos pestañas (En curso / Anteriores) y permite cancelar los pendientes.
import { useState } from 'react'
import OrderCard from '../components/OrderCard'
import Tabs from '../components/Tabs'
import Dialog from '../components/Dialog'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// MAPEO de los estados de la API a los textos que ve el cliente. Es un objeto usado como
// "diccionario": ETIQUETAS_ESTADO['EN_PREPARACION'] devuelve 'Cocinando'.
// CANCELADO no está acá a propósito: se muestra aparte, con su propio badge.
const ETIQUETAS_ESTADO = {
  PENDIENTE: 'Pendiente de confirmación',
  CONFIRMADO: 'Recibido',
  EN_PREPARACION: 'Cocinando',
  ENVIADO: 'En camino',
  ENTREGADO: 'Entregado',
}

// Los estados del seguimiento, en el orden en que avanza un pedido (así lo define la API).
const ORDEN_ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO']

// Los pasos que dibuja OrderTrack: cada estado con su texto amigable.
const PASOS_SEGUIMIENTO = ORDEN_ESTADOS.map((estado) => ({ estado, etiqueta: ETIQUETAS_ESTADO[estado] }))

// Props:
//  - pedidos: todos los pedidos del cliente, con la forma de OrderResponse de la API
//  - onCancelOrder: función (pedidoId) de App. La vista solo avisa "confirmaron cancelar este
//    pedido"; App cambia el estado del pedido a CANCELADO y muestra el aviso.
function MisPedidos({ pedidos, onCancelOrder }) {
  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos en
  // "no cargando" y "sin error". Solo desestructuramos el primer valor: el setter (setCargando /
  // setError) se agrega en el paso 12, cuando haya un fetch que los cambie.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // ESTADO: pestaña activa. 'curso' o 'anteriores'.
  const [pestana, setPestana] = useState('curso')

  // ESTADO del diálogo de cancelación: el id del pedido que se quiere cancelar, o null si el
  // diálogo está cerrado. Un solo estado sirve para "¿está abierto?" y "¿cuál pedido?".
  const [pedidoACancelarId, setPedidoACancelarId] = useState(null)

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando tus pedidos..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // VALORES CALCULADOS a partir de la prop pedidos y del estado (no se guardan aparte):
  //  1) ordenados: copia con [...pedidos] (sort modifica el array, y las props no se modifican),
  //     de más nuevo a más viejo. Las fechas ISO se pueden comparar como texto.
  //  2) enCurso: todo lo que NO terminó (ni entregado ni cancelado).
  //  3) anteriores: lo que ya terminó (entregado o cancelado).
  const ordenados = [...pedidos].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  const enCurso = ordenados.filter((pedido) => pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO')
  const anteriores = ordenados.filter((pedido) => pedido.estado === 'ENTREGADO' || pedido.estado === 'CANCELADO')
  const pedidosVisibles = pestana === 'curso' ? enCurso : anteriores

  const pestanas = [
    { id: 'curso', label: 'En curso', count: enCurso.length },
    { id: 'anteriores', label: 'Anteriores', count: anteriores.length },
  ]

  // Al confirmar el diálogo: le avisamos a App qué pedido cancelar y cerramos el diálogo.
  const confirmarCancelacion = () => {
    onCancelOrder(pedidoACancelarId)
    setPedidoACancelarId(null)
  }

  return (
    <>
      <h1 className="font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Mis pedidos</h1>
      <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">
        Seguí lo que se está cocinando y revisá tus pedidos anteriores.
      </p>

      <div className="mt-10">
        <Tabs tabs={pestanas} activeId={pestana} onChange={setPestana} label="Pedidos" />

        <div role="tabpanel" className="mt-8 space-y-6">
          {/* Renderizado condicional: si la pestaña no tiene pedidos, lo decimos */}
          {pedidosVisibles.length === 0 && (
            <p className="text-body-md text-on-surface-variant">
              {pestana === 'curso' ? 'No tenés pedidos en curso.' : 'Todavía no tenés pedidos anteriores.'}
            </p>
          )}
          {/* map dibuja una tarjeta por pedido; key usa su id único y estable. */}
          {pedidosVisibles.map((pedido) => (
            <OrderCard
              key={pedido.id}
              order={pedido}
              steps={PASOS_SEGUIMIENTO}
              onCancel={setPedidoACancelarId}
            />
          ))}
        </div>
      </div>

      {/* Diálogo de confirmación, controlado por estado: se abre cuando pedidoACancelarId tiene un id */}
      <Dialog
        open={pedidoACancelarId !== null}
        title={`¿Cancelar el pedido n.º ${pedidoACancelarId}?`}
        message="Se repone el stock de los platos. Solo se puede cancelar mientras el pedido está pendiente de confirmación."
        confirmLabel="Cancelar pedido"
        cancelLabel="Mantener pedido"
        onConfirm={confirmarCancelacion}
        onCancel={() => setPedidoACancelarId(null)}
      />
    </>
  )
}

export default MisPedidos
