// 404 (ruta "*"): se muestra cuando la URL no coincide con ninguna otra ruta; el botón vuelve al inicio.
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/comunes/EmptyState'

// Sin props.
function NoEncontrado() {
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
