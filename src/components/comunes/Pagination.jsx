// Pie del listado: cuántos platos se ven, barra de progreso y botón "Ver más". Se usa en views/Catalogo.
import Button from './Button'

// Props:
//  - shown: cuántos platos se están mostrando ahora
//  - total: cuántos platos hay en total (ya filtrados)
//  - onMore: función del padre; se llama al tocar "Ver más" (el padre sube la página actual)
function Pagination({ shown, total, onMore }) {
  const remaining = total - shown
  const percent = (shown / total) * 100

  return (
    <div className="mt-14 flex flex-col items-center gap-4 border-t border-hairline pt-10 text-center">
      <p className="text-body-md text-on-surface-variant">
        Viste {shown} de {total} platos
      </p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full rounded-full bg-primary-container" style={{ width: `${percent}%` }} />
      </div>
      {remaining > 0 && <Button variant="secondary" onClick={onMore}>Ver {remaining} platos más</Button>}
    </div>
  )
}

export default Pagination
