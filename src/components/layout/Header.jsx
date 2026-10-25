// Encabezado fijo (sticky) de las páginas principales.

import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

const ENLACES = [
  { texto: 'Inicio', ruta: '/' },
  { texto: 'Platos', ruta: '/catalogo' },
]

// Props: cartCount (número de la insignia), sesion (null o { token, userId, role, nombre }; decide qué se muestra), onLogout (App cierra la sesión).
function Header({ cartCount, sesion, onLogout }) {
  // Menú móvil abierto o cerrado (UI propia del Header).
  const [menuOpen, setMenuOpen] = useState(false)

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

        <Link to="/" aria-label="Appetitos, ir al inicio">
          <Logo />
        </Link>

        {/* Navegación (pantallas grandes) */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {ENLACES.map((enlace) => (
            <NavLink key={enlace.ruta} to={enlace.ruta} className="nav-link">
              {enlace.texto}
            </NavLink>
          ))}
          {/* Cada enlace lo ve solo el rol que corresponde */}
          {sesion !== null && sesion.role === 'CLIENTE' && (
            <NavLink to="/pedidos" className="nav-link">Mis pedidos</NavLink>
          )}
          {sesion !== null && sesion.role === 'CHEF' && (
            <NavLink to="/mis-publicaciones" className="nav-link">Mis publicaciones</NavLink>
          )}
          {sesion !== null && sesion.role === 'CHEF' && (
            <NavLink to="/pedidos-recibidos" className="nav-link">Pedidos recibidos</NavLink>
          )}
          {sesion !== null && sesion.role === 'ADMIN' && (
            <NavLink to="/admin" className="nav-link">Administración</NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Sin sesión: Ingresar y Registrarse; con sesión: el nombre y Salir. Ícono en pantallas chicas, texto en las grandes */}
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
              <Link to="/perfil" className="hidden max-w-[10rem] truncate text-label-md text-primary hover:underline sm:inline" title="Mi perfil">
                {sesion.nombre}
              </Link>
              <button type="button" className="btn btn-quiet btn-sm" onClick={onLogout}>Salir</button>
            </div>
          )}

          <Link to="/cesta" className="icon-link" aria-label={`Cesta, ${cartCount} platos`}>
            <span className="material-symbols-outlined">shopping_bag</span>
            <span className="count" aria-hidden="true">{cartCount}</span>
          </Link>
        </div>
      </div>

      {/* Menú móvil */}
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
            {sesion !== null && sesion.role === 'CHEF' && (
              <NavLink
                to="/pedidos-recibidos"
                className="nav-link block !py-3"
                onClick={() => setMenuOpen(false)}
              >
                Pedidos recibidos
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
                <NavLink
                  to="/perfil"
                  className="nav-link block !py-3"
                  onClick={() => setMenuOpen(false)}
                >
                  Mi perfil
                </NavLink>
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
