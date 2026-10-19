// Vista de Mis publicaciones del chef (ruta /mis-publicaciones, solo rol CHEF). Lista sus platos en cualquier estado.
import { useState } from 'react'
import FilterChips from '../components/FilterChips'
import PublicationRow from '../components/PublicationRow'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// Props:
//  - platos: las publicaciones del chef, con la forma de PlatoResponse de la API. Vienen de App,
//    que es la dueña del estado.
function MisPublicaciones({ platos }) {
  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos en
  // "no cargando" y "sin error". Solo desestructuramos el primer valor: el setter (setCargando /
  // setError) se agrega en el paso 13, cuando haya un fetch que los cambie.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // ESTADO: el filtro activo. 'todas' o uno de los estados de la API (PUBLICADO, AGOTADO, ...).
  const [filtro, setFiltro] = useState('todas')

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando tus publicaciones..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Cuenta cuántos platos hay en un estado (para el número de cada chip).
  const contar = (estado) => platos.filter((plato) => plato.estado === estado).length

  const opciones = [
    { id: 'todas', label: 'Todas', count: platos.length },
    { id: 'PUBLICADO', label: 'Publicados', count: contar('PUBLICADO') },
    { id: 'AGOTADO', label: 'Agotados', count: contar('AGOTADO') },
    { id: 'PAUSADO', label: 'Pausados', count: contar('PAUSADO') },
    { id: 'BORRADOR', label: 'Borradores', count: contar('BORRADOR') },
  ]

  // VALOR CALCULADO: la lista que se ve depende del filtro elegido. No se guarda en un estado.
  const platosVisibles = filtro === 'todas' ? platos : platos.filter((plato) => plato.estado === filtro)

  return (
    <>
      <h1 className="font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Mis publicaciones</h1>
      <p className="mt-3 max-w-xl text-body-lg text-on-surface-variant">
        Mirá el estado, el precio y el stock de tus platos.
      </p>

      <div className="mt-10">
        <FilterChips options={opciones} activeId={filtro} onChange={setFiltro} label="Filtrar publicaciones por estado" />
      </div>

      <section aria-label="Lista de publicaciones" className="mt-6">
        {/* Encabezados de la tabla: solo en pantallas medianas y grandes */}
        <div className="hidden grid-cols-[88px_minmax(0,1fr)_150px_120px] gap-x-6 border-b border-hairline pb-3 text-label-md text-on-surface-variant md:grid" aria-hidden="true">
          <span></span><span>Plato</span><span>Precio</span><span>Stock</span>
        </div>
        {/* Renderizado condicional: si el filtro no tiene platos, lo decimos */}
        {platosVisibles.length === 0 ? (
          <p className="py-10 text-body-md text-on-surface-variant">No tenés platos en este estado.</p>
        ) : (
          <ul className="divide-hair">
            {/* map: una fila por plato. key = id del plato, único y estable */}
            {platosVisibles.map((plato) => (
              <PublicationRow key={plato.id} plato={plato} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default MisPublicaciones
