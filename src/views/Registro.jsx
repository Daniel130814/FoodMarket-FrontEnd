// Vista de registro (Crear cuenta) de Appetitos (ruta /registro).
// Permite a nuevos usuarios registrarse eligiendo si quieren comprar o vender comida.
// Crea la cuenta en el backend con POST /api/v1/auth/register.

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/layout/Logo'
import RoleOption from '../components/auth/RoleOption'

// URL base del backend. import.meta.env es la forma de Vite de leer las variables del archivo .env;
// solo se exponen las que empiezan con VITE_. Con la URL completa (con http://) armamos cada pedido.
const API_URL = import.meta.env.VITE_API_URL

// Props:
//  - onLogin: función (sesion) que viene de App (iniciarSesion). Cuando el backend crea la cuenta
//    le pasamos la sesión { token, userId, role, nombre } con lo que respondió la API.
function Registro({ onLogin }) {
  // useLocation devuelve la ruta actual: location.search es la parte de la URL que empieza con ?
  // (por ejemplo '?rol=vendedor' en /registro?rol=vendedor) y location.state es lo que nos mandaron
  // al navegar (acá, la ruta de origen para volver después de registrarse).
  const location = useLocation()
  const tipoCuentaPorDefecto = location.search === '?rol=vendedor' ? 'CHEF' : 'CLIENTE'
  const destino = location.state?.from ?? '/'

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

  // Estado: true mientras esperamos la respuesta del backend. Sirve para deshabilitar el botón y
  // evitar que un doble clic mande dos registros.
  const [enviando, setEnviando] = useState(false)

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

    // El cuerpo del pedido: los mismos campos que pide POST /api/v1/auth/register. El backend
    // normaliza username e email (sin espacios y en minúsculas); lo hacemos igual acá.
    const cuerpoPedido = {
      username: datos.username.trim().toLowerCase(),
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      email: datos.email.trim().toLowerCase(),
      password: datos.password,
      tipoCuenta: datos.tipoCuenta,
    }

    setErrores({})
    setErrorGeneral('')
    setEnviando(true)

    // POST al backend. Va dentro de este handler (se ejecuta una vez por envío) y NUNCA en un
    // useEffect: un efecto puede correr más de una vez y crearía cuentas duplicadas.
    // fetch devuelve una promesa: algo que se resuelve más tarde. Se encadena con .then()
    // (cuando llega la respuesta), .catch() (si algo falla) y .finally() (pase lo que pase).
    fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      // headers (en plural) avisa que mandamos JSON; JSON.stringify pasa el objeto a texto JSON.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpoPedido),
    })
      .then((response) =>
        // Leemos el cuerpo y recién ahí decidimos si fue éxito o error, porque fetch NO manda los
        // errores HTTP (400, 401, 500...) al .catch(): hay que mirar response.ok nosotros.
        response.json().then((respuesta) => {
          if (!response.ok) {
            const fallo = new Error(respuesta.message)
            fallo.status = response.status
            throw fallo
          }
          // La API envuelve todo en { success, message, data }: lo que nos sirve está en data.
          return respuesta.data
        })
      )
      .then((data) => {
        // data trae { access_token, userId, role } (ojo: access_token, no token). El nombre no
        // viene en la respuesta, así que usamos el que escribió la persona en el formulario.
        onLogin({ token: data.access_token, userId: data.userId, role: data.role, nombre: cuerpoPedido.nombre })
        navigate(destino)
      })
      .catch((fallo) => {
        // Un error con status viene del backend (por ejemplo el 400 "usuario ya existe"): mostramos
        // su mensaje. Sin status, ni siquiera llegamos al servidor (está apagado o hay un bloqueo).
        setErrorGeneral(
          fallo.status === undefined
            ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
            : fallo.message
        )
      })
      .finally(() => setEnviando(false))
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
            <button type="submit" className="btn btn-primary btn-block !min-h-[54px]" disabled={enviando}>
              {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {/* Enlace para ir al login si ya tiene cuenta */}
          <p className="mt-8 text-center text-body-md text-on-surface-variant">
            ¿Ya tenés cuenta?{' '}
            <Link to="/ingreso" state={location.state} className="link">
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
