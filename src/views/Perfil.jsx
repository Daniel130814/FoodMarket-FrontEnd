// Vista del perfil (ruta /perfil, para los tres roles con sesión). Muestra los datos de la cuenta y deja
// editar nombre, apellido y correo, y cambiar la contraseña. Pide el usuario con GET /users/me y lo guarda
// con PUT /users/me; la contraseña se cambia con PUT /users/me/password.
import { useEffect, useState } from 'react'
import ContenidoAsync from '../components/comunes/ContenidoAsync'
import FormField from '../components/comunes/FormField'
import Alert from '../components/comunes/Alert'

// URL base del backend (se lee del archivo .env, igual que en App).
const API_URL = import.meta.env.VITE_API_URL

// Texto de un error de fetch para mostrárselo al usuario: el "message" del backend si respondió con un
// error, o uno claro si ni llegamos al servidor (apagado, sin red; ahí el error no tiene status).
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// Lee la respuesta del backend; se usa como .then(leerRespuesta). fetch NO manda los errores HTTP al
// .catch(), por eso revisamos response.ok: si falló lanza un Error con el message y el status del backend.
const leerRespuesta = (response) =>
  response.json().then((cuerpo) => {
    if (!response.ok) {
      const fallo = new Error(cuerpo.message)
      fallo.status = response.status
      throw fallo
    }
    return cuerpo.data
  })

// Cómo se muestra cada rol de la API.
const NOMBRES_ROL = {
  CLIENTE: 'Cliente',
  CHEF: 'Chef',
  ADMIN: 'Administrador',
}

// Pasa un usuario (forma de UserResponse) a los valores del formulario.
const aFormulario = (usuario) => ({
  nombre: usuario.nombre,
  apellido: usuario.apellido,
  email: usuario.email,
})

// Valida el formulario con las reglas de UserUpdateRequest (ENDPOINTS.md, sección 3.2): los tres campos
// son obligatorios y el correo tiene que ser válido. Devuelve un mensaje por cada campo con error.
// ...(condicion && { clave: 'mensaje' }) agrega la clave solo si se cumple la condición.
const validar = (datos) => ({
  ...(datos.nombre.trim() === '' && { nombre: 'Escribí el nombre.' }),
  ...(datos.apellido.trim() === '' && { apellido: 'Escribí el apellido.' }),
  ...(!/\S+@\S+\.\S+/.test(datos.email.trim()) && { email: 'Escribí un correo válido.' }),
})

// Valida el cambio de contraseña con las reglas de CambioPasswordRequest (ENDPOINTS.md, sección 3.2): la
// actual es obligatoria y la nueva tiene mínimo 8 caracteres. "repetir" no existe en la API: lo pedimos
// nosotros para evitar un error de tipeo.
const validarPassword = (datos) => ({
  ...(datos.actual === '' && { actual: 'Escribí tu contraseña actual.' }),
  ...(datos.nueva.length < 8 && { nueva: 'La contraseña nueva tiene que tener al menos 8 caracteres.' }),
  ...(datos.nueva.length >= 8 && datos.repetir !== datos.nueva && { repetir: 'Las contraseñas no coinciden.' }),
})

// Formulario vacío del cambio de contraseña.
const PASSWORD_VACIA = { actual: '', nueva: '', repetir: '' }

// Props:
//  - token: el JWT de la sesión, para GET y PUT /users/me y PUT /users/me/password (rutas privadas)
//  - onSesionVencida: función () de App que cierra la sesión; se llama cuando el backend responde 401
//  - onPerfilActualizado: función (usuario) de App. Se le entrega el usuario guardado para que actualice el
//    nombre del Header.
//  - onAviso: función (texto) de App para mostrar un Toast
function Perfil({ token, onSesionVencida, onPerfilActualizado, onAviso }) {
  // ESTADO de los datos que llegan del backend: el usuario (null hasta que responde la API).
  const [usuario, setUsuario] = useState(null)

  // ESTADOS de carga y error del GET. Arranca cargando.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ESTADO del formulario (campos controlados) y un mensaje de error por campo.
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '' })
  const [errores, setErrores] = useState({})

  // ESTADOS del PUT: true mientras espera (evita doble envío) y el error general del backend.
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState(null)

  // ESTADOS del cambio de contraseña: sus tres campos, un mensaje de error por campo, el error general del
  // backend y si el PUT está en curso. Son independientes de los del formulario de datos de arriba.
  const [formPassword, setFormPassword] = useState(PASSWORD_VACIA)
  const [erroresPassword, setErroresPassword] = useState({})
  const [errorPassword, setErrorPassword] = useState(null)
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  // GET /users/me al abrir la vista. Es privada: lleva el token. El resultado llena el usuario y el formulario.
  useEffect(() => {
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(leerRespuesta)
      .then((data) => {
        setUsuario(data)
        setForm(aFormulario(data))
      })
      .catch((fallo) => {
        // 401: el token ya no sirve, App cierra la sesión.
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setError(mensajeDe(fallo))
      })
      .finally(() => setCargando(false))
    // onSesionVencida queda afuera de las dependencias a propósito: App la crea de nuevo en cada render y
    // el GET se repetiría sin parar (se resuelve con useCallback cuando se vea en clase).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Un único handler para los tres inputs: event.target.name dice qué campo cambió y value qué escribió
  // el usuario ([name]: value es una "clave calculada"). Al corregir un campo limpiamos su error.
  const handleChange = (event) => {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
    if (errores[name]) {
      setErrores({ ...errores, [name]: null })
    }
  }

  // Guarda los cambios con PUT /users/me. Con el usuario que devuelve el backend actualizamos el estado
  // local, SIN volver a pedirlo.
  const handleSubmit = (event) => {
    event.preventDefault()

    const nuevosErrores = validar(form)
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    setGuardando(true)
    setErrorGuardar(null)
    fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
      }),
    })
      .then(leerRespuesta)
      .then((guardado) => {
        setUsuario(guardado)
        setForm(aFormulario(guardado))
        onPerfilActualizado(guardado)
        onAviso('Guardaste los cambios de tu perfil')
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 400: con los tres campos ya validados, lo único que puede fallar es el correo repetido,
        // así que mostramos el mensaje del backend junto a ese campo. El resto va en una alerta.
        if (fallo.status === 400) {
          setErrores({ email: fallo.message })
          return
        }
        setErrorGuardar(mensajeDe(fallo))
      })
      .finally(() => setGuardando(false))
  }

  // Un único handler para los tres inputs de la contraseña (event.target.name dice cuál cambió).
  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setFormPassword({ ...formPassword, [name]: value })
    if (erroresPassword[name]) {
      setErroresPassword({ ...erroresPassword, [name]: null })
    }
  }

  // Cambia la contraseña con PUT /users/me/password { actual, nueva }. La respuesta trae data: null (nada
  // que guardar en el estado): solo vaciamos los campos y avisamos. El token sigue siendo válido.
  const handlePasswordSubmit = (event) => {
    event.preventDefault()

    const nuevosErrores = validarPassword(formPassword)
    if (Object.keys(nuevosErrores).length > 0) {
      setErroresPassword(nuevosErrores)
      return
    }

    setGuardandoPassword(true)
    setErrorPassword(null)
    fetch(`${API_URL}/users/me/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({ actual: formPassword.actual, nueva: formPassword.nueva }),
    })
      .then(leerRespuesta)
      .then(() => {
        setFormPassword(PASSWORD_VACIA)
        setErroresPassword({})
        onAviso('Cambiaste tu contraseña')
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 400: con la nueva ya validada, lo habitual es que la contraseña actual sea incorrecta: el mensaje
        // del backend va junto a ese campo. El resto (red caída, 500) va en una alerta.
        if (fallo.status === 400) {
          setErroresPassword({ actual: fallo.message })
          return
        }
        setErrorPassword(mensajeDe(fallo))
      })
      .finally(() => setGuardandoPassword(false))
  }

  return (
    <>
      <h1 className="font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Mi perfil</h1>
      <p className="mt-3 max-w-xl text-body-lg text-on-surface-variant">
        Revisá los datos de tu cuenta y corregí lo que haga falta.
      </p>

      {/* ContenidoAsync muestra la carga o el error; con el usuario cargado muestra el formulario.
          vacio es false porque acá no hay una lista que pueda venir vacía. */}
      <ContenidoAsync
        cargando={cargando}
        error={error}
        vacio={false}
        mensajeCarga="Cargando tu perfil..."
      >
        {usuario !== null && (
          <>
            <form className="mt-10 max-w-xl space-y-6" onSubmit={handleSubmit} noValidate>
              {/* Estos datos no se pueden editar (la API ignora el usuario y el rol en PUT /users/me) */}
              <dl className="grid gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:grid-cols-2">
                <div>
                  <dt className="text-label-md text-on-surface-variant">Usuario</dt>
                  <dd className="text-body-md text-primary">@{usuario.username}</dd>
                </div>
                <div>
                  <dt className="text-label-md text-on-surface-variant">Rol</dt>
                  <dd className="text-body-md text-primary">{NOMBRES_ROL[usuario.role]}</dd>
                </div>
              </dl>

              {errorGuardar !== null && <Alert title="No pudimos guardar tus datos" messages={[errorGuardar]} />}

              <FormField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} error={errores.nombre} />
              <FormField label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} error={errores.apellido} />
              <FormField label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleChange} error={errores.email} />

              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>

            {/* Cambio de contraseña: un formulario aparte, con su propio botón */}
            <form className="mt-14 max-w-xl space-y-6" onSubmit={handlePasswordSubmit} noValidate>
              <h2 className="font-display text-headline-md text-primary">Cambiar la contraseña</h2>

              {errorPassword !== null && <Alert title="No pudimos cambiar la contraseña" messages={[errorPassword]} />}

              <FormField label="Contraseña actual" name="actual" type="password" value={formPassword.actual} onChange={handlePasswordChange} error={erroresPassword.actual} autoComplete="current-password" />
              <FormField label="Contraseña nueva" name="nueva" type="password" value={formPassword.nueva} onChange={handlePasswordChange} error={erroresPassword.nueva} autoComplete="new-password" />
              <FormField label="Repetí la contraseña nueva" name="repetir" type="password" value={formPassword.repetir} onChange={handlePasswordChange} error={erroresPassword.repetir} autoComplete="new-password" />

              <button type="submit" className="btn btn-primary" disabled={guardandoPassword}>
                {guardandoPassword ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </>
        )}
      </ContenidoAsync>
    </>
  )
}

export default Perfil
