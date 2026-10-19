// Vista de inicio de sesión (Login) de Appetitos.
// Se usa cuando el usuario quiere ingresar a su cuenta existente.

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

// Props:
//  - onLogin: función (datos) que viene de App (iniciarSesion). El formulario solo le avisa
//    "este usuario quiere ingresar" con { username, password }; App decide qué pasa con la sesión.
function Ingreso({ onLogin }) {
  // useState nos permite guardar y actualizar datos que cambian con la interacción del usuario.
  // Un solo objeto guarda todos los campos del formulario ("componentes controlados"). Las claves
  // son los mismos nombres que pide la API en POST /api/v1/auth/authenticate.
  const [datos, setDatos] = useState({ username: '', password: '' })

  // Estado para alternar entre mostrar u ocultar los caracteres de la contraseña
  const [mostrarClave, setMostrarClave] = useState(false)

  // Estados para manejar errores visuales sin tocar el DOM directamente
  const [errorGeneral, setErrorGeneral] = useState(false)
  const [errores, setErrores] = useState({})

  // useNavigate es un hook de React Router que nos permite redirigir al usuario por código
  const navigate = useNavigate()

  // useLocation devuelve la ruta actual y el "state" con el que nos mandaron acá. Si venimos de
  // una ruta protegida (o de agregar a la cesta sin sesión), location.state.from es esa ruta.
  // Si entraron directo a /ingreso, location.state es null y el destino es el inicio.
  // El signo ? evita un error cuando location.state es null.
  const location = useLocation()
  const destino = location.state?.from ?? '/'

  // Un único handler para todos los inputs. event.target es el input que cambió:
  //  - name: el atributo name del input ('username' o 'password')
  //  - value: lo que escribió el usuario
  // [name]: value es una "clave calculada": usa el valor de name como clave del objeto.
  // ...datos copia los campos anteriores (el estado nunca se modifica, se reemplaza por uno nuevo).
  const handleChange = (event) => {
    const { name, value } = event.target
    setDatos({ ...datos, [name]: value })
    // Si el usuario empieza a escribir, limpiamos el error de ese campo
    if (errores[name]) {
      setErrores({ ...errores, [name]: null })
    }
  }

  // Manejamos el envío del formulario
  const handleSubmit = (event) => {
    // Evitamos que el navegador recargue la página completa (comportamiento por defecto de HTML)
    event.preventDefault()

    const nuevosErrores = {}

    // La API pide username y password no vacíos (@NotBlank)
    if (datos.username.trim() === '') {
      nuevosErrores.username = 'Escribí tu nombre de usuario.'
    }
    // Solo verificamos que no esté vacía: la regla de longitud mínima vive en Registro
    // y las credenciales las valida el backend
    if (datos.password === '') {
      nuevosErrores.password = 'Escribí tu contraseña.'
    }

    // Si hay errores de validación en los campos, los guardamos y frenamos el envío
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setErrorGeneral(false)
      return
    }

    // Disparador de demo según la guía: si la clave es "error1234", simulamos error de credenciales
    // (la API responde 401 cuando usuario o contraseña no coinciden).
    if (datos.password === 'error1234') {
      setErrorGeneral(true)
      setErrores({})
      return
    }

    // Todo bien: limpiamos errores, le avisamos a App y redirigimos al inicio.
    // El backend normaliza el username (sin espacios y en minúsculas); lo hacemos igual acá.
    setErrorGeneral(false)
    setErrores({})
    onLogin({ username: datos.username.trim().toLowerCase(), password: datos.password })
    navigate(destino)
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased lg:grid lg:grid-cols-2">
      {/* Columna izquierda: formulario de ingreso */}
      <main id="contenido" className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-8">
        {/* Barra superior con logo y enlace para volver */}
        <div className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Appetitos, ir al inicio">
            <Logo />
          </Link>
          <Link to="/" className="link text-label-md">
            Volver al inicio
          </Link>
        </div>

        {/* Contenedor central del formulario */}
        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col py-10 sm:justify-center lg:py-12">
          <h1 className="font-display text-[40px] leading-[44px] tracking-[-0.02em] text-primary">
            Ingresá a tu cuenta
          </h1>
          <p className="mt-3 text-body-lg text-on-surface-variant">
            Pedí tus platos o gestioná los que vendés.
          </p>

          {/* Cartel de error general si fallan las credenciales */}
          {errorGeneral && (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-lg border border-error/30 bg-error-container p-4 text-on-error-container"
            >
              <span className="material-symbols-outlined fill" aria-hidden="true">
                error
              </span>
              <div>
                <p className="text-label-lg">No pudimos ingresar</p>
                <p className="text-body-sm">
                  El usuario o la contraseña no coinciden. Revisalos e intentá de nuevo.
                </p>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Campo Usuario: el login es por username, no por correo */}
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

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-baseline justify-between">
                <label className="label" htmlFor="password">
                  Contraseña
                </label>
                {/* TODO: reemplazar por <Link> cuando exista la pantalla de recuperación.
                    Es un button (no un <a href="#">) para no navegar a ningún lado por ahora */}
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
                {/* Botón para alternar visibilidad de contraseña sin recargar ni tocar DOM */}
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

            {/* Botón de envío */}
            <button type="submit" className="btn btn-primary btn-block !min-h-[54px]">
              Ingresar
            </button>
          </form>

          {/* Enlace para ir a la pantalla de registro */}
          <p className="mt-8 text-center text-body-md text-on-surface-variant">
            ¿Todavía no tenés cuenta?{' '}
            {/* Pasamos el mismo state para no perder la ruta de origen si se registra */}
            <Link to="/registro" state={location.state} className="link">
              Crear cuenta
            </Link>
          </p>
        </div>
      </main>

      {/* Columna derecha: panel visual con cita y foto de chef (oculto en pantallas chicas) */}
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
