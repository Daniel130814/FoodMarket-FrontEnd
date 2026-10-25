// Vista de Mis publicaciones del chef (ruta /mis-publicaciones, solo rol CHEF). Lista sus platos en cualquier
// estado (GET /platos/mis-platos) y deja ajustar el stock, pausar, aplicar descuento y eliminar.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FilterChips from '../components/platos/FilterChips'
import PublicationRow from '../components/chef/PublicationRow'
import Dialog from '../components/comunes/Dialog'
import ContenidoAsync from '../components/comunes/ContenidoAsync'

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

// Props:
//  - token: el JWT de la sesión, para los pedidos de esta vista (rutas privadas)
//  - onSesionVencida: función () de App que cierra la sesión; se llama cuando el backend responde 401
//  - onAviso: función (texto) de App para mostrar un Toast
// La vista tiene el estado de las publicaciones, las pide al backend y hace las escrituras.
function MisPublicaciones({ token, onSesionVencida, onAviso }) {
  // ESTADO de los datos que llegan del backend: las publicaciones del chef (forma de PlatoResponse) y el
  // catálogo de categorías. Las categorías hacen falta para editar con PUT: la API devuelve las de un
  // plato por NOMBRE, pero el PUT las pide por ID.
  const [platos, setPlatos] = useState([])
  const [categorias, setCategorias] = useState([])

  // ESTADOS de carga y error de esos GET. Arranca cargando.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

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

  // GET /platos/mis-platos y GET /categories al abrir la vista. Promise.all espera a que lleguen LOS DOS.
  // mis-platos es privada (lleva el token) y trae los platos del chef en TODOS los estados; las categorías
  // son públicas. Las listas vacías llegan como null, por eso el ?? []. Con [token] no se repite mientras
  // no cambie la sesión.
  useEffect(() => {
    // AbortController cancela los pedidos si salimos de la vista antes de que respondan.
    const controlador = new AbortController()

    Promise.all([
      fetch(`${API_URL}/platos/mis-platos`, { headers: { Authorization: `Bearer ${token}` }, signal: controlador.signal }).then(leerRespuesta),
      fetch(`${API_URL}/categories`, { signal: controlador.signal }).then(leerRespuesta),
    ])
      .then(([listaPlatos, listaCategorias]) => {
        setPlatos(listaPlatos ?? [])
        setCategorias(listaCategorias ?? [])
      })
      .catch((fallo) => {
        // Un pedido cancelado por nosotros (AbortError) no es un error.
        if (fallo.name === 'AbortError') {
          return
        }
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setError(mensajeDe(fallo))
      })
      .finally(() => setCargando(false))

    return () => controlador.abort()
    // onSesionVencida queda afuera de las dependencias a propósito: App la crea de nuevo en cada render y
    // el GET se repetiría sin parar (se resuelve con useCallback cuando se vea en clase).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Guarda un cambio en UN plato con PUT /platos/{id}. La API no tiene PATCH para el stock ni el estado y
  // el PUT REEMPLAZA el plato entero: armamos el PlatoRequest COMPLETO con el plato actual y le pisamos
  // solo lo que cambia ("cambios"). Con el plato que devuelve el backend reemplazamos el de la lista (map).
  // mensaje: función (plato guardado) que arma el texto del Toast.
  const guardarCambios = (plato, cambios, mensaje) => {
    const platoRequest = {
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: plato.precio,
      stockDisponible: plato.stockDisponible,
      estado: plato.estado,
      imagenesUrls: plato.imagenesUrls,
      // El plato trae los NOMBRES de sus categorías; el PUT necesita los ids (del catálogo).
      categoriasIds: categorias.filter((categoria) => plato.categorias.includes(categoria.description)).map((categoria) => categoria.id),
      ingredientes: plato.ingredientes.map((ingrediente) => ({
        ingredienteId: ingrediente.ingredienteId,
        cantidad: ingrediente.cantidad,
        unidadMedida: ingrediente.unidadMedida,
      })),
      ...cambios,
    }

    fetch(`${API_URL}/platos/${plato.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify(platoRequest),
    })
      .then(leerRespuesta)
      .then((guardado) => {
        setPlatos((actuales) => actuales.map((p) => (p.id === guardado.id ? guardado : p)))
        onAviso(mensaje(guardado))
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 400 (por ejemplo, publicar sin imagen), 403 (no es tu plato), 404: mensaje del backend.
        onAviso(mensajeDe(fallo))
      })
  }

  // Ajusta el stock. NO mandamos "estado" (lo pisamos con undefined, que JSON.stringify omite): sin estado
  // el backend aplica su regla: PUBLICADO con stock 0 pasa a AGOTADO, AGOTADO con stock > 0 vuelve a
  // PUBLICADO, y BORRADOR y PAUSADO conservan el suyo.
  const ajustarStock = (platoId, stock) => {
    const plato = platos.find((p) => p.id === platoId)
    guardarCambios(plato, { stockDisponible: stock, estado: undefined }, (guardado) => `Stock de ${guardado.nombre}: ${guardado.stockDisponible}`)
  }

  // Pausa un plato publicado o reactiva uno pausado. Reactivar = mandar PUBLICADO; el backend lo pasa a
  // AGOTADO si el stock es 0 y responde 400 si el plato no tiene imagen (lo mostramos en el Toast).
  const pausarOReactivar = (platoId) => {
    const plato = platos.find((p) => p.id === platoId)

    if (plato.estado !== 'PAUSADO') {
      guardarCambios(plato, { estado: 'PAUSADO' }, (guardado) => `${guardado.nombre} quedó pausado`)
      return
    }
    guardarCambios(plato, { estado: 'PUBLICADO' }, (guardado) => `${guardado.nombre} se reactivó`)
  }

  // Aplica o quita un descuento: con 0,01 a 99,99 es PATCH /platos/{id}/descuento { porcentaje }; con 0 es
  // DELETE /platos/{id}/descuento. Los dos devuelven el plato ya actualizado, que reemplaza al de la lista.
  const aplicarDescuento = (platoId, porcentaje) => {
    const plato = platos.find((p) => p.id === platoId)
    const quitar = porcentaje === 0

    fetch(`${API_URL}/platos/${platoId}/descuento`, {
      method: quitar ? 'DELETE' : 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      // El DELETE no lleva cuerpo; el PATCH manda el porcentaje.
      body: quitar ? undefined : JSON.stringify({ porcentaje }),
    })
      .then(leerRespuesta)
      .then((guardado) => {
        setPlatos((actuales) => actuales.map((p) => (p.id === guardado.id ? guardado : p)))
        onAviso(quitar ? `Quitaste el descuento de ${plato.nombre}` : `${plato.nombre} ahora tiene ${porcentaje} % de descuento`)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 400 (porcentaje fuera de rango), 403 (no es tu plato), 404: mensaje del backend.
        onAviso(mensajeDe(fallo))
      })
  }

  // Elimina un plato: DELETE /platos/{id}. El backend decide: si tiene historial (pedidos, reseñas o está
  // en un carrito) NO se borra, queda PAUSADO, y lo dice en el "message". Un plato pausado sigue en la
  // lista (lo marcamos PAUSADO con map); si se borró lo sacamos con filter. Sin volver a pedir la lista.
  const eliminarPlato = (platoId) => {
    fetch(`${API_URL}/platos/${platoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }, // ruta privada
    })
      // Acá NO usamos leerRespuesta: necesitamos el "message" (el DELETE responde data: null) para saber
      // si el plato se borró o quedó pausado.
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.message
        })
      )
      .then((mensaje) => {
        if (mensaje.startsWith('Plato pausado')) {
          setPlatos((actuales) => actuales.map((p) => (p.id === platoId ? { ...p, estado: 'PAUSADO' } : p)))
        } else {
          setPlatos((actuales) => actuales.filter((p) => p.id !== platoId))
        }
        onAviso(mensaje)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 403 (no es tu plato), 404: mensaje del backend.
        onAviso(mensajeDe(fallo))
      })
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
    aplicarDescuento(platoDescuentoId, porcentaje)
    setPlatoDescuentoId(null)
  }

  const confirmarEliminar = () => {
    eliminarPlato(platoAEliminarId)
    setPlatoAEliminarId(null)
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Mis publicaciones</h1>
          <p className="mt-3 max-w-xl text-body-lg text-on-surface-variant">
            Manejá el stock, los descuentos y lo que se ve en el catálogo.
          </p>
        </div>
        {/* Link navega sin recargar la página */}
        <Link to="/publicar" className="btn btn-primary">
          <span className="material-symbols-outlined">add</span>Publicar un plato
        </Link>
      </div>

      <div className="mt-10">
        <FilterChips options={opciones} activeId={filtro} onChange={setFiltro} label="Filtrar publicaciones por estado" />
      </div>

      <section aria-label="Lista de publicaciones" className="mt-6">
        {/* Encabezados de la tabla: solo en pantallas medianas y grandes */}
        <div className="hidden grid-cols-[88px_minmax(0,1fr)_150px_170px_auto] gap-x-6 border-b border-hairline pb-3 text-label-md text-on-surface-variant md:grid" aria-hidden="true">
          <span></span><span>Plato</span><span>Precio</span><span>Stock</span><span className="text-right">Acciones</span>
        </div>
        {/* ContenidoAsync muestra la carga, el error, un aviso si el filtro no tiene platos, o la lista */}
        <ContenidoAsync
          cargando={cargando}
          error={error}
          vacio={platosVisibles.length === 0}
          mensajeCarga="Cargando tus publicaciones..."
          mensajeVacio="No tenés platos en este estado."
        >
          <ul className="divide-hair">
            {/* map: una fila por plato. key = id del plato, único y estable */}
            {platosVisibles.map((plato) => (
              <PublicationRow
                key={plato.id}
                plato={plato}
                onStockChange={ajustarStock}
                onTogglePause={pausarOReactivar}
                onOpenDiscount={abrirDescuento}
                onOpenDelete={setPlatoAEliminarId}
              />
            ))}
          </ul>
        </ContenidoAsync>
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
