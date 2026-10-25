// Formulario para publicar (/publicar) o editar (/publicar/:id) un plato. Solo CHEF; los campos son los de PlatoRequest.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ImageUrlList from '../components/chef/ImageUrlList'
import ImageFilePicker from '../components/chef/ImageFilePicker'
import CategoryPicker from '../components/platos/CategoryPicker'
import IngredientRows from '../components/platos/IngredientRows'
import EmptyState from '../components/comunes/EmptyState'
import Alert from '../components/comunes/Alert'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'

const API_URL = import.meta.env.VITE_API_URL

// Mensaje de un error de fetch: el del backend, o uno claro si no hubo respuesta (el error no tiene status).
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// Devuelve `data` o lanza un Error con message y status (fetch no manda los errores HTTP al .catch).
const leerRespuesta = (response) =>
  response.json().then((cuerpo) => {
    if (!response.ok) {
      const fallo = new Error(cuerpo.message)
      fallo.status = response.status
      throw fallo
    }
    return cuerpo.data
  })

// GET de un catálogo público (categorías o ingredientes), sin token; las listas vacías llegan como null.
const pedirCatalogo = (ruta) =>
  fetch(`${API_URL}${ruta}`)
    .then(leerRespuesta)
    .then((data) => data ?? [])

// GET de un plato. Lleva el token aunque la ruta es pública: un BORRADOR o PAUSADO solo se le devuelve a su dueño.
const pedirPlato = (platoId, token, signal) =>
  fetch(`${API_URL}/platos/${platoId}`, { headers: { Authorization: `Bearer ${token}` }, signal }).then(leerRespuesta)

// Formatos y tamaño máximo de las imágenes subidas (ENDPOINTS.md 3.3); se validan acá para avisar antes de subir.
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES_IMAGEN = 5 * 1024 * 1024

// true si el archivo tiene un formato permitido y no pasa los 5 MB.
const esImagenValida = (archivo) => TIPOS_IMAGEN.includes(archivo.type) && archivo.size <= MAX_BYTES_IMAGEN

// Sube una imagen (POST /platos/{id}/imagenes, multipart, campo "file") y devuelve el plato actualizado.
// No se escribe el Content-Type: el navegador lo arma con el boundary; si se pone a mano el backend no lee el archivo.
const subirImagen = (platoId, archivo, token) => {
  const cuerpo = new FormData()
  cuerpo.append('file', archivo)
  return fetch(`${API_URL}/platos/${platoId}/imagenes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // ruta privada (sin Content-Type, ver arriba)
    body: cuerpo,
  }).then(leerRespuesta)
}

// Sube varias imágenes una por una (no en paralelo: dos subidas a la vez podrían pisarse la lista de URLs).
const subirImagenes = (plato, archivos, token) =>
  archivos.reduce(
    (cadena, archivo) => cadena.then((actual) => subirImagen(actual.id, archivo, token)),
    Promise.resolve(plato)
  )

// Formulario vacío de un plato nuevo (borrador). Los números van como texto y se pasan a número al enviar.
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

// Pasa un plato (PlatoResponse) a los valores del formulario; con el catálogo de categorías convierte nombres a ids.
const aFormulario = (plato, categorias) => ({
  nombre: plato.nombre,
  descripcion: plato.descripcion ?? '',
  precio: String(plato.precio),
  stockDisponible: String(plato.stockDisponible),
  // AGOTADO no se elige (lo calcula el backend): un plato agotado se edita como PUBLICADO.
  estado: plato.estado === 'AGOTADO' ? 'PUBLICADO' : plato.estado,
  imagenesUrls: plato.imagenesUrls.length > 0 ? [...plato.imagenesUrls] : [''],
  categoriasIds: categorias.filter((c) => plato.categorias.includes(c.description)).map((c) => c.id),
  ingredientes: plato.ingredientes.map((i) => ({
    ingredienteId: String(i.ingredienteId),
    cantidad: String(i.cantidad),
    unidadMedida: i.unidadMedida,
  })),
})

// URLs sin espacios y sin vacías (la API rechaza URLs en blanco).
const urlsLimpias = (urls) => urls.map((url) => url.trim()).filter((url) => url !== '')

// Valida con las reglas de PlatoRequest (ENDPOINTS.md 3.3): un mensaje por campo con error. cantidadArchivos cuenta como imágenes.
const validar = (datos, cantidadArchivos) => {
  const ids = datos.ingredientes.map((fila) => fila.ingredienteId)
  const hayFilaIncompleta = datos.ingredientes.some((fila) => fila.ingredienteId === '' || !(Number(fila.cantidad) > 0))
  const hayIngredienteRepetido = ids.some((id, posicion) => id !== '' && ids.indexOf(id) !== posicion)

  return {
    ...(datos.nombre.trim() === '' && { nombre: 'Escribí el nombre del plato.' }),
    ...(!(Number(datos.precio) > 0) && { precio: 'El precio tiene que ser mayor a 0.' }),
    ...((datos.stockDisponible === '' || !Number.isInteger(Number(datos.stockDisponible)) || Number(datos.stockDisponible) < 0) && {
      stockDisponible: 'El stock tiene que ser un número entero, 0 o más.',
    }),
    ...(datos.estado === 'PUBLICADO' && urlsLimpias(datos.imagenesUrls).length + cantidadArchivos === 0 && {
      imagenesUrls: 'Un plato publicado debe tener al menos una imagen.',
    }),
    ...(hayFilaIncompleta && { ingredientes: 'Elegí el ingrediente y una cantidad mayor a 0 en cada fila.' }),
    ...(!hayFilaIncompleta && hayIngredienteRepetido && { ingredientes: 'No se puede repetir un ingrediente.' }),
  }
}

// Props: token (JWT), userId (chef con sesión; evita editar platos ajenos), onSesionVencida (401), onAviso (Toast).
function PublicarPlato({ token, userId, onSesionVencida, onAviso }) {
  const navigate = useNavigate()

  // Sin id en la URL (/publicar) se crea; con id (/publicar/10) se edita.
  const { id } = useParams()
  const editando = id !== undefined

  // Plato que se edita (null hasta que responde el backend) y si dijo 404.
  const [plato, setPlato] = useState(null)
  const [platoNoExiste, setPlatoNoExiste] = useState(false)

  // platoAEditar: el plato solo si es de este chef (GET /platos/{id} también devuelve los públicos de otros: daría 403).
  const platoCargado = plato !== null && String(plato.id) === id
  const cargandoPlato = editando && !platoCargado && !platoNoExiste
  const platoAEditar = platoCargado && plato.chefId === userId ? plato : undefined

  // Lo que el chef escribió, o null si no tocó nada. No se inicializa con el plato: en el primer render puede faltar.
  const [edicion, setDatos] = useState(null)

  const [errores, setErrores] = useState({})

  // Archivos de imagen elegidos en el equipo; se suben al guardar.
  const [archivos, setArchivos] = useState([])

  // Catálogos de categorías e ingredientes, con su carga y error.
  const [categorias, setCategorias] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Guardado en curso (evita el doble envío) y error del backend.
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState(null)

  // Datos del formulario: el borrador del chef o, si no escribió nada, el plato a editar (o vacío al crear).
  const datos = edicion ?? (platoAEditar === undefined ? FORM_VACIO : aFormulario(platoAEditar, categorias))

  // Al abrir: GET de las categorías y los ingredientes juntos (Promise.all).
  useEffect(() => {
    Promise.all([pedirCatalogo('/categories'), pedirCatalogo('/ingredientes')])
      .then(([listaCategorias, listaIngredientes]) => {
        setCategorias(listaCategorias)
        setIngredientes(listaIngredientes)
      })
      .catch((fallo) => setError(mensajeDe(fallo)))
      .finally(() => setCargando(false))
  }, [])

  // GET /platos/{id} al editar (sirve con F5 y con borradores o pausados). Se salta al crear.
  useEffect(() => {
    if (!editando) {
      return
    }

    // Se cancela si salimos de la vista o cambia el id antes de que responda.
    const controlador = new AbortController()

    pedirPlato(id, token, controlador.signal)
      .then((data) => setPlato(data))
      .catch((fallo) => {
        if (fallo.name === 'AbortError') {
          return
        }
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 404: no existe o es de otro chef; cualquier otro error va a ErrorState.
        if (fallo.status === 404) {
          setPlatoNoExiste(true)
          return
        }
        setError(mensajeDe(fallo))
      })

    return () => controlador.abort()
    // onSesionVencida queda afuera de las dependencias: App la recrea en cada render y el GET se repetiría.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token])

  if (cargando || cargandoPlato) {
    return <LoadingState message="Cargando el formulario..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

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

  // Handler de los inputs simples; al corregir un campo limpia su error.
  const handleChange = (event) => {
    const { name, value } = event.target
    setDatos({ ...datos, [name]: value })
    if (errores[name]) {
      setErrores({ ...errores, [name]: null })
    }
  }

  // ---- Imágenes (URLs)
  const cambiarImagen = (posicion, texto) => {
    setDatos({ ...datos, imagenesUrls: datos.imagenesUrls.map((url, i) => (i === posicion ? texto : url)) })
    setErrores({ ...errores, imagenesUrls: null })
  }
  const agregarImagen = () => setDatos({ ...datos, imagenesUrls: [...datos.imagenesUrls, ''] })
  const quitarImagen = (posicion) => {
    setDatos({ ...datos, imagenesUrls: datos.imagenesUrls.filter((_, i) => i !== posicion) })
  }

  // ---- Archivos de imagen: los válidos se suman; los rechazados (formato o tamaño) se nombran en el error.
  const elegirArchivos = (nuevos) => {
    const rechazados = nuevos.filter((archivo) => !esImagenValida(archivo))
    setArchivos([...archivos, ...nuevos.filter(esImagenValida)])
    setErrores({
      ...errores,
      imagenesUrls: null,
      archivos:
        rechazados.length > 0
          ? `No se agregó: ${rechazados.map((archivo) => archivo.name).join(', ')}. Solo JPG, PNG o WEBP de hasta 5 MB.`
          : null,
    })
  }
  const quitarArchivo = (posicion) => {
    setArchivos(archivos.filter((_, i) => i !== posicion))
  }

  // ---- Categorías: si el id ya estaba se quita, si no se agrega.
  const alternarCategoria = (categoriaId) => {
    const nuevas = datos.categoriasIds.includes(categoriaId)
      ? datos.categoriasIds.filter((idElegido) => idElegido !== categoriaId)
      : [...datos.categoriasIds, categoriaId]
    setDatos({ ...datos, categoriasIds: nuevas })
  }

  // ---- Ingredientes: se cambia un campo de una sola fila.
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

  // Envío: valida y arma el PlatoRequest. Siempre con TODOS los campos, porque el PUT reemplaza el plato entero.
  const handleSubmit = (event) => {
    event.preventDefault()

    const nuevosErrores = validar(datos, archivos.length)
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

    // Para publicar el backend exige una imagen: si solo hay archivos, se guarda como BORRADOR y se publica al final.
    const publicarSoloConArchivos =
      datos.estado === 'PUBLICADO' && archivos.length > 0 && platoRequest.imagenesUrls.length === 0
    const primerPedido = publicarSoloConArchivos ? { ...platoRequest, estado: 'BORRADOR' } : platoRequest

    // Guardar en tiempos: 1) crear (POST) o editar (PUT) el plato, 2) subir los archivos uno por uno,
    // 3) solo si hacía falta (publicarSoloConArchivos), un PUT final con PUBLICADO y las imágenes resultantes.
    setGuardando(true)
    setErrorGuardar(null)
    fetch(editando ? `${API_URL}/platos/${platoAEditar.id}` : `${API_URL}/platos/createPlato`, {
      method: editando ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify(primerPedido),
    })
      .then(leerRespuesta)
      .then((guardado) =>
        subirImagenes(guardado, archivos, token)
          .then((conImagenes) =>
            publicarSoloConArchivos
              ? fetch(`${API_URL}/platos/${guardado.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // ruta privada
                  },
                  body: JSON.stringify({ ...platoRequest, imagenesUrls: conImagenes.imagenesUrls }),
                }).then(leerRespuesta)
              : conImagenes
          )
          // Si falla algo después de guardar el plato, el error lleva su id para no duplicarlo al reintentar.
          .catch((fallo) => {
            fallo.platoId = guardado.id
            throw fallo
          })
      )
      .then((resultado) => {
        // Vuelve a la lista: Mis publicaciones se monta de nuevo y pide sus platos.
        onAviso(editando ? `Guardaste los cambios de ${resultado.nombre}` : `Creaste ${resultado.nombre}`)
        navigate('/mis-publicaciones')
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // El plato se creó pero falló la subida o la publicación: pasa a /publicar/{id} para que Guardar lo edite.
        if (!editando && fallo.platoId !== undefined) {
          onAviso(`Creamos el plato, pero no pudimos terminar de cargar las imágenes: ${mensajeDe(fallo)}`)
          // Cambiar de /publicar a /publicar/:id no desmonta la vista: hay que volver a habilitar Guardar.
          setGuardando(false)
          navigate(`/publicar/${fallo.platoId}`, { replace: true })
          return
        }
        setErrorGuardar(mensajeDe(fallo))
        setGuardando(false)
      })
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

      {errorGuardar !== null && (
        <div className="mt-6 max-w-3xl">
          <Alert title="No pudimos guardar el plato" messages={[errorGuardar]} />
        </div>
      )}

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

        <ImageFilePicker
          archivos={archivos}
          onSelect={elegirArchivos}
          onRemove={quitarArchivo}
          error={errores.archivos ?? null}
        />

        <CategoryPicker categories={categorias} selectedIds={datos.categoriasIds} onToggle={alternarCategoria} />

        <IngredientRows
          rows={datos.ingredientes}
          catalog={ingredientes}
          onChange={cambiarIngrediente}
          onAdd={agregarIngrediente}
          onRemove={quitarIngrediente}
          error={errores.ingredientes ?? null}
        />

        <div className="flex flex-wrap gap-3 border-t border-hairline pt-6">
          <button type="submit" className="btn btn-primary" disabled={guardando}>{editando ? 'Guardar cambios' : 'Guardar plato'}</button>
          <Link to="/mis-publicaciones" className="btn btn-quiet">Cancelar</Link>
        </div>
      </form>
    </>
  )
}

export default PublicarPlato
