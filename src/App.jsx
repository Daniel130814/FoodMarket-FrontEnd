// Raíz de la app: define las rutas y es DUEÑA del estado del carrito (carrito y aviso).
// Se monta desde main.jsx.
import { useState } from 'react'
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
import Ingreso from './views/Ingreso'
import Registro from './views/Registro'
import PLATOS_EJEMPLO from './data/platosEjemplo'

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
const crearSubPedido = (id, chefId, estado, detalles) => {
  const platoDelChef = PLATOS_EJEMPLO.find((p) => p.chefId === chefId)
  return {
    id,
    chefId,
    chefNombre: platoDelChef.chefNombre,
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

// Devuelve el id del chef dueño del plato de un ítem del carrito. El ítem no lo trae (la API no
// manda el chef en los ítems), así que lo buscamos en los platos por platoId.
const chefIdDelItem = (item) => PLATOS_EJEMPLO.find((plato) => plato.id === item.platoId).chefId

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

// TEMPORAL (paso 11b.3, se ELIMINA en el paso 12): para poder probar los tres roles sin backend,
// el ingreso asigna el rol según el username. Si es "cliente", "chef" o "admin" tiene ese rol;
// cualquier otro username entra como CLIENTE. En el paso 12 el rol lo manda la API en el login.
const rolDePrueba = (username) => {
  if (username === 'chef') return 'CHEF'
  if (username === 'admin') return 'ADMIN'
  return 'CLIENTE'
}

// Componente interno que evalúa la ruta actual para decidir el diseño (layout)
// Props:
//  - cartCount: total de platos del carrito. AppContent NO lo usa: solo lo reenvía al Header.
//    Eso es "prop drilling": pasar un dato por un componente intermedio hasta quien lo necesita.
//  - carrito, onQuantityChange, onRemove: también solo se reenvían, a Carrito (y carrito a Checkout).
//  - onConfirmOrder: función (domicilioId) para confirmar el pedido; se reenvía a Checkout.
//  - onAdd: función (platoId, cantidad) para agregar al carrito; se reenvía a Inicio, Catalogo (que se la pasan a PlatoCard) y DetallePlato.
//  - ordersInProgress / previousOrders: grupos de ejemplo que se reenvían a MisPedidos.
//  - onLogin: función (datos) para iniciar sesión; se reenvía a Ingreso y Registro.
//  - sesion / onLogout: la sesión actual (o null) y la función para cerrarla; se reenvían al Header.
//    AppContent además usa sesion para proteger las rutas (RutaProtegida) y para decidir si se puede agregar al carrito.
//  - onAviso: función (texto) para mostrar un Toast; AppContent la usa cuando un rol no puede comprar.
function AppContent({ cartCount, carrito, onAdd, onQuantityChange, onRemove, onConfirmOrder, ordersInProgress, previousOrders, onLogin, sesion, onLogout, onAviso }) {
  const location = useLocation()

  // useNavigate devuelve una función para cambiar de ruta desde el código. Se puede usar acá
  // porque AppContent está DENTRO del BrowserRouter (App, que está afuera, no podría).
  const navigate = useNavigate()

  // Agregar a la cesta según la sesión. Las tarjetas y el detalle reciben ESTA función en lugar de
  // onAdd, así no saben nada de sesiones: siguen avisando "quiero agregar este plato".
  //  - Sin sesión: lo mandamos a ingresar.
  //  - CHEF o ADMIN: no pueden comprar, avisamos con un Toast.
  //  - CLIENTE: agregamos de verdad (onAdd valida el stock).
  const agregarSegunSesion = (platoId, cantidad) => {
    if (sesion === null) {
      navigate('/ingreso')
      return
    }
    if (sesion.role !== 'CLIENTE') {
      onAviso('Solo los clientes pueden comprar')
      return
    }
    onAdd(platoId, cantidad)
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
      <Header cartCount={cartCount} sesion={sesion} onLogout={onLogout} />
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
              <RutaProtegida sesion={sesion} rolesPermitidos={['CLIENTE']}>
                <Carrito
                  carrito={carrito}
                  cartCount={cartCount}
                  onQuantityChange={onQuantityChange}
                  onRemove={onRemove}
                />
              </RutaProtegida>
            }
          />
          <Route
            path="/checkout"
            element={
              <RutaProtegida sesion={sesion} rolesPermitidos={['CLIENTE']}>
                <Checkout carrito={carrito} cartCount={cartCount} onConfirm={onConfirmOrder} />
              </RutaProtegida>
            }
          />
          <Route
            path="/pedidos"
            element={
              <RutaProtegida sesion={sesion} rolesPermitidos={['CLIENTE']}>
                <MisPedidos ordersInProgress={ordersInProgress} previousOrders={previousOrders} />
              </RutaProtegida>
            }
          />

          {/* LUGAR PREPARADO: estas rutas se agregan cuando existan sus vistas, con el mismo patrón.
              /mis-publicaciones, /publicar, /publicar/:id (11b.10) -> rolesPermitidos={['CHEF']}
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

  // ESTADO DE LOS PEDIDOS: la lista de pedidos del cliente, con la forma de OrderResponse.
  // Vive en App (el padre común) porque lo ESCRIBE Checkout (al confirmar crea un pedido nuevo)
  // y lo LEE Mis pedidos. Dos vistas hermanas no pueden pasarse datos entre sí: solo pueden
  // hablar con el padre que tienen en común. Por eso el estado sube hasta App.
  // Arranca con los pedidos de ejemplo. En el paso 12 se reemplaza por GET /orders.
  const [pedidos, setPedidos] = useState(PEDIDOS_EJEMPLO)

  // Estado del aviso (Toast): el texto a mostrar, o null si no hay aviso.
  const [aviso, setAviso] = useState(null)

  // Agrega un plato al carrito. Si el plato YA está, SUMA la cantidad (no la reemplaza).
  // Recibe el id del plato (no el objeto): igual que la API, POST /carrito/items { platoId, cantidad }.
  // TEMPORAL: en el mock validamos el stock contra PLATOS_EJEMPLO. En producción lo valida el
  // backend (responde 400 "no tiene stock suficiente") y esta validación se elimina.
  const agregar = (platoId, cantidad) => {
    const plato = PLATOS_EJEMPLO.find((p) => p.id === platoId)

    if (plato === undefined) {
      setAviso('El plato no está disponible para agregar al carrito')
      return
    }
    // Regla del TPO: un plato agotado (o no publicado) no se agrega.
    if (plato.estado !== 'PUBLICADO') {
      setAviso(`${plato.nombre} está agotado hoy`)
      return
    }

    const existente = carrito.items.find((item) => item.platoId === platoId)
    // La cantidad total del ítem (lo que ya había + lo nuevo) no puede superar el stock.
    const cantidadTotal = (existente === undefined ? 0 : existente.cantidad) + cantidad
    if (cantidadTotal > plato.stockDisponible) {
      setAviso(`No hay stock suficiente de ${plato.nombre}: quedan ${plato.stockDisponible}`)
      return
    }

    // map devuelve un array NUEVO; solo reemplazamos el ítem que cambió (React necesita
    // arrays y objetos nuevos para detectar el cambio de estado).
    const itemsNuevos =
      existente !== undefined
        ? carrito.items.map((item) => (item.platoId === platoId ? { ...item, cantidad: cantidadTotal } : item))
        : [
            ...carrito.items,
            {
              // id del ítem: el siguiente al más grande que haya (el backend real lo asigna solo)
              id: carrito.items.reduce((mayor, item) => Math.max(mayor, item.id), 0) + 1,
              platoId: plato.id,
              nombrePlato: plato.nombre,
              cantidad,
              precioBase: plato.precio,
              descuentoPorcentaje: plato.descuentoPorcentaje,
              precioUnitarioActual: plato.precioConDescuento,
              subtotalEstimado: 0, // lo completa calcularCarrito
            },
          ]

    setCarrito(calcularCarrito(carrito.id, itemsNuevos))
    setAviso(`Agregaste ${plato.nombre} a tu carrito`)
  }

  // Cambia la cantidad de un ítem: la REEMPLAZA (no suma). Recibe el id del ÍTEM, no del plato.
  // TEMPORAL: validamos el stock contra PLATOS_EJEMPLO; en producción lo valida el backend.
  const cambiarCantidad = (itemId, cantidad) => {
    const item = carrito.items.find((i) => i.id === itemId)
    const plato = PLATOS_EJEMPLO.find((p) => p.id === item.platoId)

    if (cantidad < 1) {
      return
    }
    if (cantidad > plato.stockDisponible) {
      setAviso(`De ${plato.nombre} quedan ${plato.stockDisponible} porciones`)
      return
    }

    const itemsNuevos = carrito.items.map((i) => (i.id === itemId ? { ...i, cantidad } : i))
    setCarrito(calcularCarrito(carrito.id, itemsNuevos))
  }

  // Quita un ítem: filter se queda con todos los que NO tienen ese id de ítem.
  const quitar = (itemId) => {
    setCarrito(calcularCarrito(carrito.id, carrito.items.filter((item) => item.id !== itemId)))
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
      .map(chefIdDelItem)
      .filter((chefId, posicion, todos) => todos.indexOf(chefId) === posicion)

    // Después, por cada chef, juntamos sus ítems y los pasamos a detalles del subpedido.
    const subPedidos = chefIds.map((chefId, i) => {
      const itemsDelChef = carrito.items.filter((item) => chefIdDelItem(item) === chefId)
      const detalles = itemsDelChef.map((item, j) =>
        crearDetalle(idPedido * 100 + i * 10 + j, item.platoId, item.cantidad)
      )
      return crearSubPedido(idPedido * 10 + i, chefId, 'PENDIENTE', detalles)
    })

    // ISO sin zona horaria, como manda la API: '2026-10-19T14:30:00'
    const fechaCreacion = new Date().toISOString().slice(0, 19)
    const pedidoNuevo = crearPedido(idPedido, fechaCreacion, 'PENDIENTE', subPedidos, domicilioEntregaId)

    // Array nuevo con el pedido al principio (...pedidos copia los anteriores).
    setPedidos([pedidoNuevo, ...pedidos])
    setCarrito(calcularCarrito(carrito.id, []))
    setAviso('Pedido confirmado')
  }

  // Inicia sesión. Ingreso y Registro la llaman con los datos del formulario.
  // SIMULADA (paso 11b.3): no hay backend, así que armamos la sesión nosotros. En el paso 12 esta
  // función hace POST /api/v1/auth/authenticate (o /register) y guarda lo que responde la API.
  //  - Registro manda tipoCuenta (CLIENTE o CHEF): ese es el rol.
  //  - Ingreso no manda tipoCuenta: el rol sale de rolDePrueba (TEMPORAL).
  const iniciarSesion = (datos) => {
    const esRegistro = datos.tipoCuenta !== undefined
    const role = esRegistro ? datos.tipoCuenta : rolDePrueba(datos.username)
    // ?? usa el valor de la derecha si el de la izquierda es undefined (el login no manda nombre).
    const nombre = datos.nombre ?? datos.username

    setSesion({ token: 'token-simulado', userId: 7, role, nombre })
    setAviso(`Ingresaste como ${nombre}`)
  }

  // Cierra la sesión: vuelve a null. (Las rutas protegidas del paso 11b.4 sacan al usuario de las
  // páginas que ya no puede ver.)
  const cerrarSesion = () => {
    setSesion(null)
    setAviso('Cerraste sesión')
  }

  // VALORES CALCULADOS: salen del carrito y de los pedidos en cada render, no se guardan aparte.
  const cantidadTotal = carrito.items.reduce((acumulado, item) => acumulado + item.cantidad, 0)
  // Por ahora App separa los pedidos en dos grupos con filter. En el paso 11b.8 esa separación
  // pasa a la vista de Mis pedidos (pestañas "En curso" y "Anteriores").
  const pedidosEnCurso = pedidos.filter((pedido) => pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO')
  const pedidosAnteriores = pedidos.filter((pedido) => pedido.estado === 'ENTREGADO' || pedido.estado === 'CANCELADO')

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
        onConfirmOrder={confirmarPedido}
        ordersInProgress={pedidosEnCurso}
        previousOrders={pedidosAnteriores}
        onLogin={iniciarSesion}
        sesion={sesion}
        onLogout={cerrarSesion}
        onAviso={setAviso}
      />
      {/* Toast: se dibuja una sola vez para toda la app; al cerrarlo el aviso vuelve a null */}
      <Toast message={aviso ?? ''} visible={aviso !== null} onClose={() => setAviso(null)} />
    </BrowserRouter>
  )
}

export default App
