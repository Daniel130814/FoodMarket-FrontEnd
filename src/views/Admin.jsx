// Vista de administración (ruta /admin, solo rol ADMIN). Tiene dos pestañas:
//  - Pagos: el ADMIN aprueba o rechaza los pagos que crean los clientes (en la API no hay pasarela: lo
//    hace una persona). Al aprobar un pago, el backend pasa el pedido y sus subpedidos a CONFIRMADO y los
//    chefs pueden avanzarlos.
//  - Usuarios: lista las cuentas, crea cuentas nuevas con cualquier rol (CLIENTE, CHEF o ADMIN) y abre el
//    detalle de cada una (GET /users/{id}) para editar su nombre, apellido y correo (PUT /users/{id}).
import { useEffect, useState } from 'react'
import Tabs from '../components/comunes/Tabs'
import Dialog from '../components/comunes/Dialog'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'
import Alert from '../components/comunes/Alert'
import FormField from '../components/comunes/FormField'

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

// Los roles de la API, en el orden en que se ofrecen en el selector del detalle de usuario.
const ROLES = ['CLIENTE', 'CHEF', 'ADMIN']

// Formulario de usuario vacío. role arranca en CLIENTE.
const FORM_VACIO = { username: '', nombre: '', apellido: '', email: '', password: '', role: 'CLIENTE' }

// Lee la respuesta del backend: si no fue exitosa lanza un Error con el message y el status HTTP
// (fetch no manda los errores HTTP al .catch()); si fue exitosa devuelve cuerpo.data.
// Se usa como .then(leerRespuesta) en todos los fetch de esta vista.
const leerRespuesta = (response) =>
  response.json().then((cuerpo) => {
    if (!response.ok) {
      const fallo = new Error(cuerpo.message)
      fallo.status = response.status
      throw fallo
    }
    return cuerpo.data
  })

// GET de una ruta PRIVADA: lleva el token. Devuelve una promesa con el "data" de la respuesta (las
// listas vacías llegan como null, por eso el ?? []). Es una función común (no un hook).
// signal es opcional: la señal de un AbortController, para poder cancelar el pedido (ver el efecto del detalle).
const pedirPrivado = (ruta, token, signal) =>
  fetch(`${API_URL}${ruta}`, { headers: { Authorization: `Bearer ${token}` }, signal })
    .then(leerRespuesta)
    .then((data) => data ?? [])

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

// Valida el formulario de edición con las reglas de UserUpdateRequest (ENDPOINTS.md, sección 3.2): nombre,
// apellido y correo obligatorios. No se editan el usuario, la contraseña ni el rol (la API los ignora).
const validarEdicion = (datos) => ({
  ...(datos.nombre.trim() === '' && { nombre: 'Escribí el nombre.' }),
  ...(datos.apellido.trim() === '' && { apellido: 'Escribí el apellido.' }),
  ...(!/\S+@\S+\.\S+/.test(datos.email.trim()) && { email: 'Escribí un correo válido.' }),
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

  // ESTADOS del diálogo de detalle de un usuario: el id del usuario abierto (null = cerrado), el usuario que
  // devuelve GET /users/{id}, si se está pidiendo y si falló.
  const [usuarioAbiertoId, setUsuarioAbiertoId] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState(null)

  // ESTADOS del formulario de edición de ese usuario: sus campos, un mensaje de error por campo, el error
  // general del backend y si el PUT está en curso (evita el doble envío).
  const [formEdicion, setFormEdicion] = useState({ nombre: '', apellido: '', email: '' })
  const [erroresEdicion, setErroresEdicion] = useState({})
  const [errorGuardarEdicion, setErrorGuardarEdicion] = useState(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)

  // ESTADOS del cambio de rol de ese usuario: el rol elegido en el selector, el error del backend (null si no
  // hay) y si el PATCH está en curso. Son independientes de los del formulario de nombre y correo.
  const [rolElegido, setRolElegido] = useState('CLIENTE')
  const [errorRol, setErrorRol] = useState(null)
  const [cambiandoRol, setCambiandoRol] = useState(false)

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

  // GET /users/{id} cuando se abre el detalle de un usuario. Es un GET: va en un efecto, con
  // [usuarioAbiertoId, token] como dependencias, así corre cada vez que se elige otro usuario. El efecto
  // modifica "detalle", no "usuarioAbiertoId", por eso no hay bucle. Si el id es null (diálogo cerrado) no hace nada.
  useEffect(() => {
    if (usuarioAbiertoId === null) {
      return
    }

    // AbortController cancela el pedido si se cierra el diálogo o se elige otro usuario antes de que responda
    // (así una respuesta vieja nunca pisa los datos del usuario nuevo). La función que devuelve el efecto
    // es la limpieza: React la ejecuta antes de volver a correrlo o al salir de la vista.
    const controlador = new AbortController()

    pedirPrivado(`/users/${usuarioAbiertoId}`, token, controlador.signal)
      .then((data) => {
        setDetalle(data)
        setFormEdicion({ nombre: data.nombre, apellido: data.apellido, email: data.email })
        setRolElegido(data.role)
        setCargandoDetalle(false)
      })
      .catch((fallo) => {
        // Un pedido cancelado por nosotros (AbortError) no es un error.
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
    // onSesionVencida queda afuera de las dependencias a propósito (ver el efecto de arriba).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioAbiertoId, token])

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
        // 400 (usuario o correo ya existe, datos inválidos), 403: mostramos el mensaje del backend.
        setErrorCrear(mensajeDe(fallo))
      })
  }

  // Abre el detalle de un usuario: dejamos el diálogo "cargando" y sin datos viejos, y guardamos su id.
  // Al cambiar usuarioAbiertoId, el efecto de arriba hace el GET. Estos estados se reinician acá (en el
  // handler del clic) y no dentro del efecto.
  const abrirDetalle = (userId) => {
    setDetalle(null)
    setCargandoDetalle(true)
    setErrorDetalle(null)
    setErroresEdicion({})
    setErrorGuardarEdicion(null)
    setErrorRol(null)
    setUsuarioAbiertoId(userId)
  }

  // Cierra el diálogo. Con id en null el efecto no pide nada y Dialog no dibuja nada.
  const cerrarDetalle = () => setUsuarioAbiertoId(null)

  // Un único handler para los tres inputs de la edición: event.target.name dice qué campo cambió.
  const handleEdicionChange = (event) => {
    const { name, value } = event.target
    setFormEdicion({ ...formEdicion, [name]: value })
    if (erroresEdicion[name]) {
      setErroresEdicion({ ...erroresEdicion, [name]: null })
    }
  }

  // Guarda la edición con PUT /users/{id} (paso 5). Es una escritura: va en el handler (el botón del
  // diálogo). Con el usuario que devuelve el backend reemplazamos el de la lista (map), SIN volver a pedirla.
  const guardarEdicion = () => {
    // Sin datos todavía (cargando o falló el GET) o con un guardado en curso no hay nada que enviar.
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
        // 400: con los campos ya validados, lo único que puede fallar es el correo repetido: va junto a ese
        // campo. El resto (403, 404, red caída) va en una alerta dentro del diálogo.
        if (fallo.status === 400) {
          setErroresEdicion({ email: fallo.message })
          return
        }
        setErrorGuardarEdicion(mensajeDe(fallo))
      })
      .finally(() => setGuardandoEdicion(false))
  }

  // Cambia el rol del usuario abierto con PATCH /users/{id}/role { role } (ENDPOINTS.md, sección 3.2). Es una
  // escritura: va en el handler del botón. La respuesta es el usuario ya actualizado: con él reemplazamos el
  // de la lista (map) y el del detalle, SIN volver a pedir nada. Los errores del backend (400 si un ADMIN
  // intenta quitarse su propio rol, 409 si se saca el rol CHEF a quien tiene platos publicados o subpedidos
  // sin terminar) se muestran en el diálogo con el mensaje del backend.
  const cambiarRol = () => {
    // Sin datos todavía, con un cambio en curso o sin cambio de rol, no hay nada que enviar.
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

  // Función auxiliar: devuelve lo que va dentro del diálogo según el estado (cargando, error o el formulario).
  const contenidoDetalle = () => {
    if (cargandoDetalle) {
      return <p className="mt-5 text-body-md text-on-surface-variant">Cargando los datos...</p>
    }
    if (errorDetalle !== null) {
      return <div className="mt-5"><Alert title="No pudimos cargar el usuario" messages={[errorDetalle]} /></div>
    }
    // Con el diálogo cerrado todavía no hay usuario (esta función se evalúa en cada render): no hay nada que mostrar.
    if (detalle === null) {
      return null
    }
    return (
      <div className="mt-5 space-y-4">
        {errorGuardarEdicion !== null && <Alert title="No pudimos guardar los cambios" messages={[errorGuardarEdicion]} />}
        <FormField label="Nombre" name="nombre" value={formEdicion.nombre} onChange={handleEdicionChange} error={erroresEdicion.nombre} />
        <FormField label="Apellido" name="apellido" value={formEdicion.apellido} onChange={handleEdicionChange} error={erroresEdicion.apellido} />
        <FormField label="Correo electrónico" name="email" type="email" value={formEdicion.email} onChange={handleEdicionChange} error={erroresEdicion.email} />

        {/* Cambio de rol: tiene su propio botón y su propio pedido; no depende de "Guardar cambios" */}
        <div className="border-t border-hairline pt-4">
          <label className="label" htmlFor="rol-usuario">Rol</label>
          <div className="flex gap-3">
            <select id="rol-usuario" className="field" value={rolElegido} onChange={(event) => setRolElegido(event.target.value)}>
              {/* map: una opción por rol. key = el valor del rol, único */}
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

            {/* El rol de un usuario existente se cambia desde "Ver y editar" (PATCH /users/{userId}/role).
                PUT /users/{id} sigue ignorando el rol. */}
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
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrirDetalle(usuario.id)}>
                  Ver y editar
                </button>
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

      {/* Diálogo de detalle de un usuario (paso 5): se abre cuando usuarioAbiertoId deja de ser null. Los
          campos del formulario van como children; el botón de confirmar guarda con PUT /users/{id}. */}
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
