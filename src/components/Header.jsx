// Encabezado principal de la aplicación Appetitos.
// Se muestra de forma fija (sticky) en la parte superior de las páginas principales.

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
        {/* Botón para desplegar menú en pantallas chicas */}
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

        <Link to="/" aria-label="Appetitos, ir al inicio">
          <Logo />
        </Link>

        {/* Navegación para pantallas grandes */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {ENLACES.map((enlace) => (
            <NavLink key={enlace.ruta} to={enlace.ruta} className="nav-link">
              {enlace.texto}
            </NavLink>
          ))}
        </nav>

        {/* Accesos rápidos de la derecha: cuenta y carrito */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Acceso a Ingreso / Cuenta */}
          <Link
            to="/ingreso"
            className="icon-link"
            aria-label="Ingresar a tu cuenta"
            title="Ingresar"
          >
            <span className="material-symbols-outlined">person</span>
          </Link>

          {/* Carrito con insignia de cantidad */}
          <Link to="/carrito" className="icon-link" aria-label={`Carrito, ${cartCount} platos`}>
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="count" aria-hidden="true">{cartCount}</span>
          </Link>
        </div>
      </div>

      {/* Menú desplegable para móviles */}
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

          {/* Sección de autenticación en el menú móvil */}
          <nav aria-label="Cuenta móvil" className="mt-2 flex flex-col border-t border-hairline pt-2">
            <NavLink
              to="/ingreso"
              className="nav-link block !py-3"
              onClick={() => setMenuOpen(false)}
            >
              Ingresar
            </NavLink>
            <NavLink
              to="/registro"
              className="nav-link block !py-3"
              onClick={() => setMenuOpen(false)}
            >
              Crear cuenta
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
