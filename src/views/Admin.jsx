// Vista de administración (ruta /admin, solo rol ADMIN). Tiene dos pestañas:
//  - Pagos: el ADMIN aprueba o rechaza los pagos que crean los clientes (en la API no hay pasarela: lo
//    hace una persona). Al aprobar un pago, el backend pasa el pedido y sus subpedidos a CONFIRMADO y los
//    chefs pueden avanzarlos.
//  - Usuarios: lista las cuentas y crea cuentas nuevas con cualquier rol (CLIENTE, CHEF o ADMIN).
import { useEffect, useState } from 'react'
import Tabs from '../components/Tabs'
import Dialog from '../components/Dialog'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import Alert from '../components/Alert'
import FormField from '../components/FormField'

// URL base del backend (se lee del archivo .env, igual que en App).
const API_URL = import.meta.env.VITE_API_URL

// Texto de un error de fetch para mostrárselo al usuario. Si el servidor RESPONDIÓ con un error (400, 403...)
// usamos su "message". Si ni siquiera llegamos al servidor (apagado, sin red), fetch rechaza la promesa con
// un error SIN status y el texto del navegador ("Failed to fetch") no le sirve a nadie: damos uno claro.
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

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

// Roles de la API -> texto y color del badge.
const ETIQUETAS_ROL = {
  CLIENTE: { texto: 'Cliente', clase: 'badge-leaf' },
  CHEF: { texto: 'Chef', clase: 'badge-sand' },
  ADMIN: { texto: 'Administrador', clase: 'badge-dark' },
}

// Formulario de usuario vacío. role arranca en CLIENTE.
const FORM_VACIO = { username: '', nombre: '', apellido: '', email: '', password: '', role: 'CLIENTE' }

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

// Valida el formulario con las reglas de UserRequest (ENDPOINTS.md, sección 3.2).
// Devuelve un objeto con un mensaje por cada campo con error; vacío si todo está bien.
// ...(condicion && { clave: 'mensaje' }) agrega la clave solo si se cumple la condición.
const validar = (datos) => ({
  ...((datos.username.trim().length < 3 || datos.username.trim().length > 50) && {
    username: 'El usuario tiene que tener entre 3 y 50 caracteres.',
  }),
  ...(datos.nombre.trim() === '' && { nombre: 'Escribí el nombre.' }),
  ...(datos.apellido.trim() === '' && { apellido: 'Escribí el apellido.' }),
  ...(!/\S+@\S+\.\S+/.test(datos.email.trim()) && { email: 'Escribí un correo válido.' }),
  ...(datos.password.length < 8 && { password: 'La contraseña tiene que tener al menos 8 caracteres.' }),
})

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

  // ESTADO: los usuarios (UserResponse). Se piden junto con los pagos y se actualizan al crear uno.
  const [usuarios, setUsuarios] = useState([])

  // ESTADO: pestaña activa. 'pagos' o 'usuarios'.
  const [pestana, setPestana] = useState('pagos')

  // ESTADOS del formulario de usuario nuevo: si está abierto, sus datos, un mensaje de error por campo
  // y el error que devuelva el backend al guardar (null si no hay).
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [erroresForm, setErroresForm] = useState({})
  const [errorCrear, setErrorCrear] = useState(null)

  // ESTADO del diálogo: la acción que se quiere confirmar { pagoId, estado } o null si está cerrado.
  // "estado" es el estado NUEVO que va a tener el pago.
  const [accion, setAccion] = useState(null)

  // GET /pagos y GET /users al abrir la vista. Rutas privadas: llevan el token. Promise.all espera a que
  // lleguen LOS DOS y entrega los resultados juntos (mismo orden). Dependencias [token]: no se repite
  // mientras no cambie la sesión.
  useEffect(() => {
    Promise.all([pedirPrivado('/pagos', token), pedirPrivado('/users', token)])
      .then(([listaPagos, listaUsuarios]) => {
        setPagos(listaPagos)
        setUsuarios(listaUsuarios)
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
        onAviso(mensajeDe(fallo))
      })
  }

  // Un único handler para todos los inputs del formulario: event.target.name dice qué campo cambió y
  // value qué escribió el usuario ([name]: value es una "clave calculada"). Al corregir un campo
  // limpiamos su error.
  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
    if (erroresForm[name]) {
      setErroresForm({ ...erroresForm, [name]: null })
    }
  }

  // Cierra el formulario y lo deja vacío.
  const cerrarForm = () => {
    setMostrarForm(false)
    setForm(FORM_VACIO)
    setErroresForm({})
    setErrorCrear(null)
  }

  // Crea un usuario con POST /users/createUser (paso 14b.2). Es una escritura: va en el handler del submit.
  // Valida igual que la API; si todo está bien manda el cuerpo de UserRequest. Con el usuario que devuelve
  // el backend (201) lo sumamos a la lista, SIN volver a pedirla.
  const crearUsuario = (event) => {
    event.preventDefault()

    const errores = validar(form)
    if (Object.keys(errores).length > 0) {
      setErroresForm(errores)
      return
    }

    setErrorCrear(null)
    fetch(`${API_URL}/users/createUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({
        username: form.username.trim(),
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
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
      .then((creado) => {
        setUsuarios((actuales) => [...actuales, creado])
        cerrarForm()
        onAviso(`Creaste la cuenta de ${creado.nombre}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 400 (usuario o correo ya existe, datos inválidos), 403: mostramos el mensaje del backend.
        setErrorCrear(mensajeDe(fallo))
      })
  }

  // VALORES CALCULADOS (no se guardan aparte): los pagos de más nuevo a más viejo. [...pagos] copia el
  // array porque sort modifica el original y el estado nunca se modifica. Las fechas ISO se comparan como texto.
  const ordenados = [...pagos].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  const pendientes = pagos.filter((pago) => pago.estado === 'PENDIENTE').length

  const pestanas = [
    { id: 'pagos', label: 'Pagos', count: pendientes },
    { id: 'usuarios', label: 'Usuarios', count: usuarios.length },
  ]

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
        Aprobá los pagos de los clientes para que los chefs puedan preparar los pedidos y creá cuentas nuevas.
      </p>

      <div className="mt-10">
        <Tabs tabs={pestanas} activeId={pestana} onChange={setPestana} label="Administración" />

        {/* Renderizado condicional: según la pestaña activa se dibuja una lista u otra */}
        {pestana === 'pagos' && (
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
        )}

        {pestana === 'usuarios' && (
          <div role="tabpanel" className="mt-8 space-y-4">
            {/* El formulario se muestra o se esconde según el estado mostrarForm (nada de DOM) */}
            {mostrarForm ? (
              <form
                className="space-y-5 rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-7"
                onSubmit={crearUsuario}
                noValidate
              >
                <h2 className="font-display text-headline-sm text-primary">Nueva cuenta</h2>
                {errorCrear !== null && <Alert title="No pudimos crear la cuenta" messages={[errorCrear]} />}
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Nombre" name="nombre" value={form.nombre} onChange={handleFormChange} error={erroresForm.nombre} />
                  <FormField label="Apellido" name="apellido" value={form.apellido} onChange={handleFormChange} error={erroresForm.apellido} />
                  <FormField label="Usuario" name="username" value={form.username} onChange={handleFormChange} error={erroresForm.username} autoComplete="off" />
                  <FormField label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleFormChange} error={erroresForm.email} autoComplete="off" />
                  <FormField label="Contraseña" name="password" type="password" value={form.password} onChange={handleFormChange} error={erroresForm.password} autoComplete="new-password" />
                  <div>
                    <label className="label" htmlFor="role">Rol</label>
                    <select id="role" name="role" className="field" value={form.role} onChange={handleFormChange}>
                      <option value="CLIENTE">Cliente</option>
                      <option value="CHEF">Chef</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="btn btn-primary">Crear cuenta</button>
                  <button type="button" className="btn btn-quiet" onClick={cerrarForm}>Cancelar</button>
                </div>
              </form>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(true)}>
                Crear usuario
              </button>
            )}

            {/* TODO(backend): un ADMIN todavía no puede cambiar el rol de un usuario existente (PUT /users/{id}
                lo ignora). Por ahora solo se puede crear una cuenta nueva con el rol elegido. */}
            {/* map dibuja una fila por usuario; key = id, único y estable */}
            {usuarios.map((usuario) => (
              <article
                key={usuario.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-ambient"
              >
                <div className="min-w-0 flex-1 basis-[220px]">
                  <h2 className="font-display text-headline-sm text-primary">{usuario.nombre} {usuario.apellido}</h2>
                  <p className="text-body-sm text-on-surface-variant">@{usuario.username} · {usuario.email}</p>
                </div>
                <span className={`badge ${ETIQUETAS_ROL[usuario.role].clase}`}>{ETIQUETAS_ROL[usuario.role].texto}</span>
              </article>
            ))}
          </div>
        )}
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
