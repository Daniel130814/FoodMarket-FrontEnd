// Contexto del carrito: guarda los ítems y las funciones para modificarlos.
// Lo comparten el Header, DetallePlato, PlatoCard y la vista Carrito (se provee en App.jsx).
import { createContext, useContext, useState } from 'react'
import Toast from '../components/Toast'

// createContext crea el "canal". El null es el valor por defecto: solo se vería
// si alguien lee el canal FUERA de un Provider (useCart lo detecta y avisa).
const CartContext = createContext(null)

// CartProvider es un componente que envuelve a otros (children) y les publica el carrito.
function CartProvider({ children }) {
  // Estado: array de ítems { plato, cantidad }. Arranca vacío.
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
      // { ...item, cantidad: n } copia el ítem con spread y pisa solo la cantidad.
      setItems(
        items.map((item) =>
          item.plato.id === plato.id
            ? { ...item, cantidad: Math.min(item.cantidad + cantidad, plato.stock) }
            : item
        )
      )
    } else {
      // No estaba: armamos un array nuevo con los ítems de antes (...items) y el nuevo al final.
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

  // VALORES CALCULADOS: salen de items en cada render, no se guardan aparte
  // (si no, habría que mantener sincronizados dos datos).
  // reduce recorre el array acumulando un resultado; arranca en 0.
  const cantidadTotal = items.reduce((acumulado, item) => acumulado + item.cantidad, 0)
  const subtotal = items.reduce((acumulado, item) => acumulado + item.plato.price * item.cantidad, 0)

  // Esto es lo que "publica" el canal: todo lo que los consumidores pueden usar.
  const value = { items, agregar, cambiarCantidad, quitar, vaciar, cantidadTotal, subtotal }

  // El Toast se dibuja acá, una sola vez para toda la app. Está "visible" cuando hay aviso;
  // al cerrarlo volvemos el aviso a null.
  return (
    <CartContext.Provider value={value}>
      {children}
      <Toast message={aviso ?? ''} visible={aviso !== null} onClose={() => setAviso(null)} />
    </CartContext.Provider>
  )
}

// Custom hook: una función que empieza con "use" y usa otros hooks adentro.
// Los componentes escriben useCart() y no necesitan conocer CartContext ni useContext.
function useCart() {
  const contexto = useContext(CartContext)

  if (contexto === null) {
    throw new Error('useCart tiene que usarse dentro de un <CartProvider>')
  }
  return contexto
}

// Exportamos un componente (CartProvider) y un hook (useCart) desde el mismo archivo.
// ESLint avisa que eso afecta la recarga rápida en desarrollo; no cambia el funcionamiento,
// así que desactivamos esa regla solo para esta línea.
// eslint-disable-next-line react-refresh/only-export-components
export { CartProvider, useCart }
