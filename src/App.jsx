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
import Admin from './views/Admin'

// URL base del backend. import.meta.env es la forma de Vite de leer las variables del archivo .env.
const API_URL = import.meta.env.VITE_API_URL

// Clave con la que se guarda el JWT en localStorage. Está en una constante para escribirla una sola vez.
const CLAVE_TOKEN = 'jwtToken'

// GET de una ruta PÚBLICA (no lleva token). Devuelve una promesa con el "data" de la respuesta, o lanza
// un Error con el message del backend. Las listas vacías llegan como null, por eso el ?? [].
// Es una función común (no un hook): recibe una ruta y devuelve una promesa.
const pedirPublico = (ruta) =>
  fetch(`${API_URL}${ruta}`).then((response) =>
    response.json().then((cuerpo) => {
      if (!response.ok) {
        throw new Error(cuerpo.message)
      }
      return cuerpo.data ?? []
    })
  )

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
//  - onPedidoCreado: función (pedido) que registra el pedido ya creado por el backend; se reenvía a Checkout.
//  - onAdd: función (plato, cantidad) para agregar al carrito; se reenvía a Inicio, Catalogo (que se la pasan a PlatoCard) y DetallePlato.
//  - onSesionVencida / onAviso: también se reenvían a MisPedidos (que pide y cancela sus pedidos con el backend).
//  - cargandoMisPlatos / errorMisPlatos: si se están cargando las publicaciones y el error si falló; se reenvían a MisPublicaciones.
//  - misPlatos y onStockChange / onTogglePause / onDiscount / onDeleteDish: las publicaciones del chef y
//    las acciones sobre ellas; se reenvían a MisPublicaciones (misPlatos también a PublicarPlato).
//  - onPlatoCreado / onPlatoEditado: funciones (plato) que registran un plato ya guardado por el backend; se reenvían a PublicarPlato.
//  - onLogin: función (sesion) para iniciar sesión; se reenvía a Ingreso y Registro.
//  - sesion / cargandoSesion / onLogout: la sesión actual (o null), si se está verificando el token guardado
//    y la función para cerrarla; se reenvían al Header.
//    AppContent además usa sesion para proteger las rutas (RutaProtegida) y para decidir si se puede agregar al carrito.
//  - onAviso: función (texto) para mostrar un Toast; AppContent la usa cuando un rol no puede comprar.
function AppContent({ cartCount, carrito, onAdd, onQuantityChange, onRemove, onClear, onSesionVencida, onPedidoCreado, misPlatos, cargandoMisPlatos, errorMisPlatos, onStockChange, onTogglePause, onDiscount, onDeleteDish, onPlatoCreado, onPlatoEditado, onLogin, sesion, cargandoSesion, onLogout, onAviso }) {
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
                <Checkout
                  carrito={carrito}
                  cartCount={cartCount}
                  token={sesion?.token}
                  onSesionVencida={onSesionVencida}
                  onPedidoCreado={onPedidoCreado}
                />
              </RutaProtegida>
            }
          />
          <Route
            path="/pedidos"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['CLIENTE']}>
                <MisPedidos token={sesion?.token} onSesionVencida={onSesionVencida} onAviso={onAviso} />
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
                  cargando={cargandoMisPlatos}
                  error={errorMisPlatos}
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
                <PublicarPlato
                  platos={misPlatos}
                  cargandoPlatos={cargandoMisPlatos}
                  token={sesion?.token}
                  onSesionVencida={onSesionVencida}
                  onPlatoCreado={onPlatoCreado}
                  onPlatoEditado={onPlatoEditado}
                />
              </RutaProtegida>
            }
          />
          <Route
            path="/publicar/:id"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['CHEF']}>
                <PublicarPlato
                  platos={misPlatos}
                  cargandoPlatos={cargandoMisPlatos}
                  token={sesion?.token}
                  onSesionVencida={onSesionVencida}
                  onPlatoCreado={onPlatoCreado}
                  onPlatoEditado={onPlatoEditado}
                />
              </RutaProtegida>
            }
          />

          {/* Ruta del ADMIN (paso 14b): aprobar pagos de los clientes */}
          <Route
            path="/admin"
            element={
              <RutaProtegida sesion={sesion} cargandoSesion={cargandoSesion} rolesPermitidos={['ADMIN']}>
                <Admin token={sesion?.token} onSesionVencida={onSesionVencida} onAviso={onAviso} />
              </RutaProtegida>
            }
          />
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

  // ESTADO DE LAS PUBLICACIONES DEL CHEF: sus platos en cualquier estado (BORRADOR, PUBLICADO,
  // AGOTADO, PAUSADO), con la forma de PlatoResponse. Vive en App porque lo LEE MisPublicaciones
  // y lo ESCRIBE PublicarPlato (y las acciones de la lista): vistas hermanas que solo pueden
  // hablar con el padre común. Es el mismo razonamiento que el estado del carrito.
  // Arranca vacío y se llena con GET /platos cuando ingresa un CHEF (efecto de más abajo, paso 13a).
  const [misPlatos, setMisPlatos] = useState([])

  // El catálogo de categorías (GET /categories). Lo necesitamos para editar un plato con PUT: la API
  // devuelve las categorías de un plato por NOMBRE, pero el PUT las pide por ID.
  const [categorias, setCategorias] = useState([])

  // ESTADOS de carga y error de ese GET. Arranca cargando; se vuelve a poner en true al cerrar sesión.
  const [cargandoMisPlatos, setCargandoMisPlatos] = useState(true)
  const [errorMisPlatos, setErrorMisPlatos] = useState(null)

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

  // CARGAR LAS PUBLICACIONES DEL CHEF (paso 13a). Es un GET, va en un efecto con [sesion]: corre cuando
  // ingresa alguien o se restaura la sesión. Solo para el CHEF.
  // GET /platos es una ruta PÚBLICA: no se manda el token.
  // TODO(backend): no existe "mis platos". GET /platos solo trae PUBLICADO y AGOTADO y no filtra por
  // chef, así que filtramos acá por chefId (que es el userId del chef). Los BORRADOR y PAUSADO NO
  // aparecen hasta que el backend los exponga (sección 5 del CLAUDE.md).
  useEffect(() => {
    if (sesion === null || sesion.role !== 'CHEF') {
      return
    }

    // Promise.all espera a que lleguen LOS DOS GET (platos y categorías) y entrega los resultados juntos.
    Promise.all([pedirPublico('/platos'), pedirPublico('/categories')])
      .then(([platos, listaCategorias]) => {
        setMisPlatos(platos.filter((plato) => plato.chefId === sesion.userId))
        setCategorias(listaCategorias)
      })
      .catch((fallo) => setErrorMisPlatos(fallo.message))
      .finally(() => setCargandoMisPlatos(false))
  }, [sesion])

  // Se llama cuando Checkout ya creó el pedido en el backend (POST /carrito/checkout). El backend ya
  // vació la cesta del servidor, así que dejamos vacía la copia local. El pedido nuevo lo pide
  // MisPedidos con GET /orders cuando se abre esa vista.
  const pedidoCreado = () => {
    setCarrito((actual) => calcularCarrito(actual.id, []))
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

  // Cierra la sesión porque el backend respondió 401 (token vencido o inválido). Las vistas que hacen
  // sus propias llamadas (Checkout) la reciben por props. RutaProtegida las manda a /ingreso al ver sesion en null.
  const sesionVencida = () => {
    setSesion(null)
    localStorage.removeItem(CLAVE_TOKEN)
    setMisPlatos([])
    setCargandoMisPlatos(true)
    setAviso('Tu sesión venció, ingresá de nuevo')
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
    // Las publicaciones también son de ese usuario: las vaciamos y volvemos a "cargando".
    setMisPlatos([])
    setCargandoMisPlatos(true)
    setErrorMisPlatos(null)
    setAviso('Cerraste sesión')
  }

  // ACCIONES DEL CHEF sobre sus publicaciones. MisPublicaciones las llama; App las ejecuta contra la API
  // y avisa con un Toast. Stock, pausar, reactivar (13d),
  // descuento (13e) y eliminar (13f) son REALES.

  // Guarda un cambio en UN plato con PUT /platos/{id} (paso 13d). La API no tiene PATCH para el stock ni
  // para el estado, y el PUT REEMPLAZA el plato entero (lo que no se manda se borra). Por eso armamos el
  // PlatoRequest COMPLETO a partir del plato actual y le pisamos solo lo que cambia ("cambios").
  // Es una escritura: la llaman los handlers de abajo, nunca un efecto. Con el plato que devuelve el
  // backend reemplazamos el de la lista (map), sin volver a pedir todos los platos.
  // mensaje: función (plato guardado) que arma el texto del Toast.
  const guardarCambios = (plato, cambios, mensaje) => {
    const platoRequest = {
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: plato.precio,
      stockDisponible: plato.stockDisponible,
      estado: plato.estado,
      imagenesUrls: plato.imagenesUrls,
      // El plato trae los NOMBRES de sus categorías; el PUT necesita los ids (del catálogo).
      categoriasIds: categorias.filter((categoria) => plato.categorias.includes(categoria.description)).map((categoria) => categoria.id),
      ingredientes: plato.ingredientes.map((ingrediente) => ({
        ingredienteId: ingrediente.ingredienteId,
        cantidad: ingrediente.cantidad,
        unidadMedida: ingrediente.unidadMedida,
      })),
      ...cambios,
    }

    fetch(`${API_URL}/platos/${plato.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sesion.token}`, // ruta privada
      },
      body: JSON.stringify(platoRequest),
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
      .then((guardado) => {
        setMisPlatos((actuales) => actuales.map((p) => (p.id === guardado.id ? guardado : p)))
        setAviso(mensaje(guardado))
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          sesionVencida()
          return
        }
        // 400 (por ejemplo, publicar sin imagen), 403 (no es tu plato), 404: mensaje del backend.
        setAviso(fallo.message)
      })
  }

  // Ajusta el stock. NO mandamos "estado" (lo pisamos con undefined, que JSON.stringify omite): sin estado
  // el backend aplica su regla: PUBLICADO con stock 0 pasa a AGOTADO, AGOTADO con stock > 0 vuelve a
  // PUBLICADO, y BORRADOR y PAUSADO conservan el suyo.
  const ajustarStock = (platoId, stock) => {
    const plato = misPlatos.find((p) => p.id === platoId)
    guardarCambios(plato, { stockDisponible: stock, estado: undefined }, (guardado) => `Stock de ${guardado.nombre}: ${guardado.stockDisponible}`)
  }

  // Pausa un plato publicado o reactiva uno pausado. Reactivar = mandar PUBLICADO; el backend lo pasa a
  // AGOTADO si el stock es 0 y responde 400 si el plato no tiene imagen (lo mostramos en el Toast).
  // TODO(backend): un plato PAUSADO no vuelve en GET /platos, así que tras recargar no se lo puede reactivar.
  const pausarOReactivar = (platoId) => {
    const plato = misPlatos.find((p) => p.id === platoId)

    if (plato.estado !== 'PAUSADO') {
      guardarCambios(plato, { estado: 'PAUSADO' }, (guardado) => `${guardado.nombre} quedó pausado`)
      return
    }
    guardarCambios(plato, { estado: 'PUBLICADO' }, (guardado) => `${guardado.nombre} se reactivó`)
  }

  // Aplica o quita un descuento (paso 13e). Con un porcentaje de 0,01 a 99,99 es
  // PATCH /platos/{id}/descuento { porcentaje }; con 0 es DELETE /platos/{id}/descuento (quita el descuento).
  // Los dos devuelven el plato ya actualizado (con precioConDescuento calculado por el backend): con él
  // reemplazamos el de la lista (map), sin volver a pedir todos los platos.
  // Es una escritura: la llama MisPublicaciones al confirmar el diálogo, nunca un efecto.
  const aplicarDescuento = (platoId, porcentaje) => {
    const plato = misPlatos.find((p) => p.id === platoId)
    const quitar = porcentaje === 0

    fetch(`${API_URL}/platos/${platoId}/descuento`, {
      method: quitar ? 'DELETE' : 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sesion.token}`, // ruta privada
      },
      // El DELETE no lleva cuerpo; el PATCH manda el porcentaje.
      body: quitar ? undefined : JSON.stringify({ porcentaje }),
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
      .then((guardado) => {
        setMisPlatos((actuales) => actuales.map((p) => (p.id === guardado.id ? guardado : p)))
        setAviso(quitar ? `Quitaste el descuento de ${plato.nombre}` : `${plato.nombre} ahora tiene ${porcentaje} % de descuento`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          sesionVencida()
          return
        }
        // 400 (porcentaje fuera de rango), 403 (no es tu plato), 404: mensaje del backend.
        setAviso(fallo.message)
      })
  }

  // Registra un plato que el backend ya creó (paso 13b). PublicarPlato la llama con el PlatoResponse que
  // devolvió POST /platos/createPlato. Lo sumamos a las publicaciones SIN volver a pedir la lista.
  // TODO(backend): si se creó como BORRADOR, al recargar no vuelve a aparecer (GET /platos no lo trae).
  const platoCreado = (plato) => {
    setMisPlatos((actuales) => [...actuales, plato])
    setAviso(`Creaste ${plato.nombre}`)
  }

  // Registra un plato que el backend ya editó (paso 13c). PublicarPlato la llama con el PlatoResponse que
  // devolvió PUT /platos/{id}. Reemplazamos el plato con ese id por el que devolvió el backend (map),
  // SIN volver a pedir la lista.
  const platoEditado = (plato) => {
    setMisPlatos((actuales) => actuales.map((p) => (p.id === plato.id ? plato : p)))
    setAviso(`Guardaste los cambios de ${plato.nombre}`)
  }

  // Elimina un plato (paso 13f): DELETE /platos/{id}, que responde data: null. El backend decide: si el
  // plato tiene historial (pedidos, reseñas o está en un carrito) NO se borra, queda PAUSADO; si no, se
  // borra de verdad. Y NO avisa cuál de las dos pasó (TODO(backend): que lo informe).
  // Da igual para la lista: un plato pausado tampoco vuelve en GET /platos. Por eso, después de confirmar
  // el éxito, lo sacamos del estado con filter (sin volver a pedir la lista), igual que quedaría tras recargar.
  // Es una escritura: la llama MisPublicaciones al confirmar el diálogo.
  const eliminarPlato = (platoId) => {
    fetch(`${API_URL}/platos/${platoId}`, {
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
          return cuerpo.message
        })
      )
      .then((mensaje) => {
        setMisPlatos((actuales) => actuales.filter((plato) => plato.id !== platoId))
        setAviso(mensaje)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          sesionVencida()
          return
        }
        // 403 (no es tu plato), 404: mensaje del backend.
        setAviso(fallo.message)
      })
  }

  // VALOR CALCULADO: sale del carrito en cada render, no se guarda aparte.
  const cantidadTotal = carrito.items.reduce((acumulado, item) => acumulado + item.cantidad, 0)

  return (
    <BrowserRouter>
      {/* El carrito baja por props desde acá (flujo unidireccional): los datos hacia
          abajo y las funciones on... para que los hijos avisen hacia arriba. */}
      <AppContent
        cartCount={cantidadTotal}
        carrito={carrito}
        onAdd={agregar}
        onQuantityChange={cambiarCantidad}
        onRemove={quitar}
        onClear={vaciar}
        onSesionVencida={sesionVencida}
        onPedidoCreado={pedidoCreado}
        misPlatos={misPlatos}
        onStockChange={ajustarStock}
        onTogglePause={pausarOReactivar}
        onDiscount={aplicarDescuento}
        onDeleteDish={eliminarPlato}
        onPlatoCreado={platoCreado}
        onPlatoEditado={platoEditado}
        cargandoMisPlatos={cargandoMisPlatos}
        errorMisPlatos={errorMisPlatos}
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
