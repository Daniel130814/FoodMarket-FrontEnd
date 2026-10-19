// Vista de registro (Crear cuenta) de Appetitos.
// Permite a nuevos usuarios registrarse eligiendo si quieren comprar o vender comida.

import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import RoleOption from '../components/RoleOption'

// Props:
//  - onLogin: función (datos) que viene de App (iniciarSesion). Al registrarse, el formulario le
//    avisa con { username, nombre, apellido, email, password, tipoCuenta }.
function Registro({ onLogin }) {
  // useSearchParams nos permite leer los parámetros que vienen en la URL (por ejemplo: /registro?rol=vendedor)
  const [searchParams] = useSearchParams()
  const tipoCuentaPorDefecto = searchParams.get('rol') === 'vendedor' ? 'CHEF' : 'CLIENTE'

  // Un solo objeto guarda todos los campos. Las claves son los mismos nombres que pide la API
  // en POST /api/v1/auth/register. tipoCuenta solo puede ser "CLIENTE" o "CHEF".
  const [datos, setDatos] = useState({
    tipoCuenta: tipoCuentaPorDefecto,
    nombre: '',
    apellido: '',
    username: '',
    email: '',
    password: '',
  })

  // Estado para mostrar u ocultar la clave
  const [mostrarClave, setMostrarClave] = useState(false)

  // Estado para los mensajes de error por campo y error general (ej: usuario duplicado)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')

  const navigate = useNavigate()

  // Un único handler para todos los inputs y radios. event.target es el campo que cambió:
  // name dice cuál es ('nombre', 'email', 'tipoCuenta'...) y value es lo que tiene ahora.
  // [name]: value es una "clave calculada": usa el valor de name como clave del objeto.
  // ...datos copia los campos anteriores (el estado no se modifica, se reemplaza por uno nuevo).
  const handleChange = (event) => {
    const { name, value } = event.target
    setDatos({ ...datos, [name]: value })
    // Si el usuario corrige un campo, limpiamos su error
    if (errores[name]) {
      setErrores({ ...errores, [name]: null })
    }
  }

  // Validación y envío del formulario. Las reglas son las de la API (ENDPOINTS.md, sección 2).
  const handleSubmit = (event) => {
    event.preventDefault()

    const nuevosErrores = {}

    // nombre y apellido: obligatorios (@NotBlank)
    if (datos.nombre.trim() === '') nuevosErrores.nombre = 'Escribí tu nombre.'
    if (datos.apellido.trim() === '') nuevosErrores.apellido = 'Escribí tu apellido.'

    // username: obligatorio y de 3 a 50 caracteres
    const largoUsername = datos.username.trim().length
    if (largoUsername === 0) {
      nuevosErrores.username = 'Escribí tu nombre de usuario.'
    } else if (largoUsername < 3 || largoUsername > 50) {
      nuevosErrores.username = 'Usá entre 3 y 50 caracteres.'
    }

    // email: obligatorio y con formato válido. La expresión regular pide texto, una @, texto,
    // un punto y texto, sin espacios.
    if (datos.email.trim() === '') {
      nuevosErrores.email = 'Escribí tu correo electrónico.'
    } else if (!/^\S+@\S+\.\S+$/.test(datos.email.trim())) {
      nuevosErrores.email = 'Escribí un correo válido, por ejemplo nombre@correo.com.'
    }

    // password: obligatoria y de mínimo 8 caracteres
    if (datos.password === '') {
      nuevosErrores.password = 'Escribí una contraseña.'
    } else if (datos.password.length < 8) {
      nuevosErrores.password = 'Usá al menos 8 caracteres.'
    }

    // Si hay errores de formato, los mostramos y no continuamos
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      setErrorGeneral('')
      return
    }

    // El backend normaliza username e email (sin espacios y en minúsculas); lo hacemos igual acá.
    const usernameNormalizado = datos.username.trim().toLowerCase()

    // Disparador de demo según la guía: si el usuario es "clara.mendez", simulamos que ya existe.
    // (La API responde 400 "El usuario que se intenta agregar ya existe").
    if (usernameNormalizado === 'clara.mendez') {
      setErrorGeneral('Ese nombre de usuario ya está en uso. Elegí otro.')
      setErrores({ username: 'Ese nombre de usuario ya está en uso.' })
      return
    }

    // Todo bien: limpiamos errores, le avisamos a App con los datos normalizados y vamos al inicio.
    setErrores({})
    setErrorGeneral('')
    onLogin({
      username: usernameNormalizado,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim().toLowerCase(),
      password: datos.password,
      tipoCuenta: datos.tipoCuenta,
    })
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
            {/* Tipo de cuenta: CLIENTE (comprador) o CHEF (vendedor) */}
            <fieldset>
              <legend className="label">¿Para qué usás Appetitos?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Cada opción es un RoleOption; ambas comparten el mismo handleChange */}
                <RoleOption
                  value="CLIENTE"
                  checked={datos.tipoCuenta === 'CLIENTE'}
                  onChange={handleChange}
                  icon="shopping_bag"
                  title="Quiero comprar"
                  description="Pedís platos de chefs de tu barrio."
                />
                <RoleOption
                  value="CHEF"
                  checked={datos.tipoCuenta === 'CHEF'}
                  onChange={handleChange}
                  icon="soup_kitchen"
                  title="Quiero vender"
                  description="Publicás tus platos y manejás tu stock."
                />
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
                  value={datos.nombre}
                  onChange={handleChange}
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
                  value={datos.apellido}
                  onChange={handleChange}
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
              <p className="hint">Es el nombre con el que vas a ingresar. Entre 3 y 50 caracteres.</p>
              {errores.username && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.username}</span>
                </p>
              )}
            </div>

            {/* Correo electrónico */}
            <div>
              <label className="label" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="field"
                autoComplete="email"
                placeholder="nombre@correo.com"
                value={datos.email}
                onChange={handleChange}
                aria-invalid={errores.email ? 'true' : 'false'}
              />
              {errores.email && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.email}</span>
                </p>
              )}
            </div>

            {/* Contraseña con botón para mostrar u ocultar */}
            <div>
              <label className="label" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={mostrarClave ? 'text' : 'password'}
                  className="field pr-24"
                  autoComplete="new-password"
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
              <p className="hint">Mínimo 8 caracteres.</p>
              {errores.password && (
                <p className="hint hint--error">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    error
                  </span>
                  <span>{errores.password}</span>
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
