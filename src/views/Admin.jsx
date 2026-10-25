// Administración (ruta /admin, solo ADMIN). Pestaña Pagos: aprobar, rechazar o reembolsar (aprobar habilita a los chefs).
// Pestaña Usuarios: listar, crear y abrir el detalle para editar datos y cambiar el rol.
import { useEffect, useState } from 'react'
import Tabs from '../components/comunes/Tabs'
import Dialog from '../components/comunes/Dialog'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'
import Alert from '../components/comunes/Alert'
import FormField from '../components/comunes/FormField'

const API_URL = import.meta.env.VITE_API_URL

// Mensaje de un error de fetch: el del backend, o uno claro si no hubo respuesta (el error no tiene status).
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// Estado del pago -> texto y color del badge.
const ETIQUETAS_PAGO = {
  PENDIENTE: { texto: 'Pendiente', clase: 'badge-sand' },
  APROBADO: { texto: 'Aprobado', clase: 'badge-leaf' },
  RECHAZADO: { texto: 'Rechazado', clase: 'badge-terra' },
  REEMBOLSADO: { texto: 'Reembolsado', clase: 'badge-mute' },
}

const ETIQUETAS_MEDIO = {
  TARJETA_CREDITO: 'Tarjeta de crédito',
  TARJETA_DEBITO: 'Tarjeta de débito',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
}

// Textos del diálogo de confirmación; la clave es el estado nuevo del pago.
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

const ETIQUETAS_ROL = {
  CLIENTE: { texto: 'Cliente', clase: 'badge-leaf' },
  CHEF: { texto: 'Chef', clase: 'badge-sand' },
  ADMIN: { texto: 'Administrador', clase: 'badge-dark' },
}

const ROLES = ['CLIENTE', 'CHEF', 'ADMIN']

const FORM_VACIO = { username: '', nombre: '', apellido: '', email: '', password: '', role: 'CLIENTE' }

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

// GET con token; las listas vacías llegan como null. signal (opcional) permite cancelar el pedido.
const pedirPrivado = (ruta, token, signal) =>
  fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${token}` }, signal })
    .then(leerRespuesta)
    .then((data) => data ?? [])

// Valida con las reglas de UserRequest (ENDPOINTS.md 3.2). Devuelve un mensaje por campo con error; vacío si está bien.
const validar = (datos) => ({
  ...((datos.username.trim().length < 3 || datos.username.trim().length > 50) && {
    username: 'El usuario tiene que tener entre 3 y 50 caracteres.',
  }),
  ...(datos.nombre.trim() === '' && { nombre: 'Escribí el nombre.' }),
  ...(datos.apellido.trim() === '' && { apellido: 'Escribí el apellido.' }),
  ...(!/\S+@\S+\.\S+/.test(datos.email.trim()) && { email: 'Escribí un correo válido.' }),
  ...(datos.password.length < 8 && { password: 'La contraseña tiene que tener al menos 8 caracteres.' }),
})

// Valida la edición (UserUpdateRequest): nombre, apellido y correo. Usuario, contraseña y rol no se editan acá.
const validarEdicion = (datos) => ({
  ...(datos.nombre.trim() === '' && { nombre: 'Escribí el nombre.' }),
  ...(datos.apellido.trim() === '' && { apellido: 'Escribí el apellido.' }),
  ...(!/\S+@\S+\.\S+/.test(datos.email.trim()) && { email: 'Escribí un correo válido.' }),
})

const formatear = (monto) => `$${monto.toLocaleString('es-AR')}`

// Props: token (JWT), onSesionVencida (cierra la sesión ante un 401), onAviso (muestra un Toast).
function Admin({ token, onSesionVencida, onAviso }) {
  const [pagos, setPagos] = useState([])

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [usuarios, setUsuarios] = useState([])

  const [pestana, setPestana] = useState('pagos')

  // Formulario de usuario nuevo: abierto, datos, errores por campo y error del backend.
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)
  const [erroresForm, setErroresForm] = useState({})
  const [errorCrear, setErrorCrear] = useState(null)

  // Diálogo de pago: { pagoId, estado nuevo } o null si está cerrado.
  const [accion, setAccion] = useState(null)

  // Diálogo de detalle: id abierto (null = cerrado), usuario, carga y error.
  const [usuarioAbiertoId, setUsuarioAbiertoId] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState(null)

  // Edición del usuario: campos, errores por campo, error del backend y PUT en curso (evita el doble envío).
  const [formEdicion, setFormEdicion] = useState({ nombre: '', apellido: '', email: '' })
  const [erroresEdicion, setErroresEdicion] = useState({})
  const [errorGuardarEdicion, setErrorGuardarEdicion] = useState(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  // Cambio de rol (independiente de la edición): rol elegido, error del backend y PATCH en curso.
  const [rolElegido, setRolElegido] = useState('CLIENTE')
  const [errorRol, setErrorRol] = useState(null)
  const [cambiandoRol, setCambiandoRol] = useState(false)

  // Al abrir: GET /pagos y GET /users juntos (Promise.all).
  useEffect(() => {
    Promise.all([pedirPrivado('/pagos', token), pedirPrivado('/users', token)])
      .then(([listaPagos, listaUsuarios]) => {
        setPagos(listaPagos)
        setUsuarios(listaUsuarios)
      })
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
  }, [token])

  // GET /users/{id} cada vez que se abre el detalle de un usuario.
  useEffect(() => {
    if (usuarioAbiertoId === null) {
      return
    }

    // Se cancela si se cierra el diálogo o se elige otro usuario: una respuesta vieja no pisa los datos del nuevo.
    const controlador = new AbortController()

    pedirPrivado(`/users/${usuarioAbiertoId}`, token, controlador.signal)
      .then((data) => {
        setDetalle(data)
        setFormEdicion({ nombre: data.nombre, apellido: data.apellido, email: data.email })
        setRolElegido(data.role)
        setCargandoDetalle(false)
      })
      .catch((fallo) => {
        if (fallo.name === 'AbortError') {
          return
        }
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setErrorDetalle(mensajeDe(fallo))
        setCargandoDetalle(false)
      })

    return () => controlador.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioAbiertoId, token])

  if (cargando) {
    return <LoadingState message="Cargando los pagos..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Confirma el diálogo: PATCH /pagos/{id}/estado. Se cierra enseguida para que un segundo clic no repita la acción.
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
      .then(leerRespuesta)
      .then((actualizado) => {
        setPagos((actuales) => actuales.map((pago) => (pago.id === actualizado.id ? actualizado : pago)))
        onAviso(`${TEXTOS_ACCION[estado].aviso} n.º ${pagoId}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        onAviso(mensajeDe(fallo))
      })
  }

  // Handler de los inputs del formulario nuevo; al corregir un campo limpia su error.
  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
    if (erroresForm[name]) {
      setErroresForm({ ...erroresForm, [name]: null })
    }
  }

  const cerrarForm = () => {
    setMostrarForm(false)
    setForm(FORM_VACIO)
    setErroresForm({})
    setErrorCrear(null)
  }

  // Crea un usuario (POST /users/createUser) y lo suma a la lista sin volver a pedirla.
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
      .then(leerRespuesta)
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
        setErrorCrear(mensajeDe(fallo))
      })
  }

  // Abre el detalle: reinicia el diálogo y guarda el id (el efecto de arriba hace el GET).
  const abrirDetalle = (userId) => {
    setDetalle(null)
    setCargandoDetalle(true)
    setErrorDetalle(null)
    setErroresEdicion({})
    setErrorGuardarEdicion(null)
    setErrorRol(null)
    setUsuarioAbiertoId(userId)
  }

  const cerrarDetalle = () => setUsuarioAbiertoId(null)

  // Handler de los inputs de la edición.
  const handleEdicionChange = (event) => {
    const { name, value } = event.target
    setFormEdicion({ ...formEdicion, [name]: value })
    if (erroresEdicion[name]) {
      setErroresEdicion({ ...erroresEdicion, [name]: null })
    }
  }

  // Guarda la edición (PUT /users/{id}) y reemplaza al usuario en la lista sin volver a pedirla.
  const guardarEdicion = () => {
    if (detalle === null || guardandoEdicion) {
      return
    }

    const errores = validarEdicion(formEdicion)
    if (Object.keys(errores).length > 0) {
      setErroresEdicion(errores)
      return
    }

    setGuardandoEdicion(true)
    setErrorGuardarEdicion(null)
    fetch(`${API_URL}/users/${detalle.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({
        nombre: formEdicion.nombre.trim(),
        apellido: formEdicion.apellido.trim(),
        email: formEdicion.email.trim(),
      }),
    })
      .then(leerRespuesta)
      .then((editado) => {
        setUsuarios((actuales) => actuales.map((usuario) => (usuario.id === editado.id ? editado : usuario)))
        cerrarDetalle()
        onAviso(`Guardaste los cambios de ${editado.nombre}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // Un 400 ya validados los campos solo puede ser el correo repetido: va junto a ese campo; el resto, en una alerta.
        if (fallo.status === 400) {
          setErroresEdicion({ email: fallo.message })
          return
        }
        setErrorGuardarEdicion(mensajeDe(fallo))
      })
      .finally(() => setGuardandoEdicion(false))
  }

  // Cambia el rol (PATCH /users/{id}/role). Errores del backend: 400 si un ADMIN se quita su propio rol, 409 si se
  // saca CHEF a quien tiene platos o subpedidos sin terminar; se muestran en el diálogo.
  const cambiarRol = () => {
    if (detalle === null || cambiandoRol || rolElegido === detalle.role) {
      return
    }

    setCambiandoRol(true)
    setErrorRol(null)
    fetch(`${API_URL}/users/${detalle.id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({ role: rolElegido }),
    })
      .then(leerRespuesta)
      .then((actualizado) => {
        setUsuarios((actuales) => actuales.map((usuario) => (usuario.id === actualizado.id ? actualizado : usuario)))
        setDetalle(actualizado)
        onAviso(`${actualizado.nombre} ahora es ${ETIQUETAS_ROL[actualizado.role].texto}`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setErrorRol(mensajeDe(fallo))
      })
      .finally(() => setCambiandoRol(false))
  }

  // Contenido del diálogo de detalle según el estado (cargando, error o formulario).
  const contenidoDetalle = () => {
    if (cargandoDetalle) {
      return <p className="mt-5 text-body-md text-on-surface-variant">Cargando los datos...</p>
    }
    if (errorDetalle !== null) {
      return <div className="mt-5"><Alert title="No pudimos cargar el usuario" messages={[errorDetalle]} /></div>
    }
    if (detalle === null) {
      return null
    }
    return (
      <div className="mt-5 space-y-4">
        {errorGuardarEdicion !== null && <Alert title="No pudimos guardar los cambios" messages={[errorGuardarEdicion]} />}
        <FormField label="Nombre" name="nombre" value={formEdicion.nombre} onChange={handleEdicionChange} error={erroresEdicion.nombre} />
        <FormField label="Apellido" name="apellido" value={formEdicion.apellido} onChange={handleEdicionChange} error={erroresEdicion.apellido} />
        <FormField label="Correo electrónico" name="email" type="email" value={formEdicion.email} onChange={handleEdicionChange} error={erroresEdicion.email} />

        {/* Cambio de rol: tiene su propio botón, no depende de "Guardar cambios" */}
        <div className="border-t border-hairline pt-4">
          <label className="label" htmlFor="rol-usuario">Rol</label>
          <div className="flex gap-3">
            <select id="rol-usuario" className="field" value={rolElegido} onChange={(event) => setRolElegido(event.target.value)}>
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>{ETIQUETAS_ROL[rol].texto}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary flex-none"
              onClick={cambiarRol}
              disabled={cambiandoRol || rolElegido === detalle.role}
            >
              {cambiandoRol ? 'Cambiando...' : 'Cambiar rol'}
            </button>
          </div>
          {errorRol !== null && <div className="mt-3"><Alert title="No pudimos cambiar el rol" messages={[errorRol]} /></div>}
        </div>
      </div>
    )
  }

  // Pagos de más nuevo a más viejo (se ordena una copia: sort modifica el array y el estado no se toca).
  const ordenados = [...pagos].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  const pendientes = pagos.filter((pago) => pago.estado === 'PENDIENTE').length

  const pestanas = [
    { id: 'pagos', label: 'Pagos', count: pendientes },
    { id: 'usuarios', label: 'Usuarios', count: usuarios.length },
  ]

  // Transiciones válidas: PENDIENTE -> APROBADO o RECHAZADO; APROBADO -> REEMBOLSADO; el resto no tiene acciones.
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

        {pestana === 'pagos' && (
        <div role="tabpanel" className="mt-8 space-y-4">
          {ordenados.length === 0 && (
            <p className="text-body-md text-on-surface-variant">
              No hay pagos todavía. Cuando un cliente pague un pedido, lo vas a ver acá para aprobarlo.
            </p>
          )}
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

            {/* El rol de un usuario existente se cambia desde "Ver y editar" */}
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
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrirDetalle(usuario.id)}>
                  Ver y editar
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo de confirmación del pago; cerrado, los textos van vacíos (Dialog no dibuja nada con open en false) */}
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

      {/* Diálogo de detalle: se abre cuando usuarioAbiertoId deja de ser null; confirmar guarda con PUT */}
      <Dialog
        open={usuarioAbiertoId !== null}
        title="Editar usuario"
        message={detalle === null ? 'Datos de la cuenta.' : `@${detalle.username} · ${ETIQUETAS_ROL[detalle.role].texto}`}
        confirmLabel={guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
        confirmVariant="primary"
        cancelLabel="Cerrar"
        onConfirm={guardarEdicion}
        onCancel={cerrarDetalle}
      >
        {contenidoDetalle()}
      </Dialog>
    </>
  )
}

export default Admin
