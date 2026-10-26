// Formulario de la presentación del chef (especialidad, foto, biografía y descripción) para views/Perfil.
import FormField from '../comunes/FormField'
import Alert from '../comunes/Alert'

// Props: datos (valores de los campos), errores (un mensaje por campo), error (alerta del backend o null), existe (ya tiene perfil: edita),
// guardando, onChange (lee event.target), onSubmit.
function ChefProfileForm({ datos, errores, error, existe, guardando, onChange, onSubmit }) {
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
