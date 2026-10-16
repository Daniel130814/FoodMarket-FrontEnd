// Vista de inicio de sesión (Login) de Appetitos.
// Se usa cuando el usuario quiere ingresar a su cuenta existente.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

function Ingreso() {
  // useState nos permite guardar y actualizar datos que cambian con la interacción del usuario.
  // Cada campo del formulario tiene su propio estado local ("componente controlado").
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')

  // Estado para alternar entre mostrar u ocultar los caracteres de la contraseña
  const [mostrarClave, setMostrarClave] = useState(false)

  // Estados para manejar errores visuales sin tocar el DOM directamente
  const [errorGeneral, setErrorGeneral] = useState(false)
  const [errores, setErrores] = useState({})

  // useNavigate es un hook de React Router que nos permite redirigir al usuario por código
  const navigate = useNavigate()

  // Manejamos el envío del formulario
  const handleSubmit = (e) => {
    // Evitamos que el navegador recargue la página completa (comportamiento por defecto de HTML)
    e.preventDefault()

    const nuevosErrores = {}

    // Validamos que los campos no estén vacíos
    if (!usuario.trim()) {
      nuevosErrores.usuario = 'Escribí tu usuario o tu correo.'
    }
    // Solo verificamos que no esté vacía: la regla de longitud mínima vive en Registro
    // y las credenciales las valida el backend
    if (!clave) {
      nuevosErrores.clave = 'Escribí tu contraseña.'
    }

    // Si hay errores de validación en los campos, los guardamos y frenamos el envío
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setErrorGeneral(false)
      return
    }

    // Disparador de demo según la guía: si la clave es "error1234", simulamos error de credenciales
    if (clave === 'error1234') {
      setErrorGeneral(true)
      setErrores({})
      return
    }

    // Si todo está bien, limpiamos errores y redirigimos al inicio
    setErrorGeneral(false)
    setErrores({})
    navigate('/')
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
            {/* Campo Usuario / Correo */}
            <div>
              <label className="label" htmlFor="usuario">
                Usuario o correo
              </label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                className="field"
                autoComplete="username"
                placeholder="clara.mendez"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value)
                  // Si el usuario empieza a escribir, limpiamos el error del campo
                  if (errores.usuario) {
                    setErrores({ ...errores, usuario: null })
                  }
                }}
                aria-invalid={errores.usuario ? 'true' : 'false'}
              />
              {errores.usuario && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.usuario}</span>
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-baseline justify-between">
                <label className="label" htmlFor="clave">
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
                  id="clave"
                  name="clave"
                  type={mostrarClave ? 'text' : 'password'}
                  className="field pr-24"
                  autoComplete="current-password"
                  value={clave}
                  onChange={(e) => {
                    setClave(e.target.value)
                    if (errores.clave) {
                      setErrores({ ...errores, clave: null })
                    }
                  }}
                  aria-invalid={errores.clave ? 'true' : 'false'}
                />
                {/* Botón para alternar visibilidad de contraseña sin recargar ni tocar DOM */}
                <button
                  type="button"
                  className="btn btn-quiet btn-sm absolute right-1.5 top-1/2 -translate-y-1/2"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  aria-controls="clave"
                >
                  {mostrarClave ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              {errores.clave && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.clave}</span>
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
            <Link to="/registro" className="link">
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
