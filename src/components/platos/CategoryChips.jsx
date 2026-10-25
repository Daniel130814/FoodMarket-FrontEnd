// Fila de chips con las categorías: decorativa en Inicio, para filtrar en Catalogo.

// Props: categories ({ id, description }), selectedId (o null), onSelect (id; con null para "Todas". Sin onSelect los chips son decorativos).
function CategoryChips({ categories, selectedId = null, onSelect }) {
  return (
    <div className="scroll-x -mx-1 flex gap-2 px-1 py-1">
      {onSelect !== undefined && (
        <button type="button" className="chip" aria-pressed={selectedId === null} onClick={() => onSelect(null)}>
          Todas
        </button>
      )}
      {categories.map((categoria) =>
        onSelect === undefined ? (
          <span key={categoria.id} className="chip">
            {categoria.description}
          </span>
        ) : (
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
