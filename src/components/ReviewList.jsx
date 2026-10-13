// Lista de reseñas de un plato. Se usa en views/DetallePlato.

// Props:
//  - reviews: array de reseñas { id, author, verified, when, rating, comment }
function ReviewList({ reviews }) {
  // Iniciales para el círculo: 'Martina Rossi' -> ['Martina', 'Rossi'] -> 'MR'
  const iniciales = (nombre) =>
    nombre
      .split(' ')
      .map((palabra) => palabra[0])
      .join('')

  return (
    <section aria-labelledby="h-res" className="border-t border-hairline pt-14">
      <h2 id="h-res" className="font-display text-headline-md text-primary">
        Reseñas de quienes lo pidieron
      </h2>
      <ul className="divide-hair mt-8">
        {reviews.map((resena) => (
          <li key={resena.id} className="py-6 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <span
                className="grid h-10 w-10 place-items-center rounded-full bg-secondary-container text-label-md text-on-secondary-container"
                aria-hidden="true"
              >
                {iniciales(resena.author)}
              </span>
              <div>
                <p className="text-label-lg text-primary">{resena.author}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {/* Renderizado condicional: solo si la compra fue verificada */}
                  {resena.verified && <span className="text-primary-container">Compra verificada · </span>}
                  {resena.when}
                </p>
              </div>
              {/* "★".repeat(5) -> '★★★★★': una estrella por punto de rating */}
              <p className="ml-auto text-secondary" aria-label={`${resena.rating} de 5 estrellas`}>
                {'★'.repeat(resena.rating)}
              </p>
            </div>
            <p className="mt-3 max-w-2xl text-body-md text-on-surface">{resena.comment}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ReviewList
