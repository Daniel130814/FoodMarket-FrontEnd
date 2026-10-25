// Lista de ingredientes de un plato con su cantidad y unidad.

// La API manda la unidad en mayúsculas (ENDPOINTS.md, sección 4); acá se pasa a su abreviatura (GRAMOS -> g).
const UNIDADES = {
  GRAMOS: 'g',
  KILOGRAMOS: 'kg',
  MILILITROS: 'ml',
  LITROS: 'l',
  UNIDAD: 'u',
}

// Props: items ({ ingredienteId, nombre, cantidad, unidadMedida }).
function IngredientTrace({ items }) {
  return (
    <section aria-labelledby="h-traza">
      <h2 id="h-traza" className="font-display text-headline-md text-primary">
        Ingredientes
      </h2>
      <ul className="divide-hair mt-8 rounded-lg border border-hairline bg-surface-container-lowest p-5 sm:p-7">
        {items.map((ingrediente) => (
          <li key={ingrediente.ingredienteId} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <h3 className="text-label-lg text-primary">{ingrediente.nombre}</h3>
            {/* TODO(backend): el diseño mostraba origen y distancia de cada ingrediente; la API no los tiene */}
            <p className="flex-none text-label-md tabular text-secondary">
              {ingrediente.cantidad.toLocaleString('es-AR')} {UNIDADES[ingrediente.unidadMedida]}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default IngredientTrace
