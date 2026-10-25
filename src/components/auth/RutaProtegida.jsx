// Protege una ruta según la sesión y el rol. Se usa en App.jsx envolviendo las vistas privadas.
import { Navigate, useLocation } from 'react-router-dom'
import LoadingState from '../comunes/LoadingState'

// Props: sesion (null o { token, userId, role, nombre }), cargandoSesion (App verifica el token guardado),
// rolesPermitidos (por ejemplo ['CLIENTE']), children (la vista a proteger).
function RutaProtegida({ sesion, cargandoSesion, rolesPermitidos, children }) {
  const location = useLocation()

  // <Navigate> redirige dentro de la app; "replace" evita que el botón "atrás" vuelva a la ruta bloqueada en bucle.

  // Mientras App verifica el token no se redirige: si no, un F5 en una ruta privada mandaría siempre a /ingreso.
  if (cargandoSesion) {
    return <LoadingState message="Verificando sesión..." />
  }

  // Sin sesión: a /ingreso, con la ruta de origen en "state" para volver después del login.
  if (sesion === null) {
    return <Navigate to="/ingreso" replace state={{ from: location.pathname }} />
  }

  // Con sesión pero con un rol que no corresponde: al inicio.
  if (!rolesPermitidos.includes(sesion.role)) {
    return <Navigate to="/" replace />
  }

  // Todo en orden: la vista protegida.
  return <>{children}</>
}

export default RutaProtegida
