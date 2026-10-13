import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'
import { useCart } from '../context/CartContext'

const ENLACES = [
  { texto: 'Inicio', ruta: '/' },
  { texto: 'Platos', ruta: '/catalogo' },
]

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  // useCart() lee el carrito compartido. Renombramos cantidadTotal a cartCount para
  // no cambiar el resto del componente. Cuando alguien agrega algo, el Header se redibuja solo.
  const { cantidadTotal: cartCount } = useCart()

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-shell items-center gap-2 px-4 sm:px-5 lg:h-[76px] lg:gap-8 lg:px-12">
        <button
          type="button"
          className="btn btn-quiet btn-icon -ml-2 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="menu-movil"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>

        <Link to="/">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {ENLACES.map((enlace) => (
            <NavLink key={enlace.ruta} to={enlace.ruta} className="nav-link">
              {enlace.texto}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link to="/carrito" className="icon-link" aria-label={`Carrito, ${cartCount} platos`}>
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="count" aria-hidden="true">{cartCount}</span>
          </Link>
        </div>
      </div>

      {menuOpen && (
        <div id="menu-movil" className="border-t border-hairline bg-surface px-4 pb-4 pt-2 lg:hidden">
          <nav aria-label="Principal móvil" className="flex flex-col">
            {ENLACES.map((enlace) => (
              <NavLink
                key={enlace.ruta}
                to={enlace.ruta}
                className="nav-link block !py-3"
                onClick={() => setMenuOpen(false)}
              >
                {enlace.texto}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
