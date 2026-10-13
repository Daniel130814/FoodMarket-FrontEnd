function CategoryChips({ categories }) {
  return (
    <div className="scroll-x -mx-1 flex gap-2 px-1 py-1">
      {categories.map((categoria) => (
        <span key={categoria.id} className="chip">
          <span className="material-symbols-outlined text-secondary" aria-hidden="true">
            {categoria.icon}
          </span>
          {categoria.name}
        </span>
      ))}
    </div>
  )
}

export default CategoryChips
