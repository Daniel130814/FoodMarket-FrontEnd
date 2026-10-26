// Lista de reseñas (de un plato o de un chef).

// Props: reviews ({ id, calificacion, comentario, fechaCreacion, clienteId, platoNombre opcional }), title (encabezado).
// La API no trae el nombre del autor.
function ReviewList({ reviews, title = 'Reseñas de quienes lo pidieron' }) {
  const formatearFecha = (fechaIso) =>
    new Date(fechaIso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section aria-labelledby="h-res" className="border-t border-hairline pt-14">
      <h2 id="h-res" className="font-display text-headline-md text-primary">
        {title}
      </h2>
      <ul className="divide-hair mt-8">
        {reviews.map((resena) => (
          <li key={resena.id} className="py-6 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body-sm text-on-surface-variant">{formatearFecha(resena.fechaCreacion)}</p>
              <p className="text-secondary" aria-label={`${resena.calificacion} de 5 estrellas`}>
                {'★'.repeat(resena.calificacion)}
              </p>
            </div>
            {resena.platoNombre !== undefined && (
              <p className="mt-2 text-label-md text-primary">{resena.platoNombre}</p>
            )}
            <p className="mt-3 max-w-2xl text-body-md text-on-surface">{resena.comentario}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ReviewList
