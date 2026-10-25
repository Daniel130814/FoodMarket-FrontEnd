// Raíz de la app: define las rutas y tiene el estado compartido (sesión, cesta y aviso). Se monta en main.jsx.
import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Toast from './components/comunes/Toast'
import RutaProtegida from './components/auth/RutaProtegida'
import Inicio from './views/Inicio'
import Catalogo from './views/Catalogo'
import DetallePlato from './views/DetallePlato'
import Carrito from './views/Carrito'
import Checkout from './views/Checkout'
import MisPedidos from './views/MisPedidos'
import MisPublicaciones from './views/MisPublicaciones'
import PublicarPlato from './views/PublicarPlato'
import Ingreso from './views/Ingreso'
import Registro from './views/Registro'
import Admin from './views/Admin'
import PedidosRecibidos from './views/PedidosRecibidos'
import Perfil from './views/Perfil'
import NoEncontrado from './views/NoEncontrado'

// URL base del backend (viene de .env).
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

// Clave del JWT en localStorage.
const CLAVE_TOKEN = 'jwtToken'

// Arma un carrito nuevo recalculando subtotales y total (al quitar o vaciar el backend no devuelve la cesta).
const calcularCarrito = (id, items) => {
  const itemsCalculados = items.map((item) => ({
    ...item,
    subtotalEstimado: Math.round(item.precioUnitarioActual * item.cantidad * 100) / 100,
  }))
  const totalEstimado = itemsCalculados.reduce((acumulado, item) => acumulado + item.subtotalEstimado, 0)
  return { id, items: itemsCalculados, totalEstimado: Math.round(totalEstimado * 100) / 100 }
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()

  // Cesta (CarritoResponse). Ojo: el id de cada ítem no es el del plato; la API lo usa para editarlo o quitarlo.
  const [carrito, setCarrito] = useState({ id: 1, items: [], totalEstimado: 0 })

  // Sesión: null sin usuario, o { token, userId, role, nombre }. Vive acá porque la usan el Header y las rutas protegidas.
  const [sesion, setSesion] = useState(null)

  // true mientras se verifica el token guardado: las rutas protegidas esperan en vez de mandar a /ingreso.
  const [cargandoSesion, setCargandoSesion] = useState(() => localStorage.getItem(CLAVE_TOKEN) !== null)

  const [aviso, setAviso] = useState(null)

  // Cierra la sesión por un 401 (token vencido); RutaProtegida manda a /ingreso al ver la sesión en null.
  const sesionVencida = () => {
    setSesion(null)
    localStorage.removeItem(CLAVE_TOKEN)
    setCarrito((actual) => calcularCarrito(actual.id, []))
    setAviso('Tu sesión venció, ingresá de nuevo')
  }

  // .catch de las escrituras: un 401 cierra la sesión; cualquier otro error va al Toast.
  const manejarFallo = (fallo) => {
    if (fallo.status === 401) {
      sesionVencida()
      return
    }
    setAviso(mensajeDe(fallo))
  }

  // Agrega un plato a la cesta (POST). Si ya estaba, el backend suma la cantidad y valida el stock.
  const agregar = (plato, cantidad) => {
    fetch(`${API_URL}/carrito/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sesion.token}`, // ruta privada
      },
      body: JSON.stringify({ platoId: plato.id, cantidad }),
    })
      .then(leerRespuesta)
      .then((carritoServidor) => {
        setCarrito(carritoServidor)
        setAviso(`Agregaste ${plato.nombre} a tu carrito`)
      })
      .catch(manejarFallo)
  }

  // Cambia la cantidad de un ítem por su id (PUT): la reemplaza, no suma.
  const cambiarCantidad = (itemId, cantidad) => {
    if (cantidad < 1) {
      return
    }

    fetch(`${API_URL}/carrito/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sesion.token}`, // ruta privada
      },
      body: JSON.stringify({ cantidad }),
    })
      .then(leerRespuesta)
      .then((carritoServidor) => setCarrito(carritoServidor))
      .catch(manejarFallo)
  }

  // Quita un ítem (DELETE). Responde data: null, así que lo sacamos del estado y recalculamos el total.
  const quitar = (itemId) => {
    fetch(`${API_URL}/carrito/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sesion.token}` }, // ruta privada
    })
      .then(leerRespuesta)
      .then(() =>
        setCarrito((actual) => calcularCarrito(actual.id, actual.items.filter((item) => item.id !== itemId)))
      )
      .catch(manejarFallo)
  }

  // Vacía la cesta en el servidor (DELETE /carrito) y después la copia local.
  const vaciar = () => {
    fetch(`${API_URL}/carrito`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sesion.token}` }, // ruta privada
    })
      .then(leerRespuesta)
      .then(() => {
        setCarrito((actual) => calcularCarrito(actual.id, []))
        setAviso('Vaciaste tu cesta')
      })
      .catch(manejarFallo)
  }

  // Checkout ya creó el pedido y el backend vació la cesta: vaciamos la copia local.
  const pedidoCreado = () => {
    setCarrito((actual) => calcularCarrito(actual.id, []))
    setAviso('Pedido confirmado')
  }

  // Al abrir o recargar: restaura la sesión con el token guardado (GET /users/me, el rol no viene en el JWT).
  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN)

    if (token === null) {
      return
    }

    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(leerRespuesta)
      .then((usuario) => setSesion({ token, userId: usuario.id, role: usuario.role, nombre: usuario.nombre }))
      .catch((fallo) => {
        // Con un error del servidor el token ya no sirve; si no hubo respuesta (backend apagado) lo conservamos.
        if (fallo.status !== undefined) {
          localStorage.removeItem(CLAVE_TOKEN)
        }
      })
      .finally(() => setCargandoSesion(false))
  }, [])

  // Carga la cesta del servidor cuando se ingresa o se restaura la sesión. Solo el CLIENTE tiene cesta.
  useEffect(() => {
    if (sesion === null || sesion.role !== 'CLIENTE') {
      return
    }

    fetch(`${API_URL}/carrito`, { headers: { Authorization: `Bearer ${sesion.token}` } })
      .then(leerRespuesta)
      .then((carritoServidor) => setCarrito(carritoServidor))
      // Sin manejarFallo: es una función nueva en cada render y entraría en las dependencias del efecto.
      .catch((fallo) => {
        if (fallo.status === 401) {
          sesionVencida()
          return
        }
        setAviso(mensajeDe(fallo))
      })
  }, [sesion])

  // Inicia sesión (la llaman Ingreso y Registro). El token va al estado y a localStorage para sobrevivir al F5.
  const iniciarSesion = (nuevaSesion) => {
    setSesion(nuevaSesion)
    localStorage.setItem(CLAVE_TOKEN, nuevaSesion.token)
    setAviso(`Ingresaste como ${nuevaSesion.nombre}`)
  }

  // Perfil guardó cambios: actualizamos el nombre de la sesión, que es lo que muestra el Header.
  const perfilActualizado = (usuario) => {
    setSesion((actual) => ({ ...actual, nombre: usuario.nombre }))
  }

  // Cierra la sesión y limpia la sesión, el token y la cesta, para que la próxima persona no herede sus platos.
  const cerrarSesion = () => {
    setSesion(null)
    localStorage.removeItem(CLAVE_TOKEN)
    setCarrito(calcularCarrito(carrito.id, []))
    setAviso('Cerraste sesión')
  }

  const cantidadTotal = carrito.items.reduce((acumulado, item) => acumulado + item.cantidad, 0)

  // "Salir": cierra la sesión y va al inicio (sin el navigate, RutaProtegida lo mandaría a /ingreso).
  const salir = () => {
    cerrarSesion()
    navigate('/')
  }

  // onAdd de las vistas: sin sesión manda a /ingreso, CHEF y ADMIN no pueden comprar.
  const agregarSegunSesion = (plato, cantidad) => {
    if (sesion === null) {
      navigate('/ingreso', { state: { from: location.pathname } })
      return
    }
    if (sesion.role !== 'CLIENTE') {
      setAviso('Solo los clientes pueden comprar')
      return
    }
    agregar(plato, cantidad)
  }

  // Envuelve una vista con RutaProtegida para los roles permitidos.
  const protegida = (roles, vista) => (
    <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={roles}>
      {vista}
    </RutaProtegida>
  )

  // Elige qué dibujar: las pantallas de auth ocupan todo y el resto va con Header y Footer.
  const pantalla = () => {
    const esPantallaAuth = location.pathname === '/ingreso' || location.pathname === '/registro'

    if (esPantallaAuth) {
      return (
        <Routes>
          <Route path="/ingreso" element={<Ingreso onLogin={iniciarSesion} />} />
          <Route path="/registro" element={<Registro onLogin={iniciarSesion} />} />
        </Routes>
      )
    }

    // PublicarPlato sirve para crear y para editar: se arma una vez y se usa en las dos rutas.
    const formularioPlato = protegida(
      ['CHEF'],
      <PublicarPlato
        token={sesion?.token}
        userId={sesion?.userId}
        onSesionVencida={sesionVencida}
        onAviso={setAviso}
      />
    )

    return (
      <>
        <a className="skip-link" href="#contenido">Ir al contenido</a>
        <Header cartCount={cantidadTotal} sesion={sesion} onLogout={salir} />
        <main id="contenido" className="mx-auto max-w-shell px-5 py-10 lg:px-12">
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Inicio onAdd={agregarSegunSesion} />} />
            <Route path="/catalogo" element={<Catalogo onAdd={agregarSegunSesion} />} />
            <Route path="/plato/:id" element={<DetallePlato onAdd={agregarSegunSesion} />} />

            {/* CLIENTE */}
            <Route
              path="/cesta"
              element={protegida(
                ['CLIENTE'],
                <Carrito
                  carrito={carrito}
                  cartCount={cantidadTotal}
                  onQuantityChange={cambiarCantidad}
                  onRemove={quitar}
                  onClear={vaciar}
                />
              )}
            />
            <Route
              path="/checkout"
              element={protegida(
                ['CLIENTE'],
                <Checkout
                  carrito={carrito}
                  cartCount={cantidadTotal}
                  token={sesion?.token}
                  onSesionVencida={sesionVencida}
                  onPedidoCreado={pedidoCreado}
                />
              )}
            />
            <Route
              path="/pedidos"
              element={protegida(
                ['CLIENTE'],
                <MisPedidos token={sesion?.token} onSesionVencida={sesionVencida} onAviso={setAviso} />
              )}
            />

            {/* CHEF */}
            <Route
              path="/mis-publicaciones"
              element={protegida(
                ['CHEF'],
                <MisPublicaciones token={sesion?.token} onSesionVencida={sesionVencida} onAviso={setAviso} />
              )}
            />
            <Route
              path="/pedidos-recibidos"
              element={protegida(
                ['CHEF'],
                <PedidosRecibidos
                  token={sesion?.token}
                  userId={sesion?.userId}
                  onSesionVencida={sesionVencida}
                  onAviso={setAviso}
                />
              )}
            />
            <Route path="/publicar" element={formularioPlato} />
            <Route path="/publicar/:id" element={formularioPlato} />

            {/* ADMIN */}
            <Route
              path="/admin"
              element={protegida(
                ['ADMIN'],
                <Admin token={sesion?.token} onSesionVencida={sesionVencida} onAviso={setAviso} />
              )}
            />

            {/* Cualquier rol con sesión */}
            <Route
              path="/perfil"
              element={protegida(
                ['CLIENTE', 'CHEF', 'ADMIN'],
                <Perfil
                  token={sesion?.token}
                  onSesionVencida={sesionVencida}
                  onPerfilActualizado={perfilActualizado}
                  onAviso={setAviso}
                />
              )}
            />

            {/* 404: tiene que ir última */}
            <Route path="*" element={<NoEncontrado />} />
          </Routes>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      {pantalla()}
      <Toast message={aviso ?? ''} visible={aviso !== null} onClose={() => setAviso(null)} />
    </>
  )
}

export default App
