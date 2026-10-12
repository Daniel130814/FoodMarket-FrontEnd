import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Inicio from './views/Inicio'
import Catalogo from './views/Catalogo'

function App() {
  return (
    <BrowserRouter>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <Header cartCount={3} />
      <main id="contenido" className="mx-auto max-w-shell px-5 py-10 lg:px-12">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

export default App
