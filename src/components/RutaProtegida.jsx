// Protege una ruta según la sesión y el rol. Se usa en App.jsx envolviendo las vistas privadas.
import { Navigate, useLocation } from 'react-router-dom'

// Props:
//  - sesion: null si no hay nadie ingresado, o { token, userId, role, nombre } (viene de App)
//  - rolesPermitidos: array con los roles que pueden ver la ruta, por ejemplo ['CLIENTE']
//  - children: lo que hay entre las etiquetas <RutaProtegida>...</RutaProtegida> (la vista a proteger)
function RutaProtegida({ sesion, rolesPermitidos, children }) {
  // useLocation es un hook de react-router que devuelve la ruta actual (location.pathname es, por
  // ejemplo, '/cesta'). Lo guardamos para poder volver acá después de ingresar.
  const location = useLocation()

  // <Navigate> es un componente de react-router que, al dibujarse, cambia de ruta.
  // Lo usamos en vez de window.location (prohibido): navega dentro de la app sin recargar la página.
  // "replace" reemplaza la entrada actual del historial, así el botón "atrás" no vuelve a la
  // ruta bloqueada y no queda en un bucle de redirecciones.

  // Sin sesión: lo mandamos a ingresar. "state" viaja con la navegación (no aparece en la URL):
  // acá lleva la ruta de origen, y Ingreso la lee para volver a esta página después del login.
  if (sesion === null) {
    return <Navigate to="/ingreso" replace state={{ from: location.pathname }} />
  }

  // Con sesión pero con un rol que no puede ver esta ruta: lo mandamos al inicio.
  // .includes() devuelve true si el array contiene ese valor.
  if (!rolesPermitidos.includes(sesion.role)) {
    return <Navigate to="/" replace />
  }

  // Todo en orden: mostramos la vista protegida. El fragment (<>) es el único padre del JSX.
  return <>{children}</>
}

export default RutaProtegida
