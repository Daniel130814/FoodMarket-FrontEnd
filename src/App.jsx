// Raíz de la app: define las rutas y es DUEÑA del estado compartido (sesión, cesta y aviso).
// Se monta desde main.jsx, dentro del BrowserRouter.
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

// URL base del backend. import.meta.env es la forma de Vite de leer las variables del archivo .env.
const API_URL = import.meta.env.VITE_API_URL

// Texto de un error de fetch para mostrárselo al usuario: el "message" del backend si respondió con un
// error (400, 403...) o uno claro si ni llegamos al servidor (apagado, sin red; ahí el error no tiene status).
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// Lee la respuesta del backend; se usa como .then(leerRespuesta) en todos los fetch de este archivo.
// fetch NO manda los errores HTTP al .catch(), por eso revisamos response.ok: si falló, lanzamos un Error
// con el "message" y el status del backend; si no, devuelve cuerpo.data (null en los DELETE).
const leerRespuesta = (response) =>
  response.json().then((cuerpo) => {
    if (!response.ok) {
      const fallo = new Error(cuerpo.message)
      fallo.status = response.status
      throw fallo
    }
    return cuerpo.data
  })

// Clave con la que se guarda el JWT en localStorage.
const CLAVE_TOKEN = 'jwtToken'

// Recalcula subtotales y total a partir de los ítems (se usa al quitar o vaciar, donde el backend no
// devuelve la cesta). Recibe el id del carrito y los ítems; devuelve un carrito NUEVO { id, items, totalEstimado }.
// Math.round(x * 100) / 100 redondea a 2 decimales, como la API.
const calcularCarrito = (id, items) => {
  const itemsCalculados = items.map((item) => ({
    ...item,
    subtotalEstimado: Math.round(item.precioUnitarioActual * item.cantidad * 100) / 100,
  }))
  const totalEstimado = itemsCalculados.reduce((acumulado, item) => acumulado + item.subtotalEstimado, 0)
  return { id, items: itemsCalculados, totalEstimado: Math.round(totalEstimado * 100) / 100 }
}

function App() {
  // Los hooks del Router funcionan acá porque main.jsx envuelve App con <BrowserRouter>.
  const location = useLocation()
  const navigate = useNavigate()

  // ESTADO DE LA CESTA: vive acá, en el padre más alto; baja a los hijos por props y ellos avisan con funciones.
  // Tiene la forma de CarritoResponse de la API: { id, items, totalEstimado }. Ojo: el id de cada ítem
  // NO es el id del plato (la API usa el id del ítem para cambiar la cantidad o quitarlo).
  const [carrito, setCarrito] = useState({ id: 1, items: [], totalEstimado: 0 })

  // ESTADO DE LA SESIÓN: null si no hay nadie ingresado, o { token, userId, role, nombre } (role: "CLIENTE",
  // "CHEF" o "ADMIN"). Vive acá porque el Header y las rutas protegidas necesitan saber quién es.
  // Al recargar se restaura con el token guardado en localStorage (efecto de más abajo).
  const [sesion, setSesion] = useState(null)

  // ESTADO: true mientras verificamos el token guardado, para que las rutas protegidas esperen en lugar de
  // mandarte a /ingreso. useState acepta una función como valor inicial (se ejecuta una sola vez), y así
  // arranca en false si no hay token, sin llamar a setCargandoSesion dentro del efecto (el lint lo marca).
  const [cargandoSesion, setCargandoSesion] = useState(() => localStorage.getItem(CLAVE_TOKEN) !== null)

  // Estado del aviso (Toast): el texto a mostrar, o null si no hay aviso.
  const [aviso, setAviso] = useState(null)

  // Cierra la sesión porque el backend respondió 401 (token vencido). Las vistas la reciben por props;
  // RutaProtegida las manda a /ingreso al ver sesion en null. Limpia lo mismo que cerrarSesion.
  const sesionVencida = () => {
    setSesion(null)
    localStorage.removeItem(CLAVE_TOKEN)
    setCarrito((actual) => calcularCarrito(actual.id, []))
    setAviso('Tu sesión venció, ingresá de nuevo')
  }

  // Maneja el error de un fetch a una ruta privada: si es 401 el token ya no sirve y cerramos la sesión;
  // si no, mostramos el mensaje en el Toast. Se usa como .catch(manejarFallo).
  const manejarFallo = (fallo) => {
    if (fallo.status === 401) {
      sesionVencida()
      return
    }
    setAviso(mensajeDe(fallo))
  }

  // Agrega un plato a la cesta (si ya está, el backend SUMA la cantidad). Es una ESCRITURA (POST): va en el
  // handler y nunca en un efecto. El stock lo valida el backend (400 "no tiene stock suficiente").
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
      // La respuesta es la cesta COMPLETA ya actualizada: la guardamos tal cual, sin volver a pedirla.
      .then((carritoServidor) => {
        setCarrito(carritoServidor)
        setAviso(`Agregaste ${plato.nombre} a tu carrito`)
      })
      .catch(manejarFallo)
  }

  // Cambia la cantidad de un ítem (PUT): la REEMPLAZA, no suma. Recibe el id del ÍTEM, no del plato.
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

  // Quita un ítem (DELETE). Responde data: null, así que tras el éxito lo sacamos del estado con filter
  // (sin volver a pedir la cesta) y calcularCarrito recalcula el total.
  const quitar = (itemId) => {
    fetch(`${API_URL}/carrito/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sesion.token}` }, // ruta privada
    })
      .then(leerRespuesta)
      .then(() =>
        // La forma con función evita usar un "carrito" viejo si cambió mientras esperábamos la respuesta.
        setCarrito((actual) => calcularCarrito(actual.id, actual.items.filter((item) => item.id !== itemId)))
      )
      .catch(manejarFallo)
  }

  // Vacía la cesta (DELETE /carrito). Tras el éxito dejamos la cesta vacía en el estado local.
  // No es lo mismo que cerrar sesión: el logout NO toca el servidor, solo limpia la copia local.
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

  // Se llama cuando Checkout ya creó el pedido. El backend vació la cesta del servidor: vaciamos la copia local.
  const pedidoCreado = () => {
    setCarrito((actual) => calcularCarrito(actual.id, []))
    setAviso('Pedido confirmado')
  }

  // RESTAURAR LA SESIÓN al abrir la app o recargar con F5. useEffect corre DESPUÉS de dibujar la pantalla;
  // con [] corre una sola vez, al montarse App. Es el lugar de los GET (en desarrollo corre dos veces por
  // Strict Mode: para un GET es inofensivo). Acá se LEE el token de localStorage.
  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN)

    // Sin token guardado no hay nada que restaurar (y cargandoSesion ya arrancó en false).
    if (token === null) {
      return
    }

    // El rol no viene dentro del JWT: lo pedimos con GET /users/me, mandando el token en Authorization.
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(leerRespuesta)
      .then((usuario) => setSesion({ token, userId: usuario.id, role: usuario.role, nombre: usuario.nombre }))
      .catch((fallo) => {
        // Si el servidor respondió con un error el token ya no sirve y lo borramos; si ni llegamos al
        // servidor (status undefined, backend apagado) lo conservamos: en el próximo F5 puede servir.
        if (fallo.status !== undefined) {
          localStorage.removeItem(CLAVE_TOKEN)
        }
      })
      .finally(() => setCargandoSesion(false))
  }, [])

  // CARGAR LA CESTA DEL SERVIDOR. Corre con [sesion]: cuando alguien ingresa o se restaura la sesión.
  // No hay bucle porque el efecto modifica "carrito", no "sesion". Solo el CLIENTE tiene cesta.
  useEffect(() => {
    if (sesion === null || sesion.role !== 'CLIENTE') {
      return
    }

    fetch(`${API_URL}/carrito`, { headers: { Authorization: `Bearer ${sesion.token}` } })
      .then(leerRespuesta)
      // Guardamos tal cual lo que manda el servidor (él calcula subtotales y total).
      .then((carritoServidor) => setCarrito(carritoServidor))
      // Sin manejarFallo: es una función nueva en cada render y habría que ponerla en las dependencias.
      .catch((fallo) => {
        if (fallo.status === 401) {
          sesionVencida()
          return
        }
        setAviso(mensajeDe(fallo))
      })
  }, [sesion])

  // Inicia sesión: la llaman Ingreso y Registro cuando el backend responde bien, con la sesión ya armada.
  // El token se guarda en el estado (para redibujar la app) y en localStorage (sobrevive al F5).
  // localStorage solo se usa para el JWT, desde App.jsx: acá guardamos, arriba leemos y al salir borramos.
  const iniciarSesion = (nuevaSesion) => {
    setSesion(nuevaSesion)
    localStorage.setItem(CLAVE_TOKEN, nuevaSesion.token)
    setAviso(`Ingresaste como ${nuevaSesion.nombre}`)
  }

  // Se llama cuando Perfil ya guardó los cambios en el backend (PUT /users/me). Actualizamos solo el nombre
  // de la sesión (es lo que muestra el Header); el token, el userId y el rol no cambian.
  const perfilActualizado = (usuario) => {
    setSesion((actual) => ({ ...actual, nombre: usuario.nombre }))
  }

  // Cierra la sesión limpiando TODO lo del usuario que se va: la sesión, el token y la cesta
  // (para que la siguiente persona que use este navegador no herede sus platos).
  const cerrarSesion = () => {
    setSesion(null)
    // removeItem borra SOLO esta clave. Nunca localStorage.clear(), que borraría todo lo demás.
    localStorage.removeItem(CLAVE_TOKEN)
    setCarrito(calcularCarrito(carrito.id, []))
    setAviso('Cerraste sesión')
  }

  // VALOR CALCULADO: sale del carrito en cada render, no se guarda aparte.
  const cantidadTotal = carrito.items.reduce((acumulado, item) => acumulado + item.cantidad, 0)

  // "Salir": cierra la sesión y vuelve al inicio. Sin el navigate, quien sale estando en una ruta privada
  // quedaría en /ingreso, porque RutaProtegida lo redirige al ver que ya no hay sesión.
  const salir = () => {
    cerrarSesion()
    navigate('/')
  }

  // Agregar a la cesta según la sesión. Las tarjetas y el detalle reciben ESTA función en lugar de
  // onAdd, así no saben nada de sesiones: siguen avisando "quiero agregar este plato".
  //  - Sin sesión: lo mandamos a ingresar (y después vuelve a esta misma página).
  //  - CHEF o ADMIN: no pueden comprar, avisamos con un Toast.
  //  - CLIENTE: agregamos de verdad (onAdd valida el stock).
  const agregarSegunSesion = (plato, cantidad) => {
    if (sesion === null) {
      // Mandamos la ruta actual como "state" para volver acá después de ingresar.
      navigate('/ingreso', { state: { from: location.pathname } })
      return
    }
    if (sesion.role !== 'CLIENTE') {
      setAviso('Solo los clientes pueden comprar')
      return
    }
    agregar(plato, cantidad)
  }

  // Envuelve una vista con RutaProtegida para no repetir sus props en cada ruta privada. Recibe los roles
  // que pueden entrar y la vista ya armada; devuelve el "element" de la ruta. No es un componente: es una
  // función que devuelve JSX, igual que pantalla().
  const protegida = (roles, vista) => (
    <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={roles}>
      {vista}
    </RutaProtegida>
  )

  // Decide qué pantalla dibujar según la ruta actual. Cada if con return corta en el primer caso.
  const pantalla = () => {
    // Las vistas de autenticación ocupan toda la pantalla y traen su propio encabezado
    const esPantallaAuth = location.pathname === '/ingreso' || location.pathname === '/registro'

    if (esPantallaAuth) {
      return (
        <Routes>
          <Route path="/ingreso" element={<Ingreso onLogin={iniciarSesion} />} />
          <Route path="/registro" element={<Registro onLogin={iniciarSesion} />} />
        </Routes>
      )
    }

    // PublicarPlato se usa en dos rutas (crear y editar): lo armamos una sola vez y lo reutilizamos.
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
            {/* Rutas públicas: las puede ver cualquiera, con o sin sesión */}
            <Route path="/" element={<Inicio onAdd={agregarSegunSesion} />} />
            <Route path="/catalogo" element={<Catalogo onAdd={agregarSegunSesion} />} />
            {/* ":id" es un parámetro: /plato/1, /plato/2... todas muestran DetallePlato */}
            <Route path="/plato/:id" element={<DetallePlato onAdd={agregarSegunSesion} />} />

            {/* Rutas del CLIENTE: protegida() decide si muestra la vista o redirige */}
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

            {/* Rutas del CHEF */}
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
            {/* /publicar crea un plato y /publicar/:id lo edita: misma vista, armada una sola vez arriba */}
            <Route path="/publicar" element={formularioPlato} />
            <Route path="/publicar/:id" element={formularioPlato} />

            {/* Ruta del ADMIN */}
            <Route
              path="/admin"
              element={protegida(
                ['ADMIN'],
                <Admin token={sesion?.token} onSesionVencida={sesionVencida} onAviso={setAviso} />
              )}
            />

            {/* Perfil: lo puede ver cualquier usuario con sesión, sea cual sea su rol */}
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

            {/* Comodín: "*" coincide con cualquier ruta que no coincidió antes, por eso va ÚLTIMA */}
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
      {/* Toast: se dibuja una sola vez para toda la app; al cerrarlo el aviso vuelve a null */}
      <Toast message={aviso ?? ''} visible={aviso !== null} onClose={() => setAviso(null)} />
    </>
  )
}

export default App
