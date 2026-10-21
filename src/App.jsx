// Raíz de la app: define las rutas y es DUEÑA del estado del carrito (carrito y aviso).
// Se monta desde main.jsx.
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Toast from './components/Toast'
import RutaProtegida from './components/RutaProtegida'
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
import PLATOS_EJEMPLO from './data/platosEjemplo'
import MIS_PLATOS_EJEMPLO from './data/misPlatosEjemplo'
import RESENAS_EJEMPLO from './data/resenasEjemplo'
import CATEGORIAS_EJEMPLO from './data/categoriasEjemplo'
import INGREDIENTES_EJEMPLO from './data/ingredientesEjemplo'

// URL base del backend. import.meta.env es la forma de Vite de leer las variables del archivo .env.
const API_URL = import.meta.env.VITE_API_URL

// Clave con la que se guarda el JWT en localStorage. Está en una constante para escribirla una sola vez.
const CLAVE_TOKEN = 'jwtToken'

// ---------------------------------------------------------------------------------------
// PEDIDOS DE EJEMPLO (TEMPORAL, paso 11b). Tienen la forma de OrderResponse de la API
// (ENDPOINTS.md, sección 3.8): un pedido con sus subPedidos (uno por chef) y cada subPedido con
// sus detalles. En el paso 12 esto se reemplaza por GET /orders.
// Los helpers de abajo arman los objetos a partir de PLATOS_EJEMPLO para no repetir precios.
// ---------------------------------------------------------------------------------------

// Arma un detalle { id, platoId, platoNombre, cantidad, precioUnitario, subtotal }.
// precioUnitario es el precio con descuento del plato (la API lo "congela" al crear el pedido).
const crearDetalle = (id, platoId, cantidad) => {
  const plato = PLATOS_EJEMPLO.find((p) => p.id === platoId)
  return {
    id,
    platoId,
    platoNombre: plato.nombre,
    cantidad,
    precioUnitario: plato.precioConDescuento,
    subtotal: plato.precioConDescuento * cantidad,
  }
}

// Arma un subPedido de un chef. Su subtotal es la suma de los subtotales de sus detalles
// (reduce acumula un resultado recorriendo el array).
// chefNombre es opcional: si no se pasa, se busca en los platos de ejemplo (los pedidos de ejemplo).
// Los pedidos nuevos lo pasan explícito, porque sus platos son reales y no están en PLATOS_EJEMPLO.
const crearSubPedido = (id, chefId, estado, detalles, chefNombre = PLATOS_EJEMPLO.find((p) => p.chefId === chefId).chefNombre) => {
  return {
    id,
    chefId,
    chefNombre,
    estado,
    subtotal: detalles.reduce((acumulado, detalle) => acumulado + detalle.subtotal, 0),
    detalles,
  }
}

// Arma un pedido completo. precioFinal es la suma de los subtotales de sus subPedidos.
// domicilioEntregaId es opcional: si no se pasa, usa el domicilio 5 de los pedidos de ejemplo.
const crearPedido = (id, fechaCreacion, estado, subPedidos, domicilioEntregaId = 5) => ({
  id,
  userId: 7,
  domicilioEntregaId,
  fechaCreacion,
  estado,
  precioFinal: subPedidos.reduce((acumulado, subPedido) => acumulado + subPedido.subtotal, 0),
  pagoBloqueado: false,
  subPedidos,
})

// Hay un pedido en cada estado para poder probar la vista de pedidos (paso 11b.8).
const PEDIDOS_EJEMPLO = [
  crearPedido(1050, '2026-10-19T19:40:00', 'PENDIENTE', [
    crearSubPedido(80, 1, 'PENDIENTE', [crearDetalle(100, 1, 1)]),
  ]),
  crearPedido(1042, '2026-10-19T18:20:00', 'EN_PREPARACION', [
    crearSubPedido(70, 3, 'EN_PREPARACION', [crearDetalle(90, 3, 1), crearDetalle(91, 5, 1)]),
    crearSubPedido(71, 2, 'EN_PREPARACION', [crearDetalle(92, 2, 1)]),
  ]),
  crearPedido(1039, '2026-10-19T11:05:00', 'ENVIADO', [
    crearSubPedido(60, 5, 'ENVIADO', [crearDetalle(80, 8, 1)]),
  ]),
  crearPedido(1031, '2026-10-02T13:10:00', 'ENTREGADO', [
    crearSubPedido(50, 1, 'ENTREGADO', [crearDetalle(70, 7, 1)]),
  ]),
  crearPedido(1018, '2026-09-24T20:00:00', 'ENTREGADO', [
    crearSubPedido(40, 6, 'ENTREGADO', [crearDetalle(60, 9, 1)]),
    crearSubPedido(41, 4, 'ENTREGADO', [crearDetalle(61, 4, 1)]),
  ]),
  crearPedido(1004, '2026-09-15T12:30:00', 'ENTREGADO', [
    crearSubPedido(30, 3, 'ENTREGADO', [crearDetalle(50, 5, 1)]),
  ]),
  crearPedido(1002, '2026-09-10T21:15:00', 'CANCELADO', [
    crearSubPedido(20, 2, 'CANCELADO', [crearDetalle(40, 6, 1)]),
  ]),
]

// Recalcula el carrito completo a partir de sus ítems. Es la ÚNICA función que calcula
// subtotales y total: así nunca quedan desincronizados (en producción lo calcula el backend).
// Recibe el id del carrito y la lista de ítems; devuelve un carrito NUEVO { id, items, totalEstimado }.
// Math.round(x * 100) / 100 redondea a 2 decimales, como la API.
const calcularCarrito = (id, items) => {
  const itemsCalculados = items.map((item) => ({
    ...item,
    subtotalEstimado: Math.round(item.precioUnitarioActual * item.cantidad * 100) / 100,
  }))
  const totalEstimado = itemsCalculados.reduce((acumulado, item) => acumulado + item.subtotalEstimado, 0)
  return { id, items: itemsCalculados, totalEstimado: Math.round(totalEstimado * 100) / 100 }
}

// Componente interno que evalúa la ruta actual para decidir el diseño (layout)
// Props:
//  - cartCount: total de platos del carrito. AppContent NO lo usa: solo lo reenvía al Header.
//    Eso es "prop drilling": pasar un dato por un componente intermedio hasta quien lo necesita.
//  - carrito, onQuantityChange, onRemove: también solo se reenvían, a Carrito (y carrito a Checkout).
//  - onConfirmOrder: función (domicilioId) para confirmar el pedido; se reenvía a Checkout.
//  - onAdd: función (plato, cantidad) para agregar al carrito; se reenvía a Inicio, Catalogo (que se la pasan a PlatoCard) y DetallePlato.
//  - pedidos / onCancelOrder: la lista de pedidos y la función (pedidoId) para cancelar uno; se reenvían a MisPedidos.
//  - misPlatos y onStockChange / onTogglePause / onDiscount / onDeleteDish: las publicaciones del chef y
//    las acciones sobre ellas; se reenvían a MisPublicaciones (misPlatos también a PublicarPlato).
//  - onSavePlato: función (datos, platoId) para crear o editar un plato; se reenvía a PublicarPlato.
//  - onLogin: función (sesion) para iniciar sesión; se reenvía a Ingreso y Registro.
//  - sesion / cargandoSesion / onLogout: la sesión actual (o null), si se está verificando el token guardado
//    y la función para cerrarla; se reenvían al Header.
//    AppContent además usa sesion para proteger las rutas (RutaProtegida) y para decidir si se puede agregar al carrito.
//  - onAviso: función (texto) para mostrar un Toast; AppContent la usa cuando un rol no puede comprar.
function AppContent({ cartCount, carrito, onAdd, onQuantityChange, onRemove, onClear, onConfirmOrder, pedidos, onCancelOrder, misPlatos, onStockChange, onTogglePause, onDiscount, onDeleteDish, onSavePlato, onLogin, sesion, cargandoSesion, onLogout, onAviso }) {
  const location = useLocation()

  // useNavigate devuelve una función para cambiar de ruta desde el código. Se puede usar acá
  // porque AppContent está DENTRO del BrowserRouter (App, que está afuera, no podría).
  const navigate = useNavigate()

  // "Salir": cierra la sesión (App) y vuelve al inicio. Se hace acá y no en App porque App está
  // afuera del router y no puede navegar. Sin el navigate, quien sale estando en una ruta privada
  // quedaría en /ingreso, porque RutaProtegida lo redirige al ver que ya no hay sesión.
  const salir = () => {
    onLogout()
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
      onAviso('Solo los clientes pueden comprar')
      return
    }
    onAdd(plato, cantidad)
  }

  // Las vistas de autenticación ocupan toda la pantalla y traen su propio encabezado
  const esPantallaAuth = location.pathname === '/ingreso' || location.pathname === '/registro'

  if (esPantallaAuth) {
    return (
      <Routes>
        <Route path="/ingreso" element={<Ingreso onLogin={onLogin} />} />
        <Route path="/registro" element={<Registro onLogin={onLogin} />} />
      </Routes>
    )
  }

  return (
    <>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <Header cartCount={cartCount} sesion={sesion} onLogout={salir} />
      <main id="contenido" className="mx-auto max-w-shell px-5 py-10 lg:px-12">
        <Routes>
          {/* Rutas públicas: las puede ver cualquiera, con o sin sesión */}
          <Route path="/" element={<Inicio onAdd={agregarSegunSesion} />} />
          <Route path="/catalogo" element={<Catalogo onAdd={agregarSegunSesion} />} />
          {/* ":id" es un parámetro: /plato/1, /plato/2... todas muestran DetallePlato */}
          <Route path="/plato/:id" element={<DetallePlato onAdd={agregarSegunSesion} />} />

          {/* Rutas del CLIENTE: RutaProtegida decide si muestra la vista o redirige */}
          <Route
            path="/cesta"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['CLIENTE']}>
                <Carrito
                  carrito={carrito}
                  cartCount={cartCount}
                  onQuantityChange={onQuantityChange}
                  onRemove={onRemove}
                  onClear={onClear}
                />
              </RutaProtegida>
            }
          />
          <Route
            path="/checkout"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['CLIENTE']}>
                <Checkout carrito={carrito} cartCount={cartCount} onConfirm={onConfirmOrder} />
              </RutaProtegida>
            }
          />
          <Route
            path="/pedidos"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['CLIENTE']}>
                <MisPedidos pedidos={pedidos} onCancelOrder={onCancelOrder} />
              </RutaProtegida>
            }
          />

          {/* Rutas del CHEF */}
          <Route
            path="/mis-publicaciones"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['CHEF']}>
                <MisPublicaciones
                  platos={misPlatos}
                  onStockChange={onStockChange}
                  onTogglePause={onTogglePause}
                  onDiscount={onDiscount}
                  onDelete={onDeleteDish}
                />
              </RutaProtegida>
            }
          />

          {/* /publicar crea un plato; /publicar/:id edita el plato con ese id. Misma vista. */}
          <Route
            path="/publicar"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['CHEF']}>
                <PublicarPlato platos={misPlatos} onSave={onSavePlato} />
              </RutaProtegida>
            }
          />
          <Route
            path="/publicar/:id"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['CHEF']}>
                <PublicarPlato platos={misPlatos} onSave={onSavePlato} />
              </RutaProtegida>
            }
          />

          {/* LUGAR PREPARADO: esta ruta se agrega cuando exista su vista, con el mismo patrón.
              /admin (paso 14)                          -> rolesPermitidos={['ADMIN']} */}
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function App() {
  // ESTADO DEL CARRITO: vive acá, en el padre más alto. Según la regla de la profe, el estado
  // vive en el padre y baja a los hijos por props; los hijos le avisan con funciones.
  // Un objeto con la forma de CarritoResponse de la API: { id, items, totalEstimado }.
  // Arranca vacío. Cada ítem: { id, platoId, nombrePlato, cantidad, precioBase,
  // descuentoPorcentaje, precioUnitarioActual, subtotalEstimado }. Ojo: el id del ítem NO es el
  // id del plato (la API usa el id del ítem para cambiar la cantidad o quitarlo).
  const [carrito, setCarrito] = useState({ id: 1, items: [], totalEstimado: 0 })

  // ESTADO DE LA SESIÓN: null si no hay nadie ingresado, o { token, userId, role, nombre } con la
  // misma información que devuelve la API al hacer login (role: "CLIENTE", "CHEF" o "ADMIN").
  // Vive acá, en el padre, porque el Header y las rutas protegidas necesitan saber quién es.
  // Sin localStorage: al recargar la página la sesión se pierde (todavía no hay persistencia).
  const [sesion, setSesion] = useState(null)

  // ESTADO: true mientras verificamos el token guardado al abrir la app. Si hay un token guardado
  // arranca en true, para que las rutas protegidas esperen en lugar de mandarte a /ingreso; si no
  // hay token, arranca en false porque no hay nada que verificar.
  // useState acepta una función como valor inicial: se ejecuta una sola vez, al crear el estado.
  // Decidirlo acá evita llamar a setCargandoSesion de forma sincrónica dentro del efecto
  // (React lo desaconseja: provoca un redibujado extra, y el lint lo marca).
  const [cargandoSesion, setCargandoSesion] = useState(() => localStorage.getItem(CLAVE_TOKEN) !== null)

  // ESTADO DE LOS PEDIDOS: la lista de pedidos del cliente, con la forma de OrderResponse.
  // Vive en App (el padre común) porque lo ESCRIBE Checkout (al confirmar crea un pedido nuevo)
  // y lo LEE Mis pedidos. Dos vistas hermanas no pueden pasarse datos entre sí: solo pueden
  // hablar con el padre que tienen en común. Por eso el estado sube hasta App.
  // Arranca con los pedidos de ejemplo. En el paso 12 se reemplaza por GET /orders.
  const [pedidos, setPedidos] = useState(PEDIDOS_EJEMPLO)

  // ESTADO DE LAS PUBLICACIONES DEL CHEF: sus platos en cualquier estado (BORRADOR, PUBLICADO,
  // AGOTADO, PAUSADO), con la forma de PlatoResponse. Vive en App porque lo LEE MisPublicaciones
  // y lo ESCRIBE PublicarPlato (y las acciones de la lista): vistas hermanas que solo pueden
  // hablar con el padre común. Es el mismo razonamiento que el estado pedidos.
  // MOCK: son siempre las del chef de prueba. En el paso 13 se piden al backend.
  const [misPlatos, setMisPlatos] = useState(MIS_PLATOS_EJEMPLO)

  // Estado del aviso (Toast): el texto a mostrar, o null si no hay aviso.
  const [aviso, setAviso] = useState(null)

  // Agrega un plato a la cesta (paso 12.3b). Si el plato YA está, el backend SUMA la cantidad.
  // Es una ESCRITURA (POST), por eso va en el handler y nunca en un efecto.
  // Recibe el plato (tal como lo devolvió GET /platos) y la cantidad. Ya no validamos stock ni estado
  // acá: lo hace el backend y responde 400 con un mensaje ("no tiene stock suficiente", etc.).
  const agregar = (plato, cantidad) => {
    fetch(`${API_URL}/carrito/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sesion.token}`, // ruta privada
      },
      body: JSON.stringify({ platoId: plato.id, cantidad }),
    })
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      // La respuesta es la cesta COMPLETA ya actualizada: la guardamos tal cual, sin volver a pedirla.
      .then((carritoServidor) => {
        setCarrito(carritoServidor)
        setAviso(`Agregaste ${plato.nombre} a tu carrito`)
      })
      .catch((fallo) => {
        // 401: el token ya no sirve, cerramos la sesión.
        if (fallo.status === 401) {
          setSesion(null)
          localStorage.removeItem(CLAVE_TOKEN)
        }
        setAviso(fallo.message)
      })
  }

  // Cambia la cantidad de un ítem (paso 12.3c): la REEMPLAZA (no suma). Recibe el id del ÍTEM, no del plato.
  // Es una ESCRITURA (PUT), va en el handler. El stock lo valida el backend (400 "no tiene stock suficiente").
  // La respuesta es la cesta completa ya actualizada: la guardamos sin volver a pedirla.
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
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      .then((carritoServidor) => setCarrito(carritoServidor))
      .catch((fallo) => {
        // 401: el token ya no sirve, cerramos la sesión.
        if (fallo.status === 401) {
          setSesion(null)
          localStorage.removeItem(CLAVE_TOKEN)
        }
        setAviso(fallo.message)
      })
  }

  // Quita un ítem (paso 12.3d). Recibe el id del ÍTEM. Es una ESCRITURA (DELETE), va en el handler.
  // A diferencia del POST y el PUT, el DELETE responde data: null (no devuelve la cesta), así que
  // después de confirmar el éxito sacamos el ítem del estado local con filter (sin volver a pedir la cesta).
  // calcularCarrito recalcula el total con los ítems que quedan.
  const quitar = (itemId) => {
    fetch(`${API_URL}/carrito/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sesion.token}` }, // ruta privada
    })
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
        })
      )
      .then(() =>
        // La forma con función evita usar un "carrito" viejo si cambió mientras esperábamos la respuesta.
        setCarrito((actual) => calcularCarrito(actual.id, actual.items.filter((item) => item.id !== itemId)))
      )
      .catch((fallo) => {
        // 401: el token ya no sirve, cerramos la sesión.
        if (fallo.status === 401) {
          setSesion(null)
          localStorage.removeItem(CLAVE_TOKEN)
        }
        setAviso(fallo.message)
      })
  }

  // Vacía la cesta (paso 12.3e). Es una ESCRITURA (DELETE /carrito), va en el handler.
  // Responde data: null, así que tras confirmar el éxito dejamos la cesta vacía en el estado local.
  // No es lo mismo que cerrar sesión: el logout NO toca el servidor, solo limpia la copia local.
  const vaciar = () => {
    fetch(`${API_URL}/carrito`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${sesion.token}` }, // ruta privada
    })
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
        })
      )
      .then(() => {
        setCarrito((actual) => calcularCarrito(actual.id, []))
        setAviso('Vaciaste tu cesta')
      })
      .catch((fallo) => {
        // 401: el token ya no sirve, cerramos la sesión.
        if (fallo.status === 401) {
          setSesion(null)
          localStorage.removeItem(CLAVE_TOKEN)
        }
        setAviso(fallo.message)
      })
  }

  // Confirma el pedido: crea un pedido de ejemplo con estado PENDIENTE a partir de la cesta, la
  // vacía y avisa. Checkout la llama con el id del domicilio elegido (onConfirm).
  // SIMULADA (paso 11b.7): en el paso 12 esto es POST /carrito/checkout { domicilioEntregaId }, y
  // el backend arma los subpedidos, descuenta el stock y devuelve el OrderResponse.
  const confirmarPedido = (domicilioEntregaId) => {
    // Id del pedido nuevo: el siguiente al más grande (lo asigna el backend en producción).
    const idPedido = pedidos.reduce((mayor, pedido) => Math.max(mayor, pedido.id), 0) + 1

    // Un subpedido POR CHEF. Primero sacamos los chefs distintos de la cesta:
    // map pasa cada ítem a su chefId, y filter se queda con la primera aparición de cada uno
    // (indexOf devuelve la primera posición donde está el valor).
    const chefIds = carrito.items
      .map((item) => item.chefId)
      .filter((chefId, posicion, todos) => todos.indexOf(chefId) === posicion)

    // Después, por cada chef, juntamos sus ítems y los pasamos a detalles del subpedido.
    // Los datos salen del propio ítem de la cesta (los platos son reales, no de PLATOS_EJEMPLO).
    const subPedidos = chefIds.map((chefId, i) => {
      const itemsDelChef = carrito.items.filter((item) => item.chefId === chefId)
      const detalles = itemsDelChef.map((item, j) => ({
        id: idPedido * 100 + i * 10 + j,
        platoId: item.platoId,
        platoNombre: item.nombrePlato,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitarioActual,
        subtotal: item.subtotalEstimado,
      }))
      // TODO(backend): la API no trae el nombre del chef; mientras tanto mostramos "Chef n.º <id>".
      const chefNombre = itemsDelChef[0].chefNombre ?? `Chef n.º ${chefId}`
      return crearSubPedido(idPedido * 10 + i, chefId, 'PENDIENTE', detalles, chefNombre)
    })

    // ISO sin zona horaria, como manda la API: '2026-10-19T14:30:00'
    const fechaCreacion = new Date().toISOString().slice(0, 19)
    const pedidoNuevo = crearPedido(idPedido, fechaCreacion, 'PENDIENTE', subPedidos, domicilioEntregaId)

    // Array nuevo con el pedido al principio (...pedidos copia los anteriores).
    setPedidos([pedidoNuevo, ...pedidos])
    setCarrito(calcularCarrito(carrito.id, []))
    setAviso('Pedido confirmado')
  }

  // RESTAURAR LA SESIÓN al abrir la app (o al recargar con F5). useEffect ejecuta código DESPUÉS de
  // dibujar la pantalla; con [] como segundo argumento corre una sola vez, al montarse App.
  // Es el lugar correcto para un GET (leer datos). Los POST, PUT y DELETE nunca van en un efecto.
  // En desarrollo React ejecuta los efectos dos veces (Strict Mode): para un GET es inofensivo.
  // Este es el segundo punto donde se usa localStorage: LEER el token al iniciar.
  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN)

    // Sin token guardado no hay nada que restaurar (y cargandoSesion ya arrancó en false).
    if (token === null) {
      return
    }

    // GET /users/me es una ruta privada: mandamos el token en la cabecera Authorization.
    // El login no devuelve el rol dentro del JWT, por eso lo pedimos al backend.
    fetch(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) =>
        // fetch NO manda los errores HTTP al .catch(): revisamos response.ok nosotros.
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      .then((usuario) => setSesion({ token, userId: usuario.id, role: usuario.role, nombre: usuario.nombre }))
      .catch((fallo) => {
        // Si el servidor RESPONDIÓ con un error (401: token vencido o inválido), el token ya no sirve
        // y lo borramos. Si ni siquiera llegamos al servidor (status undefined, por ejemplo el backend
        // apagado), lo conservamos: en el próximo F5 puede servir.
        if (fallo.status !== undefined) {
          localStorage.removeItem(CLAVE_TOKEN)
        }
      })
      .finally(() => setCargandoSesion(false))
  }, [])

  // CARGAR LA CESTA DEL SERVIDOR (paso 12.3a). Es un GET, así que va en un efecto. La dependencia es
  // [sesion]: corre cuando alguien ingresa o cuando se restaura la sesión con F5. No hay bucle porque
  // el efecto modifica "carrito", no "sesion". Solo el CLIENTE tiene cesta (el resto recibiría 403).
  // GET /carrito es privada: lleva el token. El backend la crea vacía si no existía.
  useEffect(() => {
    if (sesion === null || sesion.role !== 'CLIENTE') {
      return
    }

    fetch(`${API_URL}/carrito`, { headers: { Authorization: `Bearer ${sesion.token}` } })
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      // Guardamos tal cual lo que manda el servidor (él calcula subtotales y total).
      .then((carritoServidor) => setCarrito(carritoServidor))
      .catch((fallo) => {
        // 401 en ruta privada: el token ya no sirve, cerramos la sesión.
        if (fallo.status === 401) {
          setSesion(null)
          localStorage.removeItem(CLAVE_TOKEN)
        }
        setAviso(fallo.message)
      })
  }, [sesion])

  // Inicia sesión: guarda la sesión que le pasan y avisa. Ingreso y Registro la llaman cuando el
  // backend responde bien, con { token, userId, role, nombre } ya armado.
  // El token se guarda en DOS lugares:
  //  - en el estado (sesion): para que React vuelva a dibujar la app con el usuario ingresado;
  //  - en localStorage: el almacenamiento del navegador, que sobrevive a recargar la página (F5).
  // localStorage solo se usa para el JWT y solo desde App.jsx: acá (guardar al ingresar), al
  // iniciar la app (leer, paso 12.1c) y al cerrar sesión (borrar).
  const iniciarSesion = (nuevaSesion) => {
    setSesion(nuevaSesion)
    localStorage.setItem(CLAVE_TOKEN, nuevaSesion.token)
    setAviso(`Ingresaste como ${nuevaSesion.nombre}`)
  }

  // Cierra la sesión. Hay que limpiar TODO lo que pertenece al usuario que se va:
  //  - la sesión (vuelve a null),
  //  - el token guardado en localStorage (el tercer punto donde se usa: BORRAR al cerrar sesión),
  //  - la cesta, para que la siguiente persona que use este navegador no herede sus platos.
  const cerrarSesion = () => {
    setSesion(null)
    // removeItem borra SOLO esta clave. Nunca localStorage.clear(), que borraría todo lo demás.
    localStorage.removeItem(CLAVE_TOKEN)
    setCarrito(calcularCarrito(carrito.id, []))
    setAviso('Cerraste sesión')
  }

  // Cancela un pedido: lo pasa a CANCELADO (y a todos sus subpedidos) y avisa con un Toast.
  // MisPedidos la llama cuando el cliente confirma el diálogo. Solo se cancelan los PENDIENTE.
  // SIMULADA (paso 11b.8): en el paso 12 esto es PATCH /orders/{id}/cancelar, y el backend repone el stock.
  // map devuelve un array NUEVO; solo reemplazamos el pedido que cambió.
  const cancelarPedido = (pedidoId) => {
    setPedidos(
      pedidos.map((pedido) =>
        pedido.id === pedidoId && pedido.estado === 'PENDIENTE'
          ? {
              ...pedido,
              estado: 'CANCELADO',
              subPedidos: pedido.subPedidos.map((subPedido) => ({ ...subPedido, estado: 'CANCELADO' })),
            }
          : pedido
      )
    )
    setAviso(`Cancelaste el pedido n.º ${pedidoId}`)
  }

  // ACCIONES DEL CHEF sobre sus publicaciones. MisPublicaciones las llama; App cambia el estado
  // misPlatos y avisa con un Toast. SIMULADAS (paso 11b.10b): en el paso 13 cada una es una
  // llamada a la API (la mayoría es PUT /platos/{id}, que reemplaza el plato entero).

  // Cambia solo algunos campos de UN plato. map devuelve un array NUEVO y reemplaza únicamente el
  // plato con ese id; {...plato, ...cambios} copia el plato y pisa los campos que cambiaron.
  const actualizarPlato = (platoId, cambios) => {
    setMisPlatos(misPlatos.map((plato) => (plato.id === platoId ? { ...plato, ...cambios } : plato)))
  }

  // Ajusta el stock. Regla de la API: un plato PUBLICADO o AGOTADO pasa a AGOTADO si el stock es 0
  // y vuelve a PUBLICADO si tiene stock; BORRADOR y PAUSADO conservan su estado.
  const ajustarStock = (platoId, stock) => {
    const plato = misPlatos.find((p) => p.id === platoId)
    const seCalculaEstado = plato.estado === 'PUBLICADO' || plato.estado === 'AGOTADO'
    const estado = seCalculaEstado ? (stock === 0 ? 'AGOTADO' : 'PUBLICADO') : plato.estado
    actualizarPlato(platoId, { stockDisponible: stock, estado })
    setAviso(`Stock de ${plato.nombre}: ${stock}`)
  }

  // Pausa un plato publicado o reactiva uno pausado.
  const pausarOReactivar = (platoId) => {
    const plato = misPlatos.find((p) => p.id === platoId)

    if (plato.estado !== 'PAUSADO') {
      actualizarPlato(platoId, { estado: 'PAUSADO' })
      setAviso(`${plato.nombre} quedó pausado`)
      return
    }
    // Reactivar = publicar, y la API exige al menos una imagen para publicar.
    if (plato.imagenesUrls.length === 0) {
      setAviso('Un plato publicado debe tener al menos una imagen')
      return
    }
    actualizarPlato(platoId, { estado: plato.stockDisponible === 0 ? 'AGOTADO' : 'PUBLICADO' })
    setAviso(`${plato.nombre} se reactivó`)
  }

  // Aplica un descuento (0 a 99,99 %). El precio base no cambia; el precio con descuento es
  // precio x (100 - porcentaje) / 100, con 2 decimales. Con 0 se quita el descuento.
  const aplicarDescuento = (platoId, porcentaje) => {
    const plato = misPlatos.find((p) => p.id === platoId)
    const precioConDescuento = Math.round(plato.precio * (100 - porcentaje)) / 100
    actualizarPlato(platoId, { descuentoPorcentaje: porcentaje, precioConDescuento })
    setAviso(porcentaje === 0 ? `Quitaste el descuento de ${plato.nombre}` : `${plato.nombre} ahora tiene ${porcentaje} % de descuento`)
  }

  // Crea o edita un plato. PublicarPlato la llama con el cuerpo de PlatoRequest (datos) y el id del
  // plato que se edita (null si es uno nuevo). Arma un plato con la forma de PlatoResponse.
  // SIMULADA (paso 11b.10c): en el paso 13 es POST /platos/createPlato (nuevo) o PUT /platos/{id}
  // (edición, que REEMPLAZA el plato entero), y el backend devuelve el plato ya armado.
  const guardarPlato = (datos, platoId) => {
    const existente = platoId === null ? undefined : misPlatos.find((plato) => plato.id === platoId)

    // Regla de la API: si el estado pedido es PUBLICADO, el backend lo recalcula según el stock
    // (stock 0 -> AGOTADO). BORRADOR y PAUSADO se respetan tal cual.
    const estado = datos.estado === 'PUBLICADO' && datos.stockDisponible === 0 ? 'AGOTADO' : datos.estado

    // PlatoRequest no trae el descuento (se maneja aparte): al editar se conserva el que tenía.
    const descuentoPorcentaje = existente === undefined ? 0 : existente.descuentoPorcentaje

    const plato = {
      // id nuevo: el siguiente al más grande (lo asigna el backend en producción)
      id: existente === undefined ? misPlatos.reduce((mayor, p) => Math.max(mayor, p.id), 0) + 1 : existente.id,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      imagenesUrls: datos.imagenesUrls,
      precio: datos.precio,
      descuentoPorcentaje,
      precioConDescuento: Math.round(datos.precio * (100 - descuentoPorcentaje)) / 100,
      stockDisponible: datos.stockDisponible,
      estado,
      chefId: existente === undefined ? 1 : existente.chefId,
      // TODO(backend): chefNombre en los platos (la API todavía solo trae chefId).
      chefNombre: existente === undefined ? 'Matteo Rossi' : existente.chefNombre,
      // La API recibe ids pero devuelve los NOMBRES de las categorías y los datos del ingrediente.
      categorias: CATEGORIAS_EJEMPLO.filter((c) => datos.categoriasIds.includes(c.id)).map((c) => c.description),
      ingredientes: datos.ingredientes.map((fila) => ({
        ingredienteId: fila.ingredienteId,
        nombre: INGREDIENTES_EJEMPLO.find((i) => i.id === fila.ingredienteId).nombre,
        cantidad: fila.cantidad,
        unidadMedida: fila.unidadMedida,
      })),
    }

    // Editar: reemplaza el plato con ese id (map). Crear: lo agrega al final (...misPlatos copia los demás).
    setMisPlatos(
      existente === undefined
        ? [...misPlatos, plato]
        : misPlatos.map((p) => (p.id === existente.id ? plato : p))
    )
    setAviso(existente === undefined ? `Creaste ${plato.nombre}` : `Guardaste los cambios de ${plato.nombre}`)
  }

  // Elimina un plato. Igual que la API: si el plato tiene historial (aparece en algún pedido o
  // tiene reseñas) NO se borra, queda PAUSADO; si no, se borra de verdad. El mensaje es el mismo
  // en los dos casos porque la API no avisa cuál de las dos pasó.
  const eliminarPlato = (platoId) => {
    const tienePedidos = pedidos.some((pedido) =>
      pedido.subPedidos.some((subPedido) => subPedido.detalles.some((detalle) => detalle.platoId === platoId))
    )
    const tieneResenas = RESENAS_EJEMPLO.some((resena) => resena.platoId === platoId)

    if (tienePedidos || tieneResenas) {
      actualizarPlato(platoId, { estado: 'PAUSADO' })
    } else {
      setMisPlatos(misPlatos.filter((plato) => plato.id !== platoId))
    }
    setAviso('Plato eliminado o pausado correctamente')
  }

  // VALOR CALCULADO: sale del carrito en cada render, no se guarda aparte.
  const cantidadTotal = carrito.items.reduce((acumulado, item) => acumulado + item.cantidad, 0)

  return (
    <BrowserRouter>
      {/* El carrito y los pedidos bajan por props desde acá (flujo unidireccional): los datos hacia
          abajo y las funciones on... para que los hijos avisen hacia arriba. */}
      <AppContent
        cartCount={cantidadTotal}
        carrito={carrito}
        onAdd={agregar}
        onQuantityChange={cambiarCantidad}
        onRemove={quitar}
        onClear={vaciar}
        onConfirmOrder={confirmarPedido}
        pedidos={pedidos}
        onCancelOrder={cancelarPedido}
        misPlatos={misPlatos}
        onStockChange={ajustarStock}
        onTogglePause={pausarOReactivar}
        onDiscount={aplicarDescuento}
        onDeleteDish={eliminarPlato}
        onSavePlato={guardarPlato}
        onLogin={iniciarSesion}
        sesion={sesion}
        cargandoSesion={cargandoSesion}
        onLogout={cerrarSesion}
        onAviso={setAviso}
      />
      {/* Toast: se dibuja una sola vez para toda la app; al cerrarlo el aviso vuelve a null */}
      <Toast message={aviso ?? ''} visible={aviso !== null} onClose={() => setAviso(null)} />
    </BrowserRouter>
  )
}

export default App
