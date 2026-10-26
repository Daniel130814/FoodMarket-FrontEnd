// Pestaña Categorías de views/Admin: lista las categorías. No hace fetch ni guarda datos: todo viene por props.

// Props: categorias ({ id, description }[]).
function CategoriasPanel({ categorias }) {
  return (
    <div role="tabpanel" className="mt-8 space-y-4">
      {categorias.length === 0 && (
        <p className="text-body-md text-on-surface-variant">Todavía no hay categorías.</p>
      )}
      {categorias.map((categoria) => (
        <article
          key={categoria.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-ambient"
        >
          <h2 className="min-w-0 flex-1 basis-[220px] font-display text-headline-sm text-primary">{categoria.description}</h2>
        </article>
      ))}
    </div>
  )
}

export default CategoriasPanel
