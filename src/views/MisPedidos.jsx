// Vista de Mis pedidos (ruta /pedidos). Se abre al confirmar el pedido en el checkout.
// Muestra los pedidos del cliente en dos pestañas (En curso / Anteriores) y permite cancelar los pendientes.
import { useEffect, useState } from 'react'
import OrderCard from '../components/pedidos/OrderCard'
import Tabs from '../components/comunes/Tabs'
import Dialog from '../components/comunes/Dialog'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'

// URL base del backend (se lee del archivo .env, igual que en App).
const API_URL = import.meta.env.VITE_API_URL

// Texto de un error de fetch para mostrárselo al usuario. Si el servidor RESPONDIÓ con un error (400, 403...)
// usamos su "message". Si ni siquiera llegamos al servidor (apagado, sin red), fetch rechaza la promesa con
// un error SIN status y el texto del navegador ("Failed to fetch") no le sirve a nadie: damos uno claro.
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// GET de una ruta PRIVADA: lleva el token. Devuelve una promesa con el "data" de la respuesta (las
// listas vacías llegan como null, por eso el ?? []) o lanza un Error con el message del backend y el
// status HTTP. Es una función común (no un hook): recibe datos y devuelve una promesa.
const pedirPrivado = (ruta, token) =>
  fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${token}` } }).then((response) =>
    response.json().then((cuerpo) => {
      if (!response.ok) {
        const fallo = new Error(cuerpo.message)
        fallo.status = response.status
        throw fallo
      }
      return cuerpo.data ?? []
    })
  )

// Medios de pago de la API (enum MedioPago) con el texto que ve el cliente.
const MEDIOS_PAGO = [
  { valor: 'TARJETA_CREDITO', etiqueta: 'Tarjeta de crédito' },
  { valor: 'TARJETA_DEBITO', etiqueta: 'Tarjeta de débito' },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
]

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
//  - token: el JWT de la sesión, para las llamadas privadas (GET /orders y /pagos, PATCH cancelar, POST pago)
//  - onSesionVencida: función () de App que cierra la sesión; se llama cuando el backend responde 401
//  - onAviso: función (texto) de App para mostrar un Toast
function MisPedidos({ token, onSesionVencida, onAviso }) {
  // ESTADO: los pedidos del cliente, con la forma de OrderResponse de la API. Viven acá porque solo
  // esta vista los usa: los pide al montarse y los actualiza al cancelar.
  const [pedidos, setPedidos] = useState([])

  // ESTADO: los pagos del cliente (PagoResponse). Un pedido puede tener varios (por ejemplo uno rechazado
  // y un reintento). Se piden junto con los pedidos y se actualizan al pagar.
  const [pagos, setPagos] = useState([])

  // ESTADOS de carga y error del GET. Arranca cargando.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ESTADO: pestaña activa. 'curso' o 'anteriores'.
  const [pestana, setPestana] = useState('curso')

  // ESTADO del diálogo de cancelación: el id del pedido que se quiere cancelar, o null si el
  // diálogo está cerrado. Un solo estado sirve para "¿está abierto?" y "¿cuál pedido?".
  const [pedidoACancelarId, setPedidoACancelarId] = useState(null)

  // ESTADOS del diálogo de pago: el id del pedido que se quiere pagar (null = cerrado) y el medio de pago
  // elegido en el selector.
  const [pedidoAPagarId, setPedidoAPagarId] = useState(null)
  const [medioPago, setMedioPago] = useState('TARJETA_CREDITO')

  // ESTADOS del diálogo de reseña: el plato que se quiere reseñar (el detalle del pedido, o null = cerrado),
  // la calificación y el comentario que escribe el cliente (todo texto: viene de inputs).
  const [platoAResenar, setPlatoAResenar] = useState(null)
  const [calificacion, setCalificacion] = useState('5')
  const [comentario, setComentario] = useState('')

  // ESTADO: ids de los platos que el cliente ya reseñó. La API no tiene "mis reseñas", así que anotamos los
  // que reseñó en esta sesión (y los que la API avisó que ya tenían reseña, con un 409).
  const [platosResenados, setPlatosResenados] = useState([])

  // GET /orders y GET /pagos al abrir la vista. Rutas privadas: llevan el token. Devuelven solo lo de este
  // cliente. Promise.all espera a que lleguen LOS DOS y entrega los resultados juntos (mismo orden).
  // Dependencias [token]: no se repite mientras no cambie la sesión.
  useEffect(() => {
    Promise.all([pedirPrivado('/orders', token), pedirPrivado('/pagos', token)])
      .then(([listaPedidos, listaPagos]) => {
        setPedidos(listaPedidos)
        setPagos(listaPagos)
      })
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
  }, [token])

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando tus pedidos..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Último pago de un pedido (el más nuevo por fecha) o null si no tiene. filter se queda con los pagos de
  // ese pedido; sort los ordena del más nuevo al más viejo (sobre la copia que devolvió filter, que es un
  // array nuevo) y [0] toma el primero. Las fechas ISO se pueden comparar como texto.
  const ultimoPago = (pedidoId) => {
    const delPedido = pagos
      .filter((pago) => pago.pedidoId === pedidoId)
      .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
    return delPedido.length === 0 ? null : delPedido[0]
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
        onAviso(mensajeDe(fallo))
      })
  }

  // Abre el diálogo de pago para ese pedido, con el medio de pago por defecto.
  const abrirPago = (pedidoId) => {
    setMedioPago('TARJETA_CREDITO')
    setPedidoAPagarId(pedidoId)
  }

  // Al confirmar el diálogo: POST /pagos/createPago { medioPago, pedidoId } (paso 14a). Es una escritura:
  // va en el handler. El monto lo fija el servidor (precioFinal del pedido) y el pago nace PENDIENTE: lo
  // aprueba un ADMIN. Con el pago que devuelve el backend lo sumamos a la lista, SIN volver a pedir todo.
  // Cerramos el diálogo ENSEGUIDA (antes del fetch): así el botón desaparece y un segundo clic no puede
  // crear un pago duplicado.
  const confirmarPago = () => {
    const pedidoId = pedidoAPagarId
    setPedidoAPagarId(null)

    fetch(`${API_URL}/pagos/createPago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({ medioPago, pedidoId }),
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
      .then((creado) => {
        setPagos((actuales) => [...actuales, creado])
        onAviso(`Registramos tu pago del pedido n.º ${pedidoId}. Falta que lo aprueben.`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 409 (ya hay un pago aprobado o el pedido está cancelado), 400 (pagos bloqueados), 403, 404.
        onAviso(mensajeDe(fallo))
      })
  }

  // Abre el diálogo de reseña para ese plato (detalle del pedido), con la calificación y el comentario en limpio.
  const abrirResena = (detalle) => {
    setCalificacion('5')
    setComentario('')
    setPlatoAResenar(detalle)
  }

  // Al confirmar el diálogo: POST /resenas/createResena { calificacion, comentario, platoId } (paso 14d).
  // Es una escritura: va en el handler. Cerramos el diálogo ENSEGUIDA para que un segundo clic no cree
  // una reseña duplicada. El comentario es opcional: vacío lo omitimos (JSON.stringify ignora undefined).
  // Errores de la API: 400 (el plato no fue comprado en un subpedido entregado) y 409 (ya lo reseñaste).
  const confirmarResena = () => {
    const { platoId, platoNombre } = platoAResenar
    setPlatoAResenar(null)

    fetch(`${API_URL}/resenas/createResena`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({
        calificacion: Number(calificacion),
        comentario: comentario.trim() === '' ? undefined : comentario.trim(),
        platoId,
      }),
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
      .then(() => {
        setPlatosResenados((actuales) => [...actuales, platoId])
        onAviso(`Gracias por tu reseña de ${platoNombre}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 409: ya existía una reseña de este plato; lo marcamos como reseñado para no ofrecer el botón de nuevo.
        if (fallo.status === 409) {
          setPlatosResenados((actuales) => [...actuales, platoId])
        }
        onAviso(mensajeDe(fallo))
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
              payment={ultimoPago(pedido.id)}
              reviewedPlatoIds={platosResenados}
              onCancel={setPedidoACancelarId}
              onPay={abrirPago}
              onReview={abrirResena}
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

      {/* Diálogo de reseña: children = la calificación (1 a 5) y el comentario. Controlado por estado
          (platoAResenar). Mientras está cerrado pasamos un título vacío: Dialog no dibuja nada si open es false. */}
      <Dialog
        open={platoAResenar !== null}
        title={platoAResenar === null ? '' : `Reseñar ${platoAResenar.platoNombre}`}
        message="Contale a otros cómo estuvo. Solo podés dejar una reseña por plato."
        confirmLabel="Publicar reseña"
        confirmVariant="primary"
        cancelLabel="Volver"
        onConfirm={confirmarResena}
        onCancel={() => setPlatoAResenar(null)}
      >
        <label className="label mt-5" htmlFor="calificacion">Calificación</label>
        <select id="calificacion" className="field" value={calificacion} onChange={(event) => setCalificacion(event.target.value)}>
          <option value="5">5 · Excelente</option>
          <option value="4">4 · Muy bueno</option>
          <option value="3">3 · Bueno</option>
          <option value="2">2 · Regular</option>
          <option value="1">1 · Malo</option>
        </select>
        <label className="label mt-4" htmlFor="comentario">Comentario (opcional)</label>
        <textarea id="comentario" className="field" value={comentario} onChange={(event) => setComentario(event.target.value)} />
      </Dialog>

      {/* Diálogo de pago: children = el selector del medio de pago. Controlado por estado (pedidoAPagarId). */}
      <Dialog
        open={pedidoAPagarId !== null}
        title={`Pagar el pedido n.º ${pedidoAPagarId}`}
        message="Elegí cómo vas a pagar. Registramos el pago y queda pendiente hasta que lo aprueben."
        confirmLabel="Registrar pago"
        confirmVariant="primary"
        cancelLabel="Volver"
        onConfirm={confirmarPago}
        onCancel={() => setPedidoAPagarId(null)}
      >
        <label className="label mt-5" htmlFor="medioPago">Medio de pago</label>
        <select id="medioPago" className="field" value={medioPago} onChange={(event) => setMedioPago(event.target.value)}>
          {MEDIOS_PAGO.map((medio) => (
            <option key={medio.valor} value={medio.valor}>{medio.etiqueta}</option>
          ))}
        </select>
      </Dialog>
    </>
  )
}

export default MisPedidos
