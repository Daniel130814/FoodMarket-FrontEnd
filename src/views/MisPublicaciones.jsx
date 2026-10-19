// Vista de Mis publicaciones del chef (ruta /mis-publicaciones, solo rol CHEF). Lista sus platos en cualquier estado.
import { useState } from 'react'
import FilterChips from '../components/FilterChips'
import PublicationRow from '../components/PublicationRow'
import Dialog from '../components/Dialog'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'

// Props:
//  - platos: las publicaciones del chef, con la forma de PlatoResponse de la API. Vienen de App,
//    que es la dueña del estado.
//  - onStockChange: función (platoId, nuevoStock) de App
//  - onTogglePause: función (platoId) de App; pausa el plato o lo reactiva
//  - onDiscount: función (platoId, porcentaje) de App; porcentaje 0 quita el descuento
//  - onDelete: función (platoId) de App
//  La vista solo avisa lo que el chef quiere hacer; App cambia los platos y muestra el Toast.
function MisPublicaciones({ platos, onStockChange, onTogglePause, onDiscount, onDelete }) {
  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos en
  // "no cargando" y "sin error". Solo desestructuramos el primer valor: el setter (setCargando /
  // setError) se agrega en el paso 13, cuando haya un fetch que los cambie.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // ESTADO: el filtro activo. 'todas' o uno de los estados de la API (PUBLICADO, AGOTADO, ...).
  const [filtro, setFiltro] = useState('todas')

  // ESTADO del diálogo de eliminar: el id del plato a eliminar, o null si el diálogo está cerrado.
  // Un solo estado sirve para "¿está abierto?" y "¿cuál plato?".
  const [platoAEliminarId, setPlatoAEliminarId] = useState(null)

  // ESTADOS del diálogo de descuento: el id del plato (null = cerrado), el texto que escribe el
  // chef en el campo y el mensaje de error si el porcentaje no es válido.
  const [platoDescuentoId, setPlatoDescuentoId] = useState(null)
  const [descuentoTexto, setDescuentoTexto] = useState('')
  const [errorDescuento, setErrorDescuento] = useState(null)

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

  // Los platos de los diálogos abiertos (undefined si el diálogo está cerrado).
  const platoAEliminar = platos.find((plato) => plato.id === platoAEliminarId)
  const platoDescuento = platos.find((plato) => plato.id === platoDescuentoId)

  // Abre el diálogo de descuento con el porcentaje actual del plato ya escrito en el campo.
  const abrirDescuento = (plato) => {
    setPlatoDescuentoId(plato.id)
    setDescuentoTexto(String(plato.descuentoPorcentaje))
    setErrorDescuento(null)
  }

  // Al confirmar el descuento validamos igual que la API: un número entre 0 y 99,99.
  // Number('') da 0, por eso se revisa aparte que el campo no esté vacío.
  const confirmarDescuento = () => {
    const porcentaje = Number(descuentoTexto)
    if (descuentoTexto.trim() === '' || Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 99.99) {
      setErrorDescuento('Ingresá un porcentaje entre 0 y 99,99.')
      return
    }
    onDiscount(platoDescuentoId, porcentaje)
    setPlatoDescuentoId(null)
  }

  const confirmarEliminar = () => {
    onDelete(platoAEliminarId)
    setPlatoAEliminarId(null)
  }

  return (
    <>
      <h1 className="font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Mis publicaciones</h1>
      <p className="mt-3 max-w-xl text-body-lg text-on-surface-variant">
        Manejá el stock, los descuentos y lo que se ve en el catálogo.
      </p>

      <div className="mt-10">
        <FilterChips options={opciones} activeId={filtro} onChange={setFiltro} label="Filtrar publicaciones por estado" />
      </div>

      <section aria-label="Lista de publicaciones" className="mt-6">
        {/* Encabezados de la tabla: solo en pantallas medianas y grandes */}
        <div className="hidden grid-cols-[88px_minmax(0,1fr)_150px_170px_auto] gap-x-6 border-b border-hairline pb-3 text-label-md text-on-surface-variant md:grid" aria-hidden="true">
          <span></span><span>Plato</span><span>Precio</span><span>Stock</span><span className="text-right">Acciones</span>
        </div>
        {/* Renderizado condicional: si el filtro no tiene platos, lo decimos */}
        {platosVisibles.length === 0 ? (
          <p className="py-10 text-body-md text-on-surface-variant">No tenés platos en este estado.</p>
        ) : (
          <ul className="divide-hair">
            {/* map: una fila por plato. key = id del plato, único y estable */}
            {platosVisibles.map((plato) => (
              <PublicationRow
                key={plato.id}
                plato={plato}
                onStockChange={onStockChange}
                onTogglePause={onTogglePause}
                onOpenDiscount={abrirDescuento}
                onOpenDelete={setPlatoAEliminarId}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Diálogos controlados por estado: se abren cuando su id deja de ser null */}
      <Dialog
        open={platoAEliminarId !== null}
        title={platoAEliminar === undefined ? '' : `¿Eliminar ${platoAEliminar.nombre}?`}
        message="Si el plato ya tiene pedidos o reseñas no se borra: queda pausado y deja de verse en el catálogo."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmarEliminar}
        onCancel={() => setPlatoAEliminarId(null)}
      />
      <Dialog
        open={platoDescuentoId !== null}
        title={platoDescuento === undefined ? '' : `Descuento para ${platoDescuento.nombre}`}
        message="Ingresá un porcentaje entre 0 y 99,99. Con 0 se quita el descuento."
        confirmLabel="Aplicar descuento"
        confirmVariant="primary"
        cancelLabel="Cancelar"
        onConfirm={confirmarDescuento}
        onCancel={() => setPlatoDescuentoId(null)}
      >
        {/* children del Dialog: el campo del porcentaje (input controlado + label + error) */}
        <div className="mt-5">
          <label className="label" htmlFor="descuento">Porcentaje de descuento</label>
          <input
            id="descuento"
            type="number"
            min="0"
            max="99.99"
            step="0.01"
            className="field"
            value={descuentoTexto}
            onChange={(event) => {
              setDescuentoTexto(event.target.value)
              setErrorDescuento(null)
            }}
            aria-invalid={errorDescuento !== null ? 'true' : 'false'}
          />
          {errorDescuento !== null && (
            <p className="hint hint--error" role="alert">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
              <span>{errorDescuento}</span>
            </p>
          )}
        </div>
      </Dialog>
    </>
  )
}

export default MisPublicaciones
