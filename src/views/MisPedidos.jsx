// Vista de Mis pedidos (ruta /pedidos). Se abre al confirmar el pedido en el checkout.
// Muestra los pedidos del cliente en dos pestañas (En curso / Anteriores) y permite cancelar los pendientes.
import { useEffect, useState } from 'react'
import OrderCard from '../components/OrderCard'
import Tabs from '../components/Tabs'
import Dialog from '../components/Dialog'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// URL base del backend (se lee del archivo .env, igual que en App).
const API_URL = import.meta.env.VITE_API_URL

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
//  - token: el JWT de la sesión, para las llamadas privadas (GET /orders y PATCH cancelar)
//  - onSesionVencida: función () de App que cierra la sesión; se llama cuando el backend responde 401
//  - onAviso: función (texto) de App para mostrar un Toast
function MisPedidos({ token, onSesionVencida, onAviso }) {
  // ESTADO: los pedidos del cliente, con la forma de OrderResponse de la API. Viven acá porque solo
  // esta vista los usa: los pide al montarse y los actualiza al cancelar.
  const [pedidos, setPedidos] = useState([])

  // ESTADOS de carga y error del GET. Arranca cargando.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ESTADO: pestaña activa. 'curso' o 'anteriores'.
  const [pestana, setPestana] = useState('curso')

  // ESTADO del diálogo de cancelación: el id del pedido que se quiere cancelar, o null si el
  // diálogo está cerrado. Un solo estado sirve para "¿está abierto?" y "¿cuál pedido?".
  const [pedidoACancelarId, setPedidoACancelarId] = useState(null)

  // GET /orders al abrir la vista (paso 12.5). Ruta privada: lleva el token. Devuelve solo los pedidos
  // de este cliente. Dependencias [token]: no se repite mientras no cambie la sesión.
  useEffect(() => {
    fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      .then((data) => setPedidos(data ?? [])) // lista vacía llega como null
      .catch((fallo) => {
        // 401: el token ya no sirve; App cierra la sesión y la ruta protegida nos manda a /ingreso.
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setError(fallo.message)
      })
      .finally(() => setCargando(false))
    // onSesionVencida queda afuera de las dependencias a propósito (App la crea de nuevo en cada render
    // y el GET se repetiría sin parar). Se resuelve con useCallback cuando se vea en clase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

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

  // Al confirmar el diálogo: PATCH /orders/{id}/cancelar (paso 12.5). Es una escritura: va en el handler.
  // El backend repone el stock y devuelve el pedido ya cancelado; con él reemplazamos el de la lista
  // (map) SIN volver a pedir todos los pedidos. Solo se cancelan los PENDIENTE (si no, 409).
  const confirmarCancelacion = () => {
    const pedidoId = pedidoACancelarId
    setPedidoACancelarId(null)

    fetch(`${API_URL}/orders/${pedidoId}/cancelar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }, // ruta privada, sin body
    })
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      .then((cancelado) => {
        setPedidos((actuales) => actuales.map((pedido) => (pedido.id === cancelado.id ? cancelado : pedido)))
        onAviso(`Cancelaste el pedido n.º ${pedidoId}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 409 (ya no está pendiente), 403, 404: mostramos el mensaje del backend.
        onAviso(fallo.message)
      })
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
