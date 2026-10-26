// Formulario de la presentación del chef (especialidad, foto, biografía y descripción) para views/Perfil.
import FormField from '../comunes/FormField'
import Alert from '../comunes/Alert'

// Props: datos (valores de los campos), errores (un mensaje por campo; errores.foto es el del archivo), error (alerta del backend o null),
// existe (ya tiene perfil: edita), guardando, foto (File elegido o null), onChange (lee event.target), onSelectFoto (archivo),
// onRemoveFoto, onSubmit.
function ChefProfileForm({ datos, errores, error, existe, guardando, foto, onChange, onSelectFoto, onRemoveFoto, onSubmit }) {
  const textoBoton = existe ? 'Guardar presentación' : 'Crear presentación'

  return (
    <form className="mt-14 max-w-xl space-y-6" onSubmit={onSubmit} noValidate>
      <div>
        <h2 className="font-display text-headline-md text-primary">Tu presentación como chef</h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Esto es lo que ven los clientes en cada uno de tus platos.
        </p>
      </div>

      {error !== null && <Alert title="No pudimos guardar tu presentación" messages={[error]} />}

      <FormField label="Tipo de cocina (especialidad)" name="especialidad" value={datos.especialidad} onChange={onChange} error={errores.especialidad} />
      <FormField label="Foto (URL de la imagen)" name="fotoUrl" type="url" value={datos.fotoUrl} onChange={onChange} error={errores.fotoUrl} />

      <fieldset>
        <legend className="label">O subí una foto desde tu equipo (opcional)</legend>
        <p className="hint">JPG, PNG o WEBP, de hasta 5 MB. Si elegís un archivo, reemplaza a la URL al guardar.</p>
        {/* Un type="file" no se controla con value: lo maneja el navegador */}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field mt-3"
          aria-label="Elegir una foto desde tu equipo"
          onChange={(event) => {
            // Se toma el primer archivo y se vacía el campo para poder elegir el mismo de nuevo.
            onSelectFoto(event.target.files[0])
            event.target.value = ''
          }}
          aria-invalid={errores.foto ? 'true' : 'false'}
        />
        {foto !== null && (
          <p className="mt-3 flex items-center gap-3 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined flex-none" aria-hidden="true">image</span>
            <span className="min-w-0 flex-1 truncate">{foto.name}</span>
            <span className="flex-none">{(foto.size / 1024).toFixed(1)} KB</span>
            <button type="button" className="btn btn-quiet btn-sm !text-error" onClick={onRemoveFoto}>
              <span className="material-symbols-outlined">delete</span>
              <span className="sr-only">Quitar {foto.name}</span>
            </button>
          </p>
        )}
        {errores.foto && (
          <p className="hint hint--error" role="alert">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
            <span>{errores.foto}</span>
          </p>
        )}
      </fieldset>

      <div>
        <label className="label" htmlFor="biografia">Biografía</label>
        <textarea id="biografia" name="biografia" className="field" value={datos.biografia} onChange={onChange} aria-invalid={errores.biografia ? 'true' : 'false'} />
        {errores.biografia && (
          <p className="hint hint--error">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
            <span>{errores.biografia}</span>
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="descripcion">Descripción de tu cocina</label>
        <textarea id="descripcion" name="descripcion" className="field" value={datos.descripcion} onChange={onChange} aria-invalid={errores.descripcion ? 'true' : 'false'} />
        {errores.descripcion && (
          <p className="hint hint--error">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
            <span>{errores.descripcion}</span>
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-primary" disabled={guardando}>
        {guardando ? 'Guardando...' : textoBoton}
      </button>
    </form>
  )
}

export default ChefProfileForm
