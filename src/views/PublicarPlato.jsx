// Formulario para publicar un plato nuevo (ruta /publicar) o editar uno existente (ruta /publicar/:id).
// Solo para el rol CHEF. Tiene los mismos campos que PlatoRequest, el cuerpo que pide la API.
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

// URL base del backend (se lee del archivo .env, igual que en App).
const API_URL = import.meta.env.VITE_API_URL

// Texto de un error de fetch para mostrárselo al usuario: el "message" del backend si respondió con un
// error, o uno claro si ni llegamos al servidor (apagado, sin red; ahí el error no tiene status).
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// Lee la respuesta del backend; se usa como .then(leerRespuesta). fetch NO manda los errores HTTP al
// .catch(), por eso revisamos response.ok: si falló lanza un Error con el message y el status del backend.
const leerRespuesta = (response) =>
  response.json().then((cuerpo) => {
    if (!response.ok) {
      const fallo = new Error(cuerpo.message)
      fallo.status = response.status
      throw fallo
    }
    return cuerpo.data
  })

// GET de un catálogo público (categorías o ingredientes): no lleva token. Las listas vacías llegan como null.
const pedirCatalogo = (ruta) =>
  fetch(`${API_URL}${ruta}`)
    .then(leerRespuesta)
    .then((data) => data ?? [])

// GET de UN plato. Lleva el token a propósito, aunque la ruta es pública: un plato en BORRADOR o PAUSADO
// solo lo devuelve el backend a su chef dueño; sin token da 404. signal es la de un AbortController.
const pedirPlato = (platoId, token, signal) =>
  fetch(`${API_URL}/platos/${platoId}`, { headers: { Authorization: `Bearer ${token}` }, signal }).then(leerRespuesta)

// Formatos y tamaño máximo que acepta el backend para las imágenes subidas (ENDPOINTS.md, sección 3.3).
// El backend vuelve a validarlos: acá lo hacemos para avisar enseguida, antes de subir nada.
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES_IMAGEN = 5 * 1024 * 1024

// true si el archivo (un File) tiene un formato permitido y no pasa los 5 MB. type y size son propiedades
// del File: el tipo que declara el navegador y el tamaño en bytes.
const esImagenValida = (archivo) => TIPOS_IMAGEN.includes(archivo.type) && archivo.size <= MAX_BYTES_IMAGEN

// Sube UNA imagen a un plato: POST /platos/{id}/imagenes, multipart/form-data con el campo "file".
// FormData es el objeto del navegador para armar un cuerpo multipart (como un formulario con archivos).
// OJO: NO se escribe el header Content-Type: el navegador lo arma solo, con el "boundary" que separa las
// partes. Si lo pusiéramos a mano, el backend no podría leer el archivo. Solo va el token.
// Devuelve una promesa con el plato completo ya actualizado (con la URL nueva al final de imagenesUrls).
const subirImagen = (platoId, archivo, token) => {
  const cuerpo = new FormData()
  cuerpo.append('file', archivo)
  return fetch(`${API_URL}/platos/${platoId}/imagenes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // ruta privada (sin Content-Type, ver arriba)
    body: cuerpo,
  }).then(leerRespuesta)
}

// Sube varias imágenes UNA POR UNA, en orden: no van en paralelo porque el backend agrega cada URL a la
// lista del plato y dos subidas a la vez podrían pisarse. reduce encadena las promesas, arrancando con el
// plato recién guardado, y devuelve el plato como quedó después de la última subida.
const subirImagenes = (plato, archivos, token) =>
  archivos.reduce(
    (cadena, archivo) => cadena.then((actual) => subirImagen(actual.id, archivo, token)),
    Promise.resolve(plato)
  )

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
// categorias es el catálogo real (GET /categories), para pasar los nombres del plato a ids.
const aFormulario = (plato, categorias) => ({
  nombre: plato.nombre,
  descripcion: plato.descripcion ?? '',
  precio: String(plato.precio),
  stockDisponible: String(plato.stockDisponible),
  // AGOTADO no se puede elegir: lo calcula el backend cuando el stock es 0. Un plato agotado se
  // edita como PUBLICADO y la API lo vuelve a marcar AGOTADO si el stock sigue en 0.
  estado: plato.estado === 'AGOTADO' ? 'PUBLICADO' : plato.estado,
  imagenesUrls: plato.imagenesUrls.length > 0 ? [...plato.imagenesUrls] : [''],
  // El plato guarda los NOMBRES de sus categorías; el formulario necesita los ids.
  categoriasIds: categorias.filter((c) => plato.categorias.includes(c.description)).map((c) => c.id),
  ingredientes: plato.ingredientes.map((i) => ({
    ingredienteId: String(i.ingredienteId),
    cantidad: String(i.cantidad),
    unidadMedida: i.unidadMedida,
  })),
})

// Devuelve las URLs sin espacios y sin los campos vacíos (la API rechaza URLs en blanco).
const urlsLimpias = (urls) => urls.map((url) => url.trim()).filter((url) => url !== '')

// Valida el formulario con las reglas de PlatoRequest (ENDPOINTS.md, sección 3.3). Devuelve un mensaje por
// cada campo con error (objeto vacío si está todo bien). cantidadArchivos: las imágenes elegidas desde el equipo.
const validar = (datos, cantidadArchivos) => {
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
    ...(datos.estado === 'PUBLICADO' && urlsLimpias(datos.imagenesUrls).length + cantidadArchivos === 0 && {
      imagenesUrls: 'Un plato publicado debe tener al menos una imagen.',
    }),
    ...(hayFilaIncompleta && { ingredientes: 'Elegí el ingrediente y una cantidad mayor a 0 en cada fila.' }),
    ...(!hayFilaIncompleta && hayIngredienteRepetido && { ingredientes: 'No se puede repetir un ingrediente.' }),
  }
}

// Props:
//  - token: el JWT de la sesión, para el GET del plato a editar y para el POST y el PUT de platos
//  - userId: el id del chef con sesión; sirve para no dejar editar un plato que es de otro chef
//  - onSesionVencida: función () de App que cierra la sesión; se llama cuando el backend responde 401
//  - onAviso: función (texto) de App para mostrar un Toast. Al guardar bien, avisa y vuelve a Mis publicaciones.
function PublicarPlato({ token, userId, onSesionVencida, onAviso }) {
  const navigate = useNavigate()

  // useParams devuelve los parámetros de la URL. En /publicar/10 devuelve { id: '10' } y en
  // /publicar no hay id (undefined): así sabemos si estamos creando o editando.
  const { id } = useParams()
  const editando = id !== undefined

  // ESTADOS del plato que se edita: el que devolvió el backend (null hasta que responde) y si dijo 404.
  const [plato, setPlato] = useState(null)
  const [platoNoExiste, setPlatoNoExiste] = useState(false)

  // VALORES CALCULADOS (no se guardan aparte) a partir de ese estado:
  //  - platoCargado: ya llegó el plato de ESTE id (si el id de la URL cambia, vuelve a ser false).
  //  - cargandoPlato: estamos editando y todavía no hay respuesta.
  //  - platoAEditar: el plato, solo si es de este chef (GET /platos/{id} también devuelve platos públicos
  //    de otros chefs; editarlos daría 403 al guardar). undefined si estamos creando o no se puede editar.
  const platoCargado = plato !== null && String(plato.id) === id
  const cargandoPlato = editando && !platoCargado && !platoNoExiste
  const platoAEditar = platoCargado && plato.chefId === userId ? plato : undefined

  // ESTADO: lo que el chef fue escribiendo (todos los campos en un objeto), o null mientras no tocó nada.
  // No se inicializa con el plato porque useState usa su valor inicial solo en el primer render, cuando
  // todavía pueden faltar el plato o las categorías.
  const [edicion, setDatos] = useState(null)

  // ESTADO: un mensaje de error por campo (objeto vacío = sin errores).
  const [errores, setErrores] = useState({})

  // ESTADO: los archivos de imagen que el chef eligió en su equipo (array de File). Se suben al guardar.
  const [archivos, setArchivos] = useState([])

  // ESTADOS de los catálogos reales que el chef puede elegir (GET /categories y GET /ingredientes) y
  // de su carga. Arranca cargando.
  const [categorias, setCategorias] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ESTADOS del POST: true mientras espera (evita doble envío) y el mensaje de error del backend.
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState(null)

  // VALOR CALCULADO: los datos que muestra el formulario. Si el chef ya escribió algo, su borrador; si no,
  // el plato que se edita (o vacío si estamos creando). Se recalcula en cada render, sin necesidad de un efecto.
  const datos = edicion ?? (platoAEditar === undefined ? FORM_VACIO : aFormulario(platoAEditar, categorias))

  // GET de los dos catálogos al abrir la vista. Promise.all espera a que lleguen LOS DOS; con [] se piden una sola vez.
  useEffect(() => {
    Promise.all([pedirCatalogo('/categories'), pedirCatalogo('/ingredientes')])
      .then(([listaCategorias, listaIngredientes]) => {
        setCategorias(listaCategorias)
        setIngredientes(listaIngredientes)
      })
      .catch((fallo) => setError(mensajeDe(fallo)))
      .finally(() => setCargando(false))
  }, [])

  // GET /platos/{id} al editar: así /publicar/:id funciona aunque recargues (F5) y también con borradores
  // y pausados. Se salta cuando estamos creando (/publicar). No hay bucle: el efecto modifica "plato", no "id".
  useEffect(() => {
    if (!editando) {
      return
    }

    // AbortController cancela el pedido si salimos de la vista o cambia el id antes de que responda.
    const controlador = new AbortController()

    pedirPlato(id, token, controlador.signal)
      .then((data) => setPlato(data))
      .catch((fallo) => {
        // Un pedido cancelado por nosotros (AbortError) no es un error.
        if (fallo.name === 'AbortError') {
          return
        }
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 404: no existe, o es un borrador/pausado de otro chef. Cualquier otro error va a ErrorState.
        if (fallo.status === 404) {
          setPlatoNoExiste(true)
          return
        }
        setError(mensajeDe(fallo))
      })

    return () => controlador.abort()
    // onSesionVencida queda afuera de las dependencias a propósito: App la crea de nuevo en cada render y
    // el GET se repetiría sin parar (se resuelve con useCallback cuando se vea en clase).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token])

  // Mientras cargan los catálogos o el plato a editar (o si fallaron) no se puede armar el formulario.
  if (cargando || cargandoPlato) {
    return <LoadingState message="Cargando el formulario..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Si piden editar un plato que no existe o que no es de este chef, lo decimos (los hooks ya se llamaron arriba).
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

  // Un único handler para los inputs simples: event.target.name dice qué campo cambió y value qué tiene
  // ahora ([name]: value es una "clave calculada"). Al corregir un campo limpiamos su error.
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

  // ---- Archivos de imagen: los válidos se suman a la lista; los que no (formato o tamaño) se rechazan y
  // los nombramos en el error del campo, para que el chef sepa cuáles no entraron.
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

  // Envío: validamos y, si todo está bien, armamos el cuerpo de PlatoRequest. Mandamos TODOS los campos
  // siempre, porque el PUT reemplaza el plato entero (lo que no se manda se borra).
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

    // El backend exige al menos una imagen para publicar. Si el chef quiere PUBLICAR y sus únicas imágenes son
    // archivos, el plato todavía no tiene ninguna al guardarlo: va primero como BORRADOR y se publica al final.
    const publicarSoloConArchivos =
      datos.estado === 'PUBLICADO' && archivos.length > 0 && platoRequest.imagenesUrls.length === 0
    const primerPedido = publicarSoloConArchivos ? { ...platoRequest, estado: 'BORRADOR' } : platoRequest

    // Guardar es un proceso en TIEMPOS, todo dentro del handler:
    //  1. Crear (POST /platos/createPlato) o editar (PUT /platos/{id}) el plato con su JSON.
    //  2. Subir los archivos elegidos, uno por uno (POST /platos/{id}/imagenes, multipart).
    //  3. Solo si hacía falta (publicarSoloConArchivos): PUT final con PUBLICADO y la lista de imágenes
    //     que devolvió la última subida.
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
          // Si falla un paso DESPUÉS de guardar el plato, marcamos el error con su id (más abajo lo
          // usamos para no crear un plato duplicado si el chef vuelve a intentar).
          .catch((fallo) => {
            fallo.platoId = guardado.id
            throw fallo
          })
      )
      .then((resultado) => {
        // Avisamos y volvemos a la lista: Mis publicaciones se monta de nuevo y pide sus platos (es el GET
        // de una vista que se abre, no un re-GET después de escribir).
        onAviso(editando ? `Guardaste los cambios de ${resultado.nombre}` : `Creaste ${resultado.nombre}`)
        navigate('/mis-publicaciones')
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // El plato se creó pero falló la subida o la publicación: pasamos a /publicar/{id} para que el
        // siguiente "Guardar" lo edite en lugar de crearlo de nuevo.
        if (!editando && fallo.platoId !== undefined) {
          onAviso(`Creamos el plato, pero no pudimos terminar de cargar las imágenes: ${mensajeDe(fallo)}`)
          // Cambiar de /publicar a /publicar/:id NO desmonta la vista (es el mismo componente), así que el
          // formulario conserva lo que escribió el chef y hay que volver a habilitar el botón Guardar.
          setGuardando(false)
          navigate(`/publicar/${fallo.platoId}`, { replace: true })
          return
        }
        // 400 (validación, formato o tamaño de imagen), 403 (no es tu plato), 404: mensaje del backend.
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

      {/* Error del backend al guardar (renderizado condicional) */}
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

        {/* Las imágenes también se pueden subir como archivos: se mandan al guardar el plato */}
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
