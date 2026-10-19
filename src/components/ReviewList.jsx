// Lista de reseñas de un plato. Se usa en views/DetallePlato.

// Props:
//  - reviews: array de reseñas con la forma de la API { id, calificacion, comentario, fechaCreacion, clienteId }
//    La API NO trae el nombre del autor, por eso no se muestra.
function ReviewList({ reviews }) {
  // Pasa la fecha ISO ('2026-10-17T15:00:00') a un texto legible ('17 de octubre de 2026').
  const formatearFecha = (fechaIso) =>
    new Date(fechaIso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section aria-labelledby="h-res" className="border-t border-hairline pt-14">
      <h2 id="h-res" className="font-display text-headline-md text-primary">
        Reseñas de quienes lo pidieron
      </h2>
      <ul className="divide-hair mt-8">
        {/* map: un <li> por reseña. key = id, único y estable */}
        {reviews.map((resena) => (
          <li key={resena.id} className="py-6 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body-sm text-on-surface-variant">{formatearFecha(resena.fechaCreacion)}</p>
              {/* "★".repeat(5) -> '★★★★★': una estrella por punto de calificación */}
              <p className="text-secondary" aria-label={`${resena.calificacion} de 5 estrellas`}>
                {'★'.repeat(resena.calificacion)}
              </p>
            </div>
            <p className="mt-3 max-w-2xl text-body-md text-on-surface">{resena.comentario}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ReviewList
