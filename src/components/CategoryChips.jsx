// Fila de chips con las categorías de platos. Se usa en views/Inicio (solo decorativa) y en
// views/Catalogo (para filtrar).

// Props:
//  - categories: array de categorías con la forma de la API: { id, description }
//  - selectedId: id de la categoría elegida, o null si no hay ninguna (lo guarda el padre)
//  - onSelect: función del padre (id). Si NO se pasa, los chips son solo decorativos (Inicio).
//    Al tocar "Todas" se llama con null.
function CategoryChips({ categories, selectedId = null, onSelect }) {
  return (
    <div className="scroll-x -mx-1 flex gap-2 px-1 py-1">
      {/* Renderizado condicional: el chip "Todas" solo tiene sentido si se puede filtrar */}
      {onSelect !== undefined && (
        <button type="button" className="chip" aria-pressed={selectedId === null} onClick={() => onSelect(null)}>
          Todas
        </button>
      )}
      {/* map: un chip por categoría. key = id, único y estable */}
      {categories.map((categoria) =>
        onSelect === undefined ? (
          <span key={categoria.id} className="chip">
            {categoria.description}
          </span>
        ) : (
          // aria-pressed marca el chip elegido (los estilos lo pintan y los lectores de pantalla lo anuncian)
          <button
            key={categoria.id}
            type="button"
            className="chip"
            aria-pressed={selectedId === categoria.id}
            onClick={() => onSelect(categoria.id)}
          >
            {categoria.description}
          </button>
        )
      )}
    </div>
  )
}

export default CategoryChips
