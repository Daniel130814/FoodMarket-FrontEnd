// Vista de pedidos recibidos del chef (ruta /pedidos-recibidos, solo rol CHEF). Muestra los subpedidos que
// le tocan (cada pedido se reparte en un subpedido por chef) y le permite avanzarlos paso a paso:
// Recibido > Cocinando > En camino > Entregado. El cliente ve cada avance en Mis pedidos.
import { useEffect, useState } from 'react'
import SubPedidoCard from '../components/SubPedidoCard'
import Tabs from '../components/Tabs'
import Dialog from '../components/Dialog'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// URL base del backend (se lee del archivo .env, igual que en App).
const API_URL = import.meta.env.VITE_API_URL

// Texto de un error de fetch para mostrárselo al usuario. Si el servidor RESPONDIÓ con un error (400, 403...)
// usamos su "message". Si ni siquiera llegamos al servidor (apagado, sin red), fetch rechaza la promesa con
// un error SIN status y el texto del navegador ("Failed to fetch") no le sirve a nadie: damos uno claro.
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// MAPEO de los estados de la API a los textos que se muestran (el mismo que ve el cliente).
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

// Qué se puede hacer desde cada estado: el siguiente paso y el texto del botón. Es un objeto usado como
// "diccionario". PENDIENTE no está: la API no deja avanzar hasta que un ADMIN apruebe el pago (da 409).
// ENTREGADO y CANCELADO tampoco: ya terminaron.
const ACCIONES = {
  CONFIRMADO: { siguiente: 'EN_PREPARACION', boton: 'Empezar a cocinar' },
  EN_PREPARACION: { siguiente: 'ENVIADO', boton: 'Marcar en camino' },
  ENVIADO: { siguiente: 'ENTREGADO', boton: 'Marcar entregado' },
}

// Props:
//  - token: el JWT de la sesión (rutas privadas)
//  - userId: el id del chef que inició sesión (en la API el chefId es el id de su usuario)
//  - onSesionVencida: función () de App que cierra la sesión; se llama cuando el backend responde 401
//  - onAviso: función (texto) de App para mostrar un Toast
function PedidosRecibidos({ token, userId, onSesionVencida, onAviso }) {
  // ESTADO: los subpedidos de este chef, con la forma de SubPedidoChefResponse de la API.
  // TODO(backend): el subpedido no trae el número de pedido, la fecha ni el cliente; mostramos solo su id.
  const [subPedidos, setSubPedidos] = useState([])

  // ESTADOS de carga y error del GET. Arranca cargando.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ESTADO: pestaña activa. 'curso' o 'anteriores'.
  const [pestana, setPestana] = useState('curso')

  // ESTADO del diálogo: el subpedido que se quiere avanzar, o null si está cerrado.
  const [subPedidoAAvanzar, setSubPedidoAAvanzar] = useState(null)

  // GET /subpedidos/chef/{userId} al abrir la vista. Ruta privada: lleva el token. Un chef solo puede pedir
  // los suyos (si no, 403). Dependencias [token, userId]: no se repite mientras no cambie la sesión.
  useEffect(() => {
    fetch(`${API_URL}/subpedidos/chef/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
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
      .then((data) => setSubPedidos(data ?? [])) // lista vacía llega como null
      .catch((fallo) => {
        // 401: el token ya no sirve; App cierra la sesión y la ruta protegida nos manda a /ingreso.
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setError(mensajeDe(fallo))
      })
      .finally(() => setCargando(false))
    // onSesionVencida queda afuera de las dependencias a propósito (App la crea de nuevo en cada render
    // y el GET se repetiría sin parar). Se resuelve con useCallback cuando se vea en clase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId])

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState y useEffect) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando tus pedidos recibidos..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Al confirmar el diálogo: PATCH /subpedidos/{id}/estado { estado } (paso 14c). Es una escritura: va en el
  // handler. La API devuelve el subpedido ya avanzado; con él reemplazamos el de la lista (map), SIN volver
  // a pedir todos. Cerramos el diálogo ENSEGUIDA para que un segundo clic no repita la acción.
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
      .then((avanzado) => {
        setSubPedidos((actuales) => actuales.map((s) => (s.id === avanzado.id ? avanzado : s)))
        onAviso(`El subpedido n.º ${avanzado.id} ahora está: ${ETIQUETAS_ESTADO[avanzado.estado]}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 409 (transición inválida o pedido todavía sin pago aprobado), 403, 404: mensaje del backend.
        onAviso(mensajeDe(fallo))
      })
  }

  // VALORES CALCULADOS (no se guardan aparte): de más nuevo a más viejo (el id crece con el tiempo),
  // separados en lo que sigue en curso y lo que ya terminó. [...subPedidos] copia el array porque sort
  // modifica el original y el estado nunca se modifica.
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
          {/* Renderizado condicional: si la pestaña no tiene subpedidos, lo decimos */}
          {visibles.length === 0 && (
            <p className="text-body-md text-on-surface-variant">
              {pestana === 'curso' ? 'No tenés pedidos en curso.' : 'Todavía no tenés pedidos anteriores.'}
            </p>
          )}
          {/* map dibuja una tarjeta por subpedido; key = id, único y estable.
              accion: el botón del paso siguiente, o null si no se puede avanzar desde ese estado. */}
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

      {/* Diálogo de confirmación, controlado por estado: avanzar no se puede deshacer. Mientras está
          cerrado (subPedidoAAvanzar === null) pasamos textos vacíos: Dialog no dibuja nada si open es false. */}
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
