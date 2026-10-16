// Raíz de la app: define las rutas y es DUEÑA del estado del carrito (items y aviso).
// Se monta desde main.jsx.
import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Toast from './components/Toast'
import Inicio from './views/Inicio'
import Catalogo from './views/Catalogo'
import DetallePlato from './views/DetallePlato'
import Carrito from './views/Carrito'
import Pedidos from './views/Pedidos'
import Ingreso from './views/Ingreso'
import Registro from './views/Registro'

// Componente interno que evalúa la ruta actual para decidir el diseño (layout)
// Props:
//  - cartCount: total de platos del carrito. AppContent NO lo usa: solo lo reenvía al Header.
//    Eso es "prop drilling": pasar un dato por un componente intermedio hasta quien lo necesita.
//  - items, subtotal, onQuantityChange, onRemove, onClear: también solo se reenvían, a Carrito.
//  - onAdd: función (plato, cantidad) para agregar al carrito; se reenvía a Inicio, Catalogo (que se la pasan a PlatoCard) y DetallePlato.
function AppContent({ cartCount, items, subtotal, onAdd, onQuantityChange, onRemove, onClear }) {
  const location = useLocation()

  // Las vistas de autenticación ocupan toda la pantalla y traen su propio encabezado
  const esPantallaAuth = location.pathname === '/ingreso' || location.pathname === '/registro'

  if (esPantallaAuth) {
    return (
      <Routes>
        <Route path="/ingreso" element={<Ingreso />} />
        <Route path="/registro" element={<Registro />} />
      </Routes>
    )
  }

  return (
    <>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <Header cartCount={cartCount} />
      <main id="contenido" className="mx-auto max-w-shell px-5 py-10 lg:px-12">
        <Routes>
          <Route path="/" element={<Inicio onAdd={onAdd} />} />
          <Route path="/catalogo" element={<Catalogo onAdd={onAdd} />} />
          {/* ":id" es un parámetro: /plato/1, /plato/2... todas muestran DetallePlato */}
          <Route path="/plato/:id" element={<DetallePlato onAdd={onAdd} />} />
          <Route
            path="/carrito"
            element={
              <Carrito
                items={items}
                cartCount={cartCount}
                subtotal={subtotal}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
                onClear={onClear}
              />
            }
          />
          <Route path="/pedidos" element={<Pedidos />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

function App() {
  // ESTADO DEL CARRITO: vive acá, en el padre más alto. Según la regla de la profe, el estado
  // vive en el padre y baja a los hijos por props; los hijos le avisan con funciones.
  // Array de ítems { plato, cantidad }. Arranca vacío.
  const [items, setItems] = useState([])

  // Estado del aviso (Toast): el texto a mostrar, o null si no hay aviso.
  const [aviso, setAviso] = useState(null)

  // Agrega un plato. Devuelve true si se pudo agregar y false si no, y deja un
  // aviso para el usuario en los dos casos.
  const agregar = (plato, cantidad) => {
    // Regla del TPO: sin stock no se agrega.
    if (plato.stock === 0) {
      setAviso(`${plato.title} está agotado hoy`)
      return false
    }

    const existente = items.find((item) => item.plato.id === plato.id)

    // Regla del TPO: la cantidad de un ítem nunca supera el stock.
    if (existente !== undefined && existente.cantidad >= plato.stock) {
      setAviso(`Ya tenés las ${plato.stock} porciones disponibles de ${plato.title}`)
      return false
    }

    if (existente !== undefined) {
      // Ya estaba: sumamos a la fila existente (sin duplicarla), sin pasar el stock.
      // map devuelve un array NUEVO; solo reemplazamos el ítem que cambió.
      setItems(
        items.map((item) =>
          item.plato.id === plato.id
            ? { ...item, cantidad: Math.min(item.cantidad + cantidad, plato.stock) }
            : item
        )
      )
    } else {
      // No estaba: array nuevo con los ítems de antes (...items) y el nuevo al final.
      setItems([...items, { plato, cantidad: Math.min(cantidad, plato.stock) }])
    }
    setAviso(`Agregaste ${plato.title} a tu carrito`)
    return true
  }

  // Cambia la cantidad de un ítem, siempre entre 1 y el stock del plato.
  const cambiarCantidad = (platoId, cantidad) => {
    setItems(
      items.map((item) =>
        item.plato.id === platoId
          ? { ...item, cantidad: Math.max(1, Math.min(cantidad, item.plato.stock)) }
          : item
      )
    )
  }

  // Quita un ítem: filter se queda con todos los que NO son ese plato.
  const quitar = (platoId) => {
    setItems(items.filter((item) => item.plato.id !== platoId))
  }

  // Vacía el carrito con un array vacío nuevo.
  const vaciar = () => {
    setItems([])
  }

  // VALORES CALCULADOS: salen de items en cada render, no se guardan aparte.
  const cantidadTotal = items.reduce((acumulado, item) => acumulado + item.cantidad, 0)
  const subtotal = items.reduce((acumulado, item) => acumulado + item.plato.price * item.cantidad, 0)

  return (
    <BrowserRouter>
      {/* Todo el carrito baja por props desde acá (flujo unidireccional): los datos hacia
          abajo y las funciones on... para que los hijos avisen hacia arriba. */}
      <AppContent
        cartCount={cantidadTotal}
        items={items}
        subtotal={subtotal}
        onAdd={agregar}
        onQuantityChange={cambiarCantidad}
        onRemove={quitar}
        onClear={vaciar}
      />
      {/* Toast: se dibuja una sola vez para toda la app; al cerrarlo el aviso vuelve a null */}
      <Toast message={aviso ?? ''} visible={aviso !== null} onClose={() => setAviso(null)} />
    </BrowserRouter>
  )
}

export default App
