import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Inicio from './views/Inicio'
import Catalogo from './views/Catalogo'
import DetallePlato from './views/DetallePlato'
import Carrito from './views/Carrito'
import Pedidos from './views/Pedidos'
import { CartProvider } from './context/CartContext'

function App() {
  return (
    <BrowserRouter>
      {/* CartProvider envuelve Header y las rutas: todo lo que queda adentro puede usar useCart() */}
      <CartProvider>
        <a className="skip-link" href="#contenido">Ir al contenido</a>
        <Header />
        <main id="contenido" className="mx-auto max-w-shell px-5 py-10 lg:px-12">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/catalogo" element={<Catalogo />} />
            {/* ":id" es un parámetro: /plato/1, /plato/2... todas muestran DetallePlato */}
            <Route path="/plato/:id" element={<DetallePlato />} />
            <Route path="/carrito" element={<Carrito />} />
            <Route path="/pedidos" element={<Pedidos />} />
          </Routes>
        </main>
        <Footer />
      </CartProvider>
    </BrowserRouter>
  )
}

export default App
