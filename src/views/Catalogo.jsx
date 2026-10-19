import { useState } from 'react'
import PlatoCard from '../components/PlatoCard'
import SearchBar from '../components/SearchBar'
import CategoryChips from '../components/CategoryChips'
import Pagination from '../components/Pagination'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import PLATOS_EJEMPLO from '../data/platosEjemplo'
import CATEGORIAS_EJEMPLO from '../data/categoriasEjemplo'

// Props:
//  - onAdd: función (plato, cantidad) de App. Catalogo no la usa: solo la reenvía a cada PlatoCard.
function Catalogo({ onAdd }) {
  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos en
  // "no cargando" y "sin error". Solo desestructuramos el primer valor: el setter (setCargando /
  // setError) se agrega en el paso 12, cuando haya un fetch que los cambie.
  //  - cargando: true mientras esperamos la respuesta de la API.
  //  - error: null si todo está bien, o el texto del error si la API falló.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando el catálogo..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  return (
    <>
      <h1 className="font-display text-headline-lg text-primary">Catálogo</h1>
      <div className="mt-8">
        <SearchBar />
      </div>
      <div className="mt-4">
        <CategoryChips categories={CATEGORIAS_EJEMPLO} />
      </div>
      <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
        {PLATOS_EJEMPLO.map((plato) => (
          <PlatoCard key={plato.id} dish={plato} onAdd={onAdd} />
        ))}
      </div>
      <Pagination shown={PLATOS_EJEMPLO.length} total={24} />
    </>
  )
}

export default Catalogo
