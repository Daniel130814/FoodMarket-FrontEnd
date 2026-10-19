// Formulario para publicar un plato nuevo (ruta /publicar) o editar uno existente (ruta /publicar/:id).
// Solo para el rol CHEF. Tiene los mismos campos que PlatoRequest, el cuerpo que pide la API.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ImageUrlList from '../components/ImageUrlList'
import CategoryPicker from '../components/CategoryPicker'
import IngredientRows from '../components/IngredientRows'
import EmptyState from '../components/EmptyState'
import CATEGORIAS_EJEMPLO from '../data/categoriasEjemplo'
import INGREDIENTES_EJEMPLO from '../data/ingredientesEjemplo'

// Formulario vacío para un plato nuevo. Los números se guardan como TEXTO porque vienen de
// inputs; se pasan a número al enviar. Un plato nuevo arranca como borrador, con un campo de imagen.
const FORM_VACIO = {
  nombre: '',
  descripcion: '',
  precio: '',
  stockDisponible: '',
  estado: 'BORRADOR',
  imagenesUrls: [''],
  categoriasIds: [],
  ingredientes: [],
}

// Pasa un plato (forma de PlatoResponse) a los valores del formulario, para editarlo.
const aFormulario = (plato) => ({
  nombre: plato.nombre,
  descripcion: plato.descripcion ?? '',
  precio: String(plato.precio),
  stockDisponible: String(plato.stockDisponible),
  // AGOTADO no se puede elegir: lo calcula el backend cuando el stock es 0. Un plato agotado se
  // edita como PUBLICADO y la API lo vuelve a marcar AGOTADO si el stock sigue en 0.
  estado: plato.estado === 'AGOTADO' ? 'PUBLICADO' : plato.estado,
  imagenesUrls: plato.imagenesUrls.length > 0 ? [...plato.imagenesUrls] : [''],
  // El plato guarda los NOMBRES de sus categorías; el formulario necesita los ids.
  categoriasIds: CATEGORIAS_EJEMPLO.filter((c) => plato.categorias.includes(c.description)).map((c) => c.id),
  ingredientes: plato.ingredientes.map((i) => ({
    ingredienteId: String(i.ingredienteId),
    cantidad: String(i.cantidad),
    unidadMedida: i.unidadMedida,
  })),
})

// Devuelve las URLs sin espacios y sin los campos vacíos (la API rechaza URLs en blanco).
const urlsLimpias = (urls) => urls.map((url) => url.trim()).filter((url) => url !== '')

// Valida el formulario con las reglas de PlatoRequest (ENDPOINTS.md, sección 3.3).
// Devuelve un objeto con un mensaje por cada campo con error; vacío si todo está bien.
// Es una función común (no un hook): recibe datos y devuelve datos.
const validar = (datos) => {
  const ids = datos.ingredientes.map((fila) => fila.ingredienteId)
  const hayFilaIncompleta = datos.ingredientes.some((fila) => fila.ingredienteId === '' || !(Number(fila.cantidad) > 0))
  const hayIngredienteRepetido = ids.some((id, posicion) => id !== '' && ids.indexOf(id) !== posicion)

  // Cada línea agrega una clave al objeto solo si se cumple la condición:
  // ...(condicion && { clave: 'mensaje' }) -> si la condición es false, no agrega nada.
  return {
    ...(datos.nombre.trim() === '' && { nombre: 'Escribí el nombre del plato.' }),
    ...(!(Number(datos.precio) > 0) && { precio: 'El precio tiene que ser mayor a 0.' }),
    ...((datos.stockDisponible === '' || !Number.isInteger(Number(datos.stockDisponible)) || Number(datos.stockDisponible) < 0) && {
      stockDisponible: 'El stock tiene que ser un número entero, 0 o más.',
    }),
    ...(datos.estado === 'PUBLICADO' && urlsLimpias(datos.imagenesUrls).length === 0 && {
      imagenesUrls: 'Un plato publicado debe tener al menos una imagen.',
    }),
    ...(hayFilaIncompleta && { ingredientes: 'Elegí el ingrediente y una cantidad mayor a 0 en cada fila.' }),
    ...(!hayFilaIncompleta && hayIngredienteRepetido && { ingredientes: 'No se puede repetir un ingrediente.' }),
  }
}

// Props:
//  - platos: las publicaciones del chef (vienen de App). Se usan para precargar el plato al editar.
//  - onSave: función (datos, platoId) de App. datos tiene la forma de PlatoRequest; platoId es el
//    id del plato que se edita, o null si es uno nuevo. La vista solo avisa "guardá esto"; App
//    crea o reemplaza el plato.
function PublicarPlato({ platos, onSave }) {
  const navigate = useNavigate()

  // useParams devuelve los parámetros de la URL. En /publicar/10 devuelve { id: '10' } y en
  // /publicar no hay id (undefined): así sabemos si estamos creando o editando.
  const { id } = useParams()
  const editando = id !== undefined

  // El plato a editar, o undefined si estamos creando (o si el id no existe).
  const platoAEditar = editando ? platos.find((plato) => plato.id === Number(id)) : undefined

  // ESTADO: todos los campos del formulario en un solo objeto. Si editamos, arranca con los datos
  // del plato; si no, vacío. Este valor inicial solo se usa la primera vez que se dibuja la vista.
  const [datos, setDatos] = useState(platoAEditar === undefined ? FORM_VACIO : aFormulario(platoAEditar))

  // ESTADO: un mensaje de error por campo (objeto vacío = sin errores).
  const [errores, setErrores] = useState({})

  // Si piden editar un plato que no existe, lo decimos (los hooks ya se llamaron arriba).
  if (editando && platoAEditar === undefined) {
    return (
      <EmptyState
        title="Este plato no está disponible"
        message="No encontramos ese plato entre tus publicaciones."
        actionLabel="Volver a mis publicaciones"
        onAction={() => navigate('/mis-publicaciones')}
      />
    )
  }

  // Un único handler para los inputs simples (nombre, descripción, precio, stock y estado).
  // event.target.name dice qué campo cambió y value qué tiene ahora ([name]: value es una
  // "clave calculada"). Al corregir un campo limpiamos su error.
  const handleChange = (event) => {
    const { name, value } = event.target
    setDatos({ ...datos, [name]: value })
    if (errores[name]) {
      setErrores({ ...errores, [name]: null })
    }
  }

  // ---- Imágenes: map devuelve un array nuevo; filter se queda con los que cumplen la condición.
  const cambiarImagen = (posicion, texto) => {
    setDatos({ ...datos, imagenesUrls: datos.imagenesUrls.map((url, i) => (i === posicion ? texto : url)) })
    setErrores({ ...errores, imagenesUrls: null })
  }
  const agregarImagen = () => setDatos({ ...datos, imagenesUrls: [...datos.imagenesUrls, ''] })
  const quitarImagen = (posicion) => {
    setDatos({ ...datos, imagenesUrls: datos.imagenesUrls.filter((_, i) => i !== posicion) })
  }

  // ---- Categorías: si el id ya estaba lo quitamos, si no lo agregamos.
  const alternarCategoria = (categoriaId) => {
    const nuevas = datos.categoriasIds.includes(categoriaId)
      ? datos.categoriasIds.filter((idElegido) => idElegido !== categoriaId)
      : [...datos.categoriasIds, categoriaId]
    setDatos({ ...datos, categoriasIds: nuevas })
  }

  // ---- Ingredientes: cada fila es un objeto; cambiamos un campo de UNA fila (la de esa posición).
  const cambiarIngrediente = (posicion, campo, valor) => {
    setDatos({
      ...datos,
      ingredientes: datos.ingredientes.map((fila, i) => (i === posicion ? { ...fila, [campo]: valor } : fila)),
    })
    setErrores({ ...errores, ingredientes: null })
  }
  const agregarIngrediente = () => {
    setDatos({ ...datos, ingredientes: [...datos.ingredientes, { ingredienteId: '', cantidad: '', unidadMedida: 'GRAMOS' }] })
  }
  const quitarIngrediente = (posicion) => {
    setDatos({ ...datos, ingredientes: datos.ingredientes.filter((_, i) => i !== posicion) })
  }

  // Envío: validamos y, si todo está bien, armamos el cuerpo de PlatoRequest y se lo pasamos a App.
  // IMPORTANTE: mandamos TODOS los campos siempre, porque en la API el PUT reemplaza el plato
  // entero (lo que no se manda se borra).
  const handleSubmit = (event) => {
    event.preventDefault()

    const nuevosErrores = validar(datos)
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    const platoRequest = {
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion.trim(),
      precio: Number(datos.precio),
      stockDisponible: Number(datos.stockDisponible),
      estado: datos.estado,
      imagenesUrls: urlsLimpias(datos.imagenesUrls),
      categoriasIds: datos.categoriasIds,
      ingredientes: datos.ingredientes.map((fila) => ({
        ingredienteId: Number(fila.ingredienteId),
        cantidad: Number(fila.cantidad),
        unidadMedida: fila.unidadMedida,
      })),
    }

    onSave(platoRequest, editando ? platoAEditar.id : null)
    navigate('/mis-publicaciones')
  }

  return (
    <>
      <Link to="/mis-publicaciones" className="inline-flex min-h-[44px] items-center gap-1 text-label-lg text-on-surface-variant hover:text-primary">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
        Mis publicaciones
      </Link>
      <h1 className="mt-4 font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">
        {editando ? 'Editar plato' : 'Publicar un plato'}
      </h1>

      <form className="mt-10 max-w-3xl space-y-8" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="label" htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            className="field"
            value={datos.nombre}
            onChange={handleChange}
            aria-invalid={errores.nombre ? 'true' : 'false'}
          />
          {errores.nombre && (
            <p className="hint hint--error">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
              <span>{errores.nombre}</span>
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="descripcion">Descripción (opcional)</label>
          <textarea
            id="descripcion"
            name="descripcion"
            className="field"
            value={datos.descripcion}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="precio">Precio</label>
            <input
              id="precio"
              name="precio"
              type="number"
              min="0"
              step="0.01"
              className="field"
              placeholder="$ 0"
              value={datos.precio}
              onChange={handleChange}
              aria-invalid={errores.precio ? 'true' : 'false'}
            />
            {errores.precio && (
              <p className="hint hint--error">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
                <span>{errores.precio}</span>
              </p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="stockDisponible">Stock</label>
            <input
              id="stockDisponible"
              name="stockDisponible"
              type="number"
              min="0"
              step="1"
              className="field"
              value={datos.stockDisponible}
              onChange={handleChange}
              aria-invalid={errores.stockDisponible ? 'true' : 'false'}
            />
            {errores.stockDisponible && (
              <p className="hint hint--error">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
                <span>{errores.stockDisponible}</span>
              </p>
            )}
          </div>
          <div>
            <label className="label" htmlFor="estado">Estado</label>
            {/* AGOTADO no se elige: el backend lo calcula cuando el stock es 0 */}
            <select id="estado" name="estado" className="field" value={datos.estado} onChange={handleChange}>
              <option value="BORRADOR">Borrador</option>
              <option value="PUBLICADO">Publicado</option>
              <option value="PAUSADO">Pausado</option>
            </select>
            <p className="hint">Si publicás con stock 0, queda como Agotado.</p>
          </div>
        </div>

        <ImageUrlList
          urls={datos.imagenesUrls}
          onChange={cambiarImagen}
          onAdd={agregarImagen}
          onRemove={quitarImagen}
          error={errores.imagenesUrls ?? null}
        />

        <CategoryPicker categories={CATEGORIAS_EJEMPLO} selectedIds={datos.categoriasIds} onToggle={alternarCategoria} />

        <IngredientRows
          rows={datos.ingredientes}
          catalog={INGREDIENTES_EJEMPLO}
          onChange={cambiarIngrediente}
          onAdd={agregarIngrediente}
          onRemove={quitarIngrediente}
          error={errores.ingredientes ?? null}
        />

        <div className="flex flex-wrap gap-3 border-t border-hairline pt-6">
          <button type="submit" className="btn btn-primary">{editando ? 'Guardar cambios' : 'Guardar plato'}</button>
          <Link to="/mis-publicaciones" className="btn btn-quiet">Cancelar</Link>
        </div>
      </form>
    </>
  )
}

export default PublicarPlato
