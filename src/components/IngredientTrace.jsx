// Lista "De dónde viene cada ingrediente" (trazabilidad). Se usa en views/DetallePlato.

// Props:
//  - items: array de ingredientes { id, icon, name, origin, distance }
function IngredientTrace({ items }) {
  return (
    <section aria-labelledby="h-traza">
      <h2 id="h-traza" className="font-display text-headline-md text-primary">
        De dónde viene cada ingrediente
      </h2>
      <ul className="divide-hair mt-8 rounded-lg border border-hairline bg-surface-container-lowest p-5 sm:p-7">
        {/* map: un <li> por ingrediente. key = id, único y estable */}
        {items.map((ingrediente) => (
          <li key={ingrediente.id} className="flex gap-4 py-5 first:pt-0 last:pb-0">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-surface-container-high text-primary">
              {/* El nombre del ícono (grain, egg...) viene en los datos */}
              <span className="material-symbols-outlined" aria-hidden="true">
                {ingrediente.icon}
              </span>
            </span>
            <div className="min-w-0 flex-1 sm:flex sm:items-start sm:justify-between sm:gap-6">
              <div>
                <h3 className="text-label-lg text-primary">{ingrediente.name}</h3>
                <p className="mt-1 max-w-lg text-body-sm text-on-surface-variant">{ingrediente.origin}</p>
              </div>
              <p className="mt-2 flex-none text-label-md text-secondary sm:mt-0.5 sm:text-right">
                {ingrediente.distance}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default IngredientTrace
