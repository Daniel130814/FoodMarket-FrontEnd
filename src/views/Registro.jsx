// Vista de registro (Crear cuenta) de Appetitos.
// Permite a nuevos usuarios registrarse eligiendo si quieren comprar o vender comida.

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'

function Registro() {
  // useSearchParams nos permite leer los parámetros que vienen en la URL (por ejemplo: /registro?rol=vendedor)
  const [searchParams] = useSearchParams()
  const rolPorDefecto = searchParams.get('rol') === 'vendedor' ? 'vendedor' : 'comprador'

  // Estados locales para cada campo del formulario
  const [rol, setRol] = useState(rolPorDefecto)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [usuario, setUsuario] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')

  // Estado para mostrar u ocultar la clave
  const [mostrarClave, setMostrarClave] = useState(false)

  // Estado para los mensajes de error por campo y error general (ej: usuario duplicado)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')

  const navigate = useNavigate()

  // Validación y envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault()

    const nuevosErrores = {}

    // Validamos campos obligatorios
    if (!nombre.trim()) nuevosErrores.nombre = 'Escribí tu nombre.'
    if (!apellido.trim()) nuevosErrores.apellido = 'Escribí tu apellido.'

    // Validación de formato de usuario (entre 4 y 20 caracteres alfanuméricos, puntos o guiones)
    const regexUsuario = /^[A-Za-z0-9._]{4,20}$/
    if (!usuario.trim()) {
      nuevosErrores.usuario = 'Escribí tu nombre de usuario.'
    } else if (!regexUsuario.test(usuario)) {
      nuevosErrores.usuario = 'Usá entre 4 y 20 letras, números, puntos o guiones bajos.'
    }

    // Validación básica de correo
    if (!correo.trim()) {
      nuevosErrores.correo = 'Escribí tu correo electrónico.'
    } else if (!correo.includes('@') || !correo.includes('.')) {
      nuevosErrores.correo = 'Escribí un correo válido, por ejemplo nombre@correo.com.'
    }

    // Validación de longitud de contraseña
    if (!clave) {
      nuevosErrores.clave = 'Escribí una contraseña.'
    } else if (clave.length < 8) {
      nuevosErrores.clave = 'Usá al menos 8 caracteres.'
    }

    // Si hay errores de formato, los mostramos y no continuamos
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setErrorGeneral('')
      return
    }

    // Disparador de demo según la guía: si el usuario es "clara.mendez", simulamos conflicto 409
    if (usuario.toLowerCase() === 'clara.mendez') {
      setErrorGeneral('Ese nombre de usuario ya está en uso. Elegí otro.')
      setErrores({ usuario: 'Ese nombre de usuario ya está en uso.' })
      return
    }

    // Si todo es válido, limpiamos errores y redirigimos al inicio
    setErrores({})
    setErrorGeneral('')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased lg:grid lg:grid-cols-2">
      {/* Columna izquierda: formulario de creación de cuenta */}
      <main id="contenido" className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-8">
        {/* Cabecera con logo y enlace para volver */}
        <div className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Appetitos, ir al inicio">
            <Logo />
          </Link>
          <Link to="/" className="link text-label-md">
            Volver al inicio
          </Link>
        </div>

        {/* Contenedor central */}
        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col py-10 sm:justify-center lg:py-12">
          <h1 className="font-display text-[40px] leading-[44px] tracking-[-0.02em] text-primary">
            Creá tu cuenta
          </h1>
          <p className="mt-3 text-body-lg text-on-surface-variant">
            Lleva un minuto. Podés cambiar de rol después.
          </p>

          {/* Cartel de error general accesible */}
          {errorGeneral && (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-lg border border-error/30 bg-error-container p-4 text-on-error-container"
            >
              <span className="material-symbols-outlined fill" aria-hidden="true">
                error
              </span>
              <div>
                <p className="text-label-lg">No pudimos crear la cuenta</p>
                <p className="text-body-sm">{errorGeneral}</p>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Selección de rol: Comprador o Vendedor */}
            <fieldset>
              <legend className="label">¿Para qué usás Appetitos?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Opción Comprador */}
                <label className="option">
                  <input
                    type="radio"
                    name="rol"
                    value="comprador"
                    className="radio mt-0.5"
                    checked={rol === 'comprador'}
                    onChange={() => setRol('comprador')}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-label-lg text-primary">
                      <span className="material-symbols-outlined text-[20px] text-surface-tint" aria-hidden="true">
                        shopping_bag
                      </span>
                      Quiero comprar
                    </span>
                    <span className="mt-0.5 block text-body-sm text-on-surface-variant">
                      Pedís platos de chefs de tu barrio.
                    </span>
                  </span>
                </label>

                {/* Opción Vendedor */}
                <label className="option">
                  <input
                    type="radio"
                    name="rol"
                    value="vendedor"
                    className="radio mt-0.5"
                    checked={rol === 'vendedor'}
                    onChange={() => setRol('vendedor')}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-label-lg text-primary">
                      <span className="material-symbols-outlined text-[20px] text-surface-tint" aria-hidden="true">
                        soup_kitchen
                      </span>
                      Quiero vender
                    </span>
                    <span className="mt-0.5 block text-body-sm text-on-surface-variant">
                      Publicás tus platos y manejás tu stock.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {/* Nombre y Apellido en 2 columnas */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  className="field"
                  autoComplete="given-name"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value)
                    if (errores.nombre) setErrores({ ...errores, nombre: null })
                  }}
                  aria-invalid={errores.nombre ? 'true' : 'false'}
                />
                {errores.nombre && (
                  <p className="hint hint--error">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      error
                    </span>
                    <span>{errores.nombre}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="apellido">
                  Apellido
                </label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  className="field"
                  autoComplete="family-name"
                  value={apellido}
                  onChange={(e) => {
                    setApellido(e.target.value)
                    if (errores.apellido) setErrores({ ...errores, apellido: null })
                  }}
                  aria-invalid={errores.apellido ? 'true' : 'false'}
                />
                {errores.apellido && (
                  <p className="hint hint--error">
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      error
                    </span>
                    <span>{errores.apellido}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Nombre de usuario */}
            <div>
              <label className="label" htmlFor="usuario">
                Nombre de usuario
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
                  if (errores.usuario) setErrores({ ...errores, usuario: null })
                }}
                aria-invalid={errores.usuario ? 'true' : 'false'}
              />
              <p className="hint">Es el nombre que ven los demás. Entre 4 y 20 caracteres.</p>
              {errores.usuario && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.usuario}</span>
                </p>
              )}
            </div>

            {/* Correo electrónico */}
            <div>
              <label className="label" htmlFor="correo">
                Correo electrónico
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                className="field"
                autoComplete="email"
                placeholder="nombre@correo.com"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value)
                  if (errores.correo) setErrores({ ...errores, correo: null })
                }}
                aria-invalid={errores.correo ? 'true' : 'false'}
              />
              {errores.correo && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.correo}</span>
                </p>
              )}
            </div>

            {/* Contraseña con botón para mostrar u ocultar */}
            <div>
              <label className="label" htmlFor="clave">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="clave"
                  name="clave"
                  type={mostrarClave ? 'text' : 'password'}
                  className="field pr-24"
                  autoComplete="new-password"
                  value={clave}
                  onChange={(e) => {
                    setClave(e.target.value)
                    if (errores.clave) setErrores({ ...errores, clave: null })
                  }}
                  aria-invalid={errores.clave ? 'true' : 'false'}
                />
                <button
                  type="button"
                  className="btn btn-quiet btn-sm absolute right-1.5 top-1/2 -translate-y-1/2"
                  onClick={() => setMostrarClave(!mostrarClave)}
                  aria-controls="clave"
                >
                  {mostrarClave ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <p className="hint">Mínimo 8 caracteres.</p>
              {errores.clave && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.clave}</span>
                </p>
              )}
            </div>

            {/* Botón para enviar */}
            <button type="submit" className="btn btn-primary btn-block !min-h-[54px]">
              Crear cuenta
            </button>
          </form>

          {/* Enlace para ir al login si ya tiene cuenta */}
          <p className="mt-8 text-center text-body-md text-on-surface-variant">
            ¿Ya tenés cuenta?{' '}
            <Link to="/ingreso" className="link">
              Ingresar
            </Link>
          </p>
        </div>
      </main>

      {/* Columna derecha: beneficios de Appetitos */}
      <aside
        className="on-dark relative hidden overflow-hidden bg-primary-container lg:flex lg:items-center lg:justify-center lg:p-14"
        aria-hidden="true"
      >
        <div className="max-w-[420px]">
          <h2 className="font-display text-[34px] leading-[40px] tracking-[-0.02em] text-inverse-on-surface">
            Comida con nombre y apellido
          </h2>
          <ul className="mt-8 space-y-6">
            <li className="flex gap-4">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-white/10 text-primary-fixed">
                <span className="material-symbols-outlined" aria-hidden="true">
                  storefront
                </span>
              </span>
              <div>
                <p className="text-label-lg text-inverse-on-surface">Si cocinás</p>
                <p className="mt-0.5 text-body-md text-primary-fixed-dim">
                  Publicá tus platos con fotos, precio y stock. Mirá tus pedidos y tu stock en un solo lugar.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-white/10 text-primary-fixed">
                <span className="material-symbols-outlined" aria-hidden="true">
                  shopping_bag
                </span>
              </span>
              <div>
                <p className="text-label-lg text-inverse-on-surface">Si comprás</p>
                <p className="mt-0.5 text-body-md text-primary-fixed-dim">
                  Pedí a talleres de tu barrio y mirá de dónde viene cada ingrediente.
                </p>
              </div>
            </li>

            <li className="flex gap-4">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-white/10 text-primary-fixed">
                <span className="material-symbols-outlined" aria-hidden="true">
                  verified_user
                </span>
              </span>
              <div>
                <p className="text-label-lg text-inverse-on-surface">Para todos</p>
                <p className="mt-0.5 text-body-md text-primary-fixed-dim">
                  Verificamos cada cocina antes de que publique.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

export default Registro
