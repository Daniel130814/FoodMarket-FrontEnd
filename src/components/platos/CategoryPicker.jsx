// Selección múltiple de categorías (casillas). No guarda las elegidas: el padre manda los ids.

// Props: categories ({ id, description }), selectedIds, onToggle (id; el padre la agrega o la quita).
function CategoryPicker({ categories, selectedIds, onToggle }) {
  return (
    <fieldset>
      <legend className="label">Categorías</legend>
      <div className="flex flex-wrap gap-2">
        {categories.map((categoria) => (
          <label key={categoria.id} className="chip">
            <input
              type="checkbox"
              className="sr-only"
              checked={selectedIds.includes(categoria.id)}
              onChange={() => onToggle(categoria.id)}
            />
            {categoria.description}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default CategoryPicker
