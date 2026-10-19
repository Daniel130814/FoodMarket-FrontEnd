// Protege una ruta según la sesión y el rol. Se usa en App.jsx envolviendo las vistas privadas.
import { Navigate } from 'react-router-dom'

// Props:
//  - sesion: null si no hay nadie ingresado, o { token, userId, role, nombre } (viene de App)
//  - rolesPermitidos: array con los roles que pueden ver la ruta, por ejemplo ['CLIENTE']
//  - children: lo que hay entre las etiquetas <RutaProtegida>...</RutaProtegida> (la vista a proteger)
function RutaProtegida({ sesion, rolesPermitidos, children }) {
  // <Navigate> es un componente de react-router que, al dibujarse, cambia de ruta.
  // Lo usamos en vez de window.location (prohibido): navega dentro de la app sin recargar la página.
  // "replace" reemplaza la entrada actual del historial, así el botón "atrás" no vuelve a la
  // ruta bloqueada y no queda en un bucle de redirecciones.

  // Sin sesión: lo mandamos a ingresar.
  if (sesion === null) {
    return <Navigate to="/ingreso" replace />
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
