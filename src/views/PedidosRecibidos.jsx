// Pedidos recibidos (/pedidos-recibidos, solo CHEF): sus subpedidos (uno por chef en cada pedido), que avanza paso a paso.
import { useEffect, useState } from 'react'
import SubPedidoCard from '../components/pedidos/SubPedidoCard'
import Tabs from '../components/comunes/Tabs'
import Dialog from '../components/comunes/Dialog'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'

const API_URL = import.meta.env.VITE_API_URL

// Mensaje de un error de fetch: el del backend, o uno claro si no hubo respuesta (el error no tiene status).
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// Devuelve `data` o lanza un Error con message y status (fetch no manda los errores HTTP al .catch).
const leerRespuesta = (response) =>
  response.json().then((cuerpo) => {
    if (!response.ok) {
      const fallo = new Error(cuerpo.message)
      fallo.status = response.status
      throw fallo
    }
    return cuerpo.data
  })

// Estado -> texto, igual que ve el cliente. CANCELADO no está: se muestra aparte, con su propio badge.
const ETIQUETAS_ESTADO = {
  PENDIENTE: 'Pendiente de confirmación',
  CONFIRMADO: 'Recibido',
  EN_PREPARACION: 'Cocinando',
  ENVIADO: 'En camino',
  ENTREGADO: 'Entregado',
}

// Estados del seguimiento, en el orden en que avanza un pedido.
const ORDEN_ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO']

// Pasos que dibuja OrderTrack.
const PASOS_SEGUIMIENTO = ORDEN_ESTADOS.map((estado) => ({ estado, etiqueta: ETIQUETAS_ESTADO[estado] }))

// Siguiente paso y texto del botón por estado. PENDIENTE no está (hasta que un ADMIN apruebe el pago da 409); ENTREGADO y CANCELADO ya terminaron.
const ACCIONES = {
  CONFIRMADO: { siguiente: 'EN_PREPARACION', boton: 'Empezar a cocinar' },
  EN_PREPARACION: { siguiente: 'ENVIADO', boton: 'Marcar en camino' },
  ENVIADO: { siguiente: 'ENTREGADO', boton: 'Marcar entregado' },
}

// Props: token (JWT), userId (del chef; en la API el chefId es el id de su usuario), onSesionVencida (401), onAviso (Toast).
function PedidosRecibidos({ token, userId, onSesionVencida, onAviso }) {
  // TODO(backend): el subpedido no trae el número de pedido, la fecha ni el cliente; se muestra solo su id.
  const [subPedidos, setSubPedidos] = useState([])

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [pestana, setPestana] = useState('curso')

  // Diálogo de confirmación: el subpedido a avanzar, o null si está cerrado.
  const [subPedidoAAvanzar, setSubPedidoAAvanzar] = useState(null)

  // Al abrir: GET /subpedidos/chef/{userId} (un chef solo puede pedir los suyos; si no, 403).
  useEffect(() => {
    fetch(`${API_URL}/subpedidos/chef/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(leerRespuesta)
      .then((data) => setSubPedidos(data ?? [])) // lista vacía llega como null
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setError(mensajeDe(fallo))
      })
      .finally(() => setCargando(false))
    // onSesionVencida queda afuera de las dependencias: App la recrea en cada render y el GET se repetiría.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId])

  if (cargando) {
    return <LoadingState message="Cargando tus pedidos recibidos..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Avanza el subpedido (PATCH /subpedidos/{id}/estado). El diálogo se cierra enseguida para que un segundo clic no repita la acción.
  const confirmarAvance = () => {
    const subPedido = subPedidoAAvanzar
    const siguiente = ACCIONES[subPedido.estado].siguiente
    setSubPedidoAAvanzar(null)

    fetch(`${API_URL}/subpedidos/${subPedido.id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({ estado: siguiente }),
    })
      .then(leerRespuesta)
      .then((avanzado) => {
        setSubPedidos((actuales) => actuales.map((s) => (s.id === avanzado.id ? avanzado : s)))
        onAviso(`El subpedido n.º ${avanzado.id} ahora está: ${ETIQUETAS_ESTADO[avanzado.estado]}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        onAviso(mensajeDe(fallo), 'error')
      })
  }

  // De más nuevo a más viejo (el id crece con el tiempo; se ordena una copia) y separados en curso y anteriores.
  const ordenados = [...subPedidos].sort((a, b) => b.id - a.id)
  const enCurso = ordenados.filter((s) => s.estado !== 'ENTREGADO' && s.estado !== 'CANCELADO')
  const anteriores = ordenados.filter((s) => s.estado === 'ENTREGADO' || s.estado === 'CANCELADO')
  const visibles = pestana === 'curso' ? enCurso : anteriores

  const pestanas = [
    { id: 'curso', label: 'En curso', count: enCurso.length },
    { id: 'anteriores', label: 'Anteriores', count: anteriores.length },
  ]

  return (
    <>
      <h1 className="font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Pedidos recibidos</h1>
      <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">
        Los platos que te pidieron. Avanzá cada pedido a medida que lo cocinás y lo entregás.
      </p>

      <div className="mt-10">
        <Tabs tabs={pestanas} activeId={pestana} onChange={setPestana} label="Pedidos recibidos" />

        <div role="tabpanel" className="mt-8 space-y-6">
          {visibles.length === 0 && (
            <p className="text-body-md text-on-surface-variant">
              {pestana === 'curso' ? 'No tenés pedidos en curso.' : 'Todavía no tenés pedidos anteriores.'}
            </p>
          )}
          {/* accion: el botón del paso siguiente, o null si no se puede avanzar desde ese estado */}
          {visibles.map((subPedido) => (
            <SubPedidoCard
              key={subPedido.id}
              subPedido={subPedido}
              steps={PASOS_SEGUIMIENTO}
              accion={ACCIONES[subPedido.estado] ?? null}
              onAdvance={setSubPedidoAAvanzar}
            />
          ))}
        </div>
      </div>

      {/* Diálogo: avanzar no se puede deshacer. Cerrado, los textos van vacíos (Dialog no dibuja nada con open en false) */}
      <Dialog
        open={subPedidoAAvanzar !== null}
        title={subPedidoAAvanzar === null ? '' : `${ACCIONES[subPedidoAAvanzar.estado].boton}: subpedido n.º ${subPedidoAAvanzar.id}`}
        message="El cliente va a ver el nuevo estado en su pedido. No se puede volver atrás."
        confirmLabel={subPedidoAAvanzar === null ? '' : ACCIONES[subPedidoAAvanzar.estado].boton}
        confirmVariant="primary"
        cancelLabel="Volver"
        onConfirm={confirmarAvance}
        onCancel={() => setSubPedidoAAvanzar(null)}
      />
    </>
  )
}

export default PedidosRecibidos
