// Ingreso (/ingreso): login con POST /api/v1/auth/authenticate y después GET /users/me para el nombre.

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/layout/Logo'

// URL base del backend (viene de .env).
const API_URL = import.meta.env.VITE_API_URL

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

// Props: onLogin (iniciarSesion de App; recibe { token, userId, role, nombre }).
function Ingreso({ onLogin }) {
  // Campos del formulario; las claves son las que pide la API.
  const [datos, setDatos] = useState({ username: '', password: '' })

  const [mostrarClave, setMostrarClave] = useState(false)

  // errorGeneral: texto del cartel rojo ('' = sin cartel). errores: un mensaje por campo.
  const [errorGeneral, setErrorGeneral] = useState('')
  const [errores, setErrores] = useState({})

  // Envío en curso: deshabilita el botón para evitar el doble clic.
  const [enviando, setEnviando] = useState(false)

  const navigate = useNavigate()

  // Tras el login vuelve a la ruta de origen (location.state.from) o, si entraron directo, al inicio.
  const location = useLocation()
  const destino = location.state?.from ?? '/'

  // Handler de los inputs: guarda el valor por name y limpia el error de ese campo.
  const handleChange = (event) => {
    const { name, value } = event.target
    setDatos({ ...datos, [name]: value })
    if (errores[name]) {
      setErrores({ ...errores, [name]: null })
    }
  }

  // Envío: valida los campos y, si están bien, hace el login.
  const handleSubmit = (event) => {
    event.preventDefault()

    const nuevosErrores = {}

    if (datos.username.trim() === '') {
      nuevosErrores.username = 'Escribí tu nombre de usuario.'
    }
    // Solo se pide que no esté vacía: la longitud mínima se valida en Registro y las credenciales, en el backend.
    if (datos.password === '') {
      nuevosErrores.password = 'Escribí tu contraseña.'
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setErrorGeneral('')
      return
    }

    // El backend normaliza el username (sin espacios y en minúsculas): se hace igual acá.
    const username = datos.username.trim().toLowerCase()

    setErrores({})
    setErrorGeneral('')
    setEnviando(true)

    fetch(`${API_URL}/api/v1/auth/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: datos.password }),
    })
      .then(leerRespuesta)
      .then((auth) =>
        // El login no trae el nombre: se pide con GET /users/me usando el token.
        fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${auth.access_token}` } })
          .then(leerRespuesta)
          .then((usuario) => ({ auth, usuario }))
      )
      .then(({ auth, usuario }) => {
        // Ojo: el token viene en access_token, no en token.
        onLogin({ token: auth.access_token, userId: auth.userId, role: auth.role, nombre: usuario.nombre })
        navigate(destino)
      })
      .catch((fallo) => {
        // 401 = credenciales incorrectas; sin status, no hubo respuesta del servidor; si no, el mensaje del backend.
        if (fallo.status === 401) {
          setErrorGeneral('El usuario o la contraseña no coinciden. Revisalos e intentá de nuevo.')
        } else if (fallo.status === undefined) {
          setErrorGeneral('No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.')
        } else {
          setErrorGeneral(fallo.message)
        }
      })
      .finally(() => setEnviando(false))
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased lg:grid lg:grid-cols-2">
      {/* Columna izquierda: formulario */}
      <main id="contenido" className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Appetitos, ir al inicio">
            <Logo />
          </Link>
          <Link to="/" className="link text-label-md">
            Volver al inicio
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col py-10 sm:justify-center lg:py-12">
          <h1 className="font-display text-[40px] leading-[44px] tracking-[-0.02em] text-primary">
            Ingresá a tu cuenta
          </h1>
          <p className="mt-3 text-body-lg text-on-surface-variant">
            Pedí tus platos o gestioná los que vendés.
          </p>

          {errorGeneral !== '' && (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-lg border border-error/30 bg-error-container p-4 text-on-error-container"
            >
              <span className="material-symbols-outlined fill" aria-hidden="true">
                error
              </span>
              <div>
                <p className="text-label-lg">No pudimos ingresar</p>
                <p className="text-body-sm">{errorGeneral}</p>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="label" htmlFor="username">
                Nombre de usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="field"
                autoComplete="username"
                placeholder="clara.mendez"
                value={datos.username}
                onChange={handleChange}
                aria-invalid={errores.username ? 'true' : 'false'}
              />
              {errores.username && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.username}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className="label" htmlFor="password">
                  Contraseña
                </label>
                {/* TODO: pasar a <Link> cuando exista la pantalla de recuperación */}
                <button type="button" className="link text-label-md">
                  Olvidé mi contraseña
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={mostrarClave ? 'text' : 'password'}
                  className="field pr-24"
                  autoComplete="current-password"
                  value={datos.password}
                  onChange={handleChange}
                  aria-invalid={errores.password ? 'true' : 'false'}
                />
                <button
                  type="button"
                  className="btn btn-quiet btn-sm absolute right-1.5 top-1/2 -translate-y-1/2"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  aria-controls="password"
                >
                  {mostrarClave ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errores.password && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.password}</span>
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block !min-h-[54px]" disabled={enviando}>
              {enviando ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="mt-8 text-center text-body-md text-on-surface-variant">
            ¿Todavía no tenés cuenta?{' '}
            {/* Se pasa el mismo state para no perder la ruta de origen si se registra */}
            <Link to="/registro" state={location.state} className="link">
              Crear cuenta
            </Link>
          </p>
        </div>
      </main>

      {/* Columna derecha: panel visual (oculto en pantallas chicas) */}
      <aside
        className="on-dark relative hidden overflow-hidden bg-primary-container lg:flex lg:items-center lg:justify-center lg:p-14"
        aria-hidden="true"
      >
        <div className="flex max-w-[420px] flex-col items-center text-center">
          <div className="aspect-[4/5] w-[300px] overflow-hidden rounded-t-full rounded-b-xl bg-primary shadow-lift">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuANhvv19i3bO8CZOGjtiv3eGepjcPg20Cxpm7L-atqFfTNCG76iLDbt8QwIEjAQv9EnTFr3FB65DzsJbm18gpLKJumkzw1Q0vw-gY7YtCDrV9_c79Fi339vRxkoEPksZlx9nURqHS14P1r20LceaBdYx8VBLO2-1ieJ9xH6NNPOUpQGUsZwm5LnyBOLAJKE7QzxP4VBS8cVmRw1kzaTHo5ftnWBSkOdm5ysZesa8HjUQhnhBWWMQC36"
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <blockquote className="mt-8 font-display text-[24px] italic leading-8 text-inverse-on-surface">
            “Cada plato sale de mi cocina con mi nombre. Por eso lo cocino como si fuera para mi casa.”
          </blockquote>
          <p className="mt-3 text-body-sm text-primary-fixed-dim">
            Clara Méndez · Pastificio en Palermo
          </p>
        </div>
      </aside>
    </div>
  )
}

export default Ingreso
