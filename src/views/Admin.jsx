// Vista de administración (ruta /admin, solo rol ADMIN). Por ahora tiene la pestaña de Pagos: el ADMIN
// aprueba o rechaza los pagos que crean los clientes (en la API no hay pasarela: lo hace una persona).
// Al aprobar un pago, el backend pasa el pedido y sus subpedidos a CONFIRMADO y los chefs pueden avanzarlos.
import { useEffect, useState } from 'react'
import Tabs from '../components/Tabs'
import Dialog from '../components/Dialog'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// URL base del backend (se lee del archivo .env, igual que en App).
const API_URL = import.meta.env.VITE_API_URL

// Estados del pago de la API -> texto y color del badge. Es un objeto usado como "diccionario".
const ETIQUETAS_PAGO = {
  PENDIENTE: { texto: 'Pendiente', clase: 'badge-sand' },
  APROBADO: { texto: 'Aprobado', clase: 'badge-leaf' },
  RECHAZADO: { texto: 'Rechazado', clase: 'badge-terra' },
  REEMBOLSADO: { texto: 'Reembolsado', clase: 'badge-mute' },
}

// Medios de pago de la API (enum MedioPago) con el texto que se muestra.
const ETIQUETAS_MEDIO = {
  TARJETA_CREDITO: 'Tarjeta de crédito',
  TARJETA_DEBITO: 'Tarjeta de débito',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
}

// Lo que el diálogo de confirmación dice según la acción elegida. La clave es el estado NUEVO del pago.
const TEXTOS_ACCION = {
  APROBADO: {
    titulo: '¿Aprobar este pago?',
    mensaje: 'El pedido y sus subpedidos pasan a "Recibido" y los chefs pueden empezar a prepararlo.',
    boton: 'Aprobar pago',
    variante: 'primary',
    aviso: 'Aprobaste el pago',
  },
  RECHAZADO: {
    titulo: '¿Rechazar este pago?',
    mensaje: 'El cliente va a poder intentar pagar de nuevo. Después de 5 rechazos se bloquean los pagos del pedido.',
    boton: 'Rechazar pago',
    variante: 'danger',
    aviso: 'Rechazaste el pago',
  },
  REEMBOLSADO: {
    titulo: '¿Marcar el pago como reembolsado?',
    mensaje: 'Solo registra el reembolso en el sistema: la API no devuelve el dinero ni cambia el pedido.',
    boton: 'Marcar reembolsado',
    variante: 'danger',
    aviso: 'Marcaste el pago como reembolsado',
  },
}

// Importe en pesos con separadores argentinos, igual que en el resto de la app.
const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

// Props:
//  - token: el JWT de la sesión (rutas privadas)
//  - onSesionVencida: función () de App que cierra la sesión; se llama cuando el backend responde 401
//  - onAviso: función (texto) de App para mostrar un Toast
function Admin({ token, onSesionVencida, onAviso }) {
  // ESTADO: los pagos de TODOS los clientes (un ADMIN ve todos), con la forma de PagoResponse de la API.
  const [pagos, setPagos] = useState([])

  // ESTADOS de carga y error del GET. Arranca cargando.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ESTADO: pestaña activa. Por ahora solo 'pagos'; el paso 14b.2 agrega 'usuarios'.
  const [pestana, setPestana] = useState('pagos')

  // ESTADO del diálogo: la acción que se quiere confirmar { pagoId, estado } o null si está cerrado.
  // "estado" es el estado NUEVO que va a tener el pago.
  const [accion, setAccion] = useState(null)

  // GET /pagos al abrir la vista. Ruta privada: lleva el token. Para un ADMIN devuelve los de todos.
  // Dependencias [token]: no se repite mientras no cambie la sesión.
  useEffect(() => {
    fetch(`${API_URL}/pagos`, { headers: { Authorization: `Bearer ${token}` } })
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
      .then((data) => setPagos(data ?? [])) // lista vacía llega como null
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
  // Los hooks (useState y useEffect) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando los pagos..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Al confirmar el diálogo: PATCH /pagos/{id}/estado { estado } (paso 14b.1). Es una escritura: va en el
  // handler. La API devuelve el pago ya actualizado; con él reemplazamos el de la lista (map), SIN volver
  // a pedir todos los pagos. Cerramos el diálogo ENSEGUIDA para que un segundo clic no repita la acción.
  const confirmarAccion = () => {
    const { pagoId, estado } = accion
    setAccion(null)

    fetch(`${API_URL}/pagos/${pagoId}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({ estado }),
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
      .then((actualizado) => {
        setPagos((actuales) => actuales.map((pago) => (pago.id === actualizado.id ? actualizado : pago)))
        onAviso(`${TEXTOS_ACCION[estado].aviso} n.º ${pagoId}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 409 (transición inválida), 403, 404: mostramos el mensaje del backend.
        onAviso(fallo.message)
      })
  }

  // VALORES CALCULADOS (no se guardan aparte): los pagos de más nuevo a más viejo. [...pagos] copia el
  // array porque sort modifica el original y el estado nunca se modifica. Las fechas ISO se comparan como texto.
  const ordenados = [...pagos].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  const pendientes = pagos.filter((pago) => pago.estado === 'PENDIENTE').length

  const pestanas = [{ id: 'pagos', label: 'Pagos', count: pendientes }]

  // Qué botones corresponden a cada estado (transiciones válidas de la API):
  //   PENDIENTE -> APROBADO o RECHAZADO; APROBADO -> REEMBOLSADO; el resto no tiene acciones.
  const accionesDe = (pago) => {
    if (pago.estado === 'PENDIENTE') {
      return ['APROBADO', 'RECHAZADO']
    }
    if (pago.estado === 'APROBADO') {
      return ['REEMBOLSADO']
    }
    return []
  }

  return (
    <>
      <h1 className="font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Administración</h1>
      <p className="mt-3 max-w-xl text-body-md text-on-surface-variant">
        Aprobá los pagos de los clientes para que los chefs puedan preparar los pedidos.
      </p>

      <div className="mt-10">
        <Tabs tabs={pestanas} activeId={pestana} onChange={setPestana} label="Administración" />

        <div role="tabpanel" className="mt-8 space-y-4">
          {/* Renderizado condicional: si no hay pagos, lo decimos */}
          {ordenados.length === 0 && (
            <p className="text-body-md text-on-surface-variant">
              No hay pagos todavía. Cuando un cliente pague un pedido, lo vas a ver acá para aprobarlo.
            </p>
          )}
          {/* map dibuja una fila por pago; key = id del pago, único y estable */}
          {ordenados.map((pago) => (
            <article
              key={pago.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-ambient"
            >
              <div className="min-w-0 flex-1 basis-[220px]">
                <h2 className="font-display text-headline-sm text-primary">Pago n.º {pago.id} · Pedido n.º {pago.pedidoId}</h2>
                <p className="text-body-sm text-on-surface-variant">
                  {ETIQUETAS_MEDIO[pago.medioPago]} ·{' '}
                  {new Date(pago.fechaCreacion).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <p className="font-display text-price-md tabular text-primary">{formatear(pago.monto)}</p>
              <span className={`badge ${ETIQUETAS_PAGO[pago.estado].clase}`}>{ETIQUETAS_PAGO[pago.estado].texto}</span>
              <div className="flex gap-2">
                {accionesDe(pago).map((estado) => (
                  <button
                    key={estado}
                    type="button"
                    className={estado === 'APROBADO' ? 'btn btn-primary btn-sm' : 'btn btn-quiet btn-sm text-error'}
                    onClick={() => setAccion({ pagoId: pago.id, estado })}
                  >
                    {TEXTOS_ACCION[estado].boton}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Diálogo de confirmación, controlado por estado. Los textos salen de TEXTOS_ACCION según la acción.
          Mientras está cerrado (accion === null) usamos un texto vacío: Dialog no dibuja nada si open es false. */}
      <Dialog
        open={accion !== null}
        title={accion === null ? '' : `${TEXTOS_ACCION[accion.estado].titulo} (n.º ${accion.pagoId})`}
        message={accion === null ? '' : TEXTOS_ACCION[accion.estado].mensaje}
        confirmLabel={accion === null ? '' : TEXTOS_ACCION[accion.estado].boton}
        confirmVariant={accion === null ? 'primary' : TEXTOS_ACCION[accion.estado].variante}
        cancelLabel="Volver"
        onConfirm={confirmarAccion}
        onCancel={() => setAccion(null)}
      />
    </>
  )
}

export default Admin
