// Tarjeta de un chef (foto, taller, especialidades y una cita). Se usa en views/Inicio, en la sección "Quiénes cocinan".

// Props:
//  - chef: datos del chef { name, avatarUrl, verified, workshop, neighborhood, rating, yearsOfCraft, quote, specialties }
function ChefCard({ chef }) {
  // Desestructuración: sacamos del chef solo los campos que usa la tarjeta.
  const { name, avatarUrl, verified, workshop, neighborhood, rating, yearsOfCraft, quote, specialties } = chef

  return (
    <li className="flex flex-col gap-5 py-8 first:pt-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0">
      <div className="flex items-center gap-4">
        <img
          src={avatarUrl}
          alt={`Retrato de ${name}`}
          className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-hairline"
        />
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 font-display text-headline-sm text-primary">
            {name}
            {verified && (
              <span
                className="material-symbols-outlined fill text-[20px] text-surface-tint"
                title="Taller verificado"
                aria-label="Taller verificado"
              >
                verified
              </span>
            )}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {workshop} · {neighborhood}
          </p>
          <p className="mt-0.5 text-label-md text-primary">
            ★ {rating} <span className="font-normal text-on-surface-variant">· {yearsOfCraft} años de oficio</span>
          </p>
        </div>
      </div>
      <blockquote className="flex-1 font-display text-[20px] italic leading-[30px] text-on-surface">{quote}</blockquote>
      <ul className="flex flex-wrap gap-2">
        {/* map: un <li> por especialidad. key = el propio texto, que no se repite dentro de un chef */}
        {specialties.map((especialidad) => (
          <li key={especialidad} className="badge badge-mute">
            {especialidad}
          </li>
        ))}
      </ul>
    </li>
  )
}

export default ChefCard
