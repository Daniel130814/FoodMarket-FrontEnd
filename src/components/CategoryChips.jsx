// Fila de chips con las categorías de platos. Se usa en views/Inicio y views/Catalogo.

// Props:
//  - categories: array de categorías con la forma de la API: { id, description }
function CategoryChips({ categories }) {
  return (
    <div className="scroll-x -mx-1 flex gap-2 px-1 py-1">
      {/* map: un chip por categoría. key = id, único y estable */}
      {categories.map((categoria) => (
        <span key={categoria.id} className="chip">
          {categoria.description}
        </span>
      ))}
    </div>
  )
}

export default CategoryChips
