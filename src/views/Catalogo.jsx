import PlatoCard from '../components/PlatoCard'
import SearchBar from '../components/SearchBar'
import CategoryChips from '../components/CategoryChips'
import Pagination from '../components/Pagination'
import PLATOS_EJEMPLO from '../data/platosEjemplo'
import CATEGORIAS_EJEMPLO from '../data/categoriasEjemplo'

// Props:
//  - onAdd: función (plato, cantidad) de App. Catalogo no la usa: solo la reenvía a cada PlatoCard.
function Catalogo({ onAdd }) {
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
