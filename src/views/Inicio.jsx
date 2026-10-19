import { useState } from 'react'
import { Link } from 'react-router-dom'
import PlatoCard from '../components/PlatoCard'
import CategoryChips from '../components/CategoryChips'
import ChefCard from '../components/ChefCard'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import PLATOS_EJEMPLO from '../data/platosEjemplo'
import CATEGORIAS_EJEMPLO from '../data/categoriasEjemplo'
import CHEFS_EJEMPLO from '../data/chefsEjemplo'

// Props:
//  - onAdd: función (plato, cantidad) de App. Inicio no la usa: solo la reenvía a cada PlatoCard.
function Inicio({ onAdd }) {
  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos en
  // "no cargando" y "sin error". Solo desestructuramos el primer valor: el setter (setCargando /
  // setError) se agrega en el paso 12, cuando haya un fetch que los cambie.
  //  - cargando: true mientras esperamos la respuesta de la API.
  //  - error: null si todo está bien, o el texto del error si la API falló.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando los platos de hoy..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  const platosDeHoy = PLATOS_EJEMPLO.slice(0, 4)

  return (
    <>
      <section>
        <h1 className="font-display text-display-lg text-primary">
          Platos de autor, cocinados hoy por chefs de tu barrio
        </h1>
        <p className="mt-5 max-w-[34rem] text-body-lg text-on-surface-variant">
          Pedile a talleres pequeños e independientes. Cada plato se prepara en tandas cortas y llega el mismo día.
        </p>
        <Link to="/catalogo" className="btn btn-primary mt-8">Ver los platos</Link>
      </section>

      <section aria-labelledby="h-esp" className="mt-14">
        <h2 id="h-esp" className="mb-3 text-label-lg text-on-surface-variant">Qué se te antoja</h2>
        <CategoryChips categories={CATEGORIAS_EJEMPLO} />
      </section>

      <section aria-labelledby="h-hoy" className="mt-14 lg:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="h-hoy" className="font-display text-headline-lg text-primary">Para pedir hoy</h2>
            <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
              Platos que se están cocinando ahora. Cuando se acaban las porciones, se acaban.
            </p>
          </div>
          <Link to="/catalogo" className="link text-label-lg">Ver todos los platos</Link>
        </div>
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {platosDeHoy.map((plato) => (
            <PlatoCard key={plato.id} dish={plato} onAdd={onAdd} />
          ))}
        </div>
      </section>

      <section aria-labelledby="h-chefs" className="mt-20 lg:mt-28">
        <h2 id="h-chefs" className="font-display text-headline-lg text-primary">Quiénes cocinan</h2>
        <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
          Talleres chicos, con nombre y apellido. Cada chef firma lo que cocina.
        </p>
        <ul className="mt-12 divide-y divide-hairline md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
          {CHEFS_EJEMPLO.map((chef) => (
            <ChefCard key={chef.id} chef={chef} />
          ))}
        </ul>
      </section>
    </>
  )
}

export default Inicio
