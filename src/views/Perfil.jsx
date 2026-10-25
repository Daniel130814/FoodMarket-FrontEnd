// Perfil (/perfil, cualquier rol con sesión): datos de la cuenta (GET y PUT /users/me) y cambio de contraseña (PUT /users/me/password).
import { useEffect, useState } from 'react'
import ContenidoAsync from '../components/comunes/ContenidoAsync'
import FormField from '../components/comunes/FormField'
import Alert from '../components/comunes/Alert'

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

const NOMBRES_ROL = {
  CLIENTE: 'Cliente',
  CHEF: 'Chef',
  ADMIN: 'Administrador',
}

const aFormulario = (usuario) => ({
  nombre: usuario.nombre,
  apellido: usuario.apellido,
  email: usuario.email,
})

// Valida con las reglas de UserUpdateRequest (ENDPOINTS.md 3.2): un mensaje por campo con error.
const validar = (datos) => ({
  ...(datos.nombre.trim() === '' && { nombre: 'Escribí el nombre.' }),
  ...(datos.apellido.trim() === '' && { apellido: 'Escribí el apellido.' }),
  ...(!/\S+@\S+\.\S+/.test(datos.email.trim()) && { email: 'Escribí un correo válido.' }),
})

// Valida el cambio de contraseña (CambioPasswordRequest). "repetir" no existe en la API: se pide para evitar errores de tipeo.
const validarPassword = (datos) => ({
  ...(datos.actual === '' && { actual: 'Escribí tu contraseña actual.' }),
  ...(datos.nueva.length < 8 && { nueva: 'La contraseña nueva tiene que tener al menos 8 caracteres.' }),
  ...(datos.nueva.length >= 8 && datos.repetir !== datos.nueva && { repetir: 'Las contraseñas no coinciden.' }),
})

const PASSWORD_VACIA = { actual: '', nueva: '', repetir: '' }

// Props: token (JWT), onSesionVencida (401), onPerfilActualizado (le pasa a App el usuario guardado para el Header), onAviso (Toast).
function Perfil({ token, onSesionVencida, onPerfilActualizado, onAviso }) {
  const [usuario, setUsuario] = useState(null)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({ nombre: '', apellido: '', email: '' })
  const [errores, setErrores] = useState({})

  // Guardado en curso (evita el doble envío) y error del backend.
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState(null)

  // Cambio de contraseña (independiente del formulario de datos): campos, errores por campo, error del backend y envío en curso.
  const [formPassword, setFormPassword] = useState(PASSWORD_VACIA)
  const [erroresPassword, setErroresPassword] = useState({})
  const [errorPassword, setErrorPassword] = useState(null)
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  // Al abrir: GET /users/me, que llena el usuario y el formulario.
  useEffect(() => {
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(leerRespuesta)
      .then((data) => {
        setUsuario(data)
        setForm(aFormulario(data))
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

  // Handler de los inputs de datos; al corregir un campo limpia su error.
  const handleChange = (event) => {
    const { name, value } = event.target
    setForm({ ...form, [name]: value })
    if (errores[name]) {
      setErrores({ ...errores, [name]: null })
    }
  }

  // Guarda los datos (PUT /users/me) y actualiza el estado local sin volver a pedirlos.
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
        // Un 400 ya validados los campos solo puede ser el correo repetido: va junto a ese campo; el resto, en una alerta.
        if (fallo.status === 400) {
          setErrores({ email: fallo.message })
          return
        }
        setErrorGuardar(mensajeDe(fallo))
      })
      .finally(() => setGuardando(false))
  }

  // Handler de los inputs de la contraseña.
  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setFormPassword({ ...formPassword, [name]: value })
    if (erroresPassword[name]) {
      setErroresPassword({ ...erroresPassword, [name]: null })
    }
  }

  // Cambia la contraseña (PUT /users/me/password). No devuelve datos: se vacían los campos y el token sigue valiendo.
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
        // Un 400 con la nueva ya validada suele ser la contraseña actual incorrecta: va junto a ese campo; el resto, en una alerta.
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

      <ContenidoAsync
        cargando={cargando}
        error={error}
        vacio={false}
        mensajeCarga="Cargando tu perfil..."
      >
        {usuario !== null && (
          <>
            <form className="mt-10 max-w-xl space-y-6" onSubmit={handleSubmit} noValidate>
              {/* No editables: la API ignora el usuario y el rol en PUT /users/me */}
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
