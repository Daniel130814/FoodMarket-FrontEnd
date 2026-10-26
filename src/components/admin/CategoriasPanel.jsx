// Pestaña Categorías de views/Admin: lista y formulario para crear. No hace fetch ni guarda datos: todo viene por props.
import Alert from '../comunes/Alert'
import FormField from '../comunes/FormField'

// Props: categorias ({ id, description }[]); mostrarForm; descripcion (valor del campo); errorDescripcion (junto al
// campo); errorCrear (del backend); onAbrirForm; onCerrarForm; onDescripcionChange (event); onCrear (event, submit);
// onEditar (categoria): el padre abre el diálogo de edición.
function CategoriasPanel({
  categorias,
  mostrarForm,
  descripcion,
  errorDescripcion,
  errorCrear,
  onAbrirForm,
  onCerrarForm,
  onDescripcionChange,
  onCrear,
  onEditar,
}) {
  return (
    <div role="tabpanel" className="mt-8 space-y-4">
      {mostrarForm ? (
        <form
          className="space-y-5 rounded-xl bg-surface-container-lowest p-5 shadow-ambient sm:p-7"
          onSubmit={onCrear}
          noValidate
        >
          <h2 className="font-display text-headline-sm text-primary">Nueva categoría</h2>
          {errorCrear !== null && <Alert title="No pudimos crear la categoría" messages={[errorCrear]} />}
          <FormField
            label="Nombre de la categoría"
            name="descripcion"
            value={descripcion}
            onChange={onDescripcionChange}
            error={errorDescripcion}
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn btn-primary">Crear categoría</button>
            <button type="button" className="btn btn-quiet" onClick={onCerrarForm}>Cancelar</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-secondary" onClick={onAbrirForm}>
          Crear categoría
        </button>
      )}

      {categorias.length === 0 && (
        <p className="text-body-md text-on-surface-variant">Todavía no hay categorías.</p>
      )}
      {categorias.map((categoria) => (
        <article
          key={categoria.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-ambient"
        >
          <h2 className="min-w-0 flex-1 basis-[220px] font-display text-headline-sm text-primary">{categoria.description}</h2>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onEditar(categoria)}>
            Editar
          </button>
        </article>
      ))}
    </div>
  )
}

export default CategoriasPanel
