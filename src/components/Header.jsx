// Encabezado principal de la aplicación Appetitos.
// Se muestra de forma fija (sticky) en la parte superior de las páginas principales.

import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

const ENLACES = [
  { texto: 'Inicio', ruta: '/' },
  { texto: 'Platos', ruta: '/catalogo' },
]

// Props:
//  - cartCount: cantidad total de platos en el carrito (el número de la insignia).
//    Lo calcula App y llega por props: el Header solo lo muestra, no sabe de dónde sale.
//  - sesion: null si no hay nadie ingresado, o { token, userId, role, nombre }. Decide qué se muestra.
//  - onLogout: función sin argumentos de App para cerrar la sesión (el Header solo avisa "quiero salir").
function Header({ cartCount, sesion, onLogout }) {
  // Estado local de UI: si el menú móvil está abierto. Solo le importa al Header,
  // por eso puede quedarse acá (la regla permite estado local de UI de un solo componente).
  const [menuOpen, setMenuOpen] = useState(false)

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
          {/* Renderizado condicional: cada enlace solo lo ve el rol que corresponde, con sesión iniciada */}
          {sesion !== null && sesion.role === 'CLIENTE' && (
            <NavLink to="/pedidos" className="nav-link">Mis pedidos</NavLink>
          )}
          {sesion !== null && sesion.role === 'CHEF' && (
            <NavLink to="/mis-publicaciones" className="nav-link">Mis publicaciones</NavLink>
          )}
          {sesion !== null && sesion.role === 'ADMIN' && (
            <NavLink to="/admin" className="nav-link">Administración</NavLink>
          )}
        </nav>

        {/* Accesos rápidos de la derecha: cuenta y carrito */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Renderizado condicional: sin sesión mostramos Ingresar / Registrarse; con sesión,
              el nombre y el botón Salir. El ícono solo aparece en pantallas chicas (lg:hidden);
              en las grandes van los dos enlaces con texto. */}
          {sesion === null ? (
            <>
              <Link
                to="/ingreso"
                className="icon-link lg:hidden"
                aria-label="Ingresar a tu cuenta"
                title="Ingresar"
              >
                <span className="material-symbols-outlined">person</span>
              </Link>
              <div className="hidden items-center gap-2 lg:flex">
                <Link to="/ingreso" className="btn btn-quiet btn-sm">Ingresar</Link>
                <Link to="/registro" className="btn btn-primary btn-sm">Registrarse</Link>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[10rem] truncate text-label-md text-primary sm:inline">{sesion.nombre}</span>
              <button type="button" className="btn btn-quiet btn-sm" onClick={onLogout}>Salir</button>
            </div>
          )}

          {/* Carrito con insignia de cantidad */}
          <Link to="/cesta" className="icon-link" aria-label={`Cesta, ${cartCount} platos`}>
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
            {sesion !== null && sesion.role === 'CLIENTE' && (
              <NavLink
                to="/pedidos"
                className="nav-link block !py-3"
                onClick={() => setMenuOpen(false)}
              >
                Mis pedidos
              </NavLink>
            )}
            {sesion !== null && sesion.role === 'CHEF' && (
              <NavLink
                to="/mis-publicaciones"
                className="nav-link block !py-3"
                onClick={() => setMenuOpen(false)}
              >
                Mis publicaciones
              </NavLink>
            )}
            {sesion !== null && sesion.role === 'ADMIN' && (
              <NavLink
                to="/admin"
                className="nav-link block !py-3"
                onClick={() => setMenuOpen(false)}
              >
                Administración
              </NavLink>
            )}
          </nav>

          {/* Sección de autenticación en el menú móvil */}
          <nav aria-label="Cuenta móvil" className="mt-2 flex flex-col border-t border-hairline pt-2">
            {sesion === null ? (
              <>
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
                  Registrarse
                </NavLink>
              </>
            ) : (
              <>
                <p className="px-3 py-2 text-label-md text-on-surface-variant">Hola, {sesion.nombre}</p>
                <button
                  type="button"
                  className="nav-link block !py-3 text-left"
                  onClick={() => {
                    setMenuOpen(false)
                    onLogout()
                  }}
                >
                  Salir
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
