// Vista 404 (ruta comodín "*"). Se muestra cuando la URL no coincide con ninguna otra ruta de App.jsx.
// Reutiliza el componente EmptyState y el botón lleva de vuelta al inicio.
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/comunes/EmptyState'

// No recibe props: no depende de ningún dato, solo de la navegación.
function NoEncontrado() {
  // useNavigate devuelve una función para cambiar de ruta desde un handler (regla 3.8)
  const navigate = useNavigate()

  return (
    <EmptyState
      title="Página no encontrada"
      message="La dirección que buscás no existe o fue movida. Volvé al inicio y seguí explorando platos."
      actionLabel="Volver al inicio"
      onAction={() => navigate('/')}
    />
  )
}

export default NoEncontrado
