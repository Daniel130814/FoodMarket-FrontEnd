// Mis publicaciones (/mis-publicaciones, solo CHEF): sus platos en cualquier estado, con stock, pausa, descuento y eliminar.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FilterChips from '../components/platos/FilterChips'
import PublicationRow from '../components/chef/PublicationRow'
import Dialog from '../components/comunes/Dialog'
import ContenidoAsync from '../components/comunes/ContenidoAsync'

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

// Props: token (JWT), onSesionVencida (cierra la sesión ante un 401), onAviso (muestra un Toast).
function MisPublicaciones({ token, onSesionVencida, onAviso }) {
  // Platos del chef y categorías (el PUT las pide por id y el plato las trae por nombre).
  const [platos, setPlatos] = useState([])
  const [categorias, setCategorias] = useState([])

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Filtro activo: 'todas' o un estado del plato.
  const [filtro, setFiltro] = useState('todas')

  // Diálogo de eliminar: id del plato, o null si está cerrado.
  const [platoAEliminarId, setPlatoAEliminarId] = useState(null)

  // Diálogo de descuento: id del plato (null = cerrado), texto del porcentaje y su error.
  const [platoDescuentoId, setPlatoDescuentoId] = useState(null)
  const [descuentoTexto, setDescuentoTexto] = useState('')
  const [errorDescuento, setErrorDescuento] = useState(null)

  // Al abrir: GET /platos/mis-platos (con token, todos los estados) y GET /categories (público), juntos.
  useEffect(() => {
    // Se cancela si salimos de la vista antes de que respondan.
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
    // onSesionVencida queda afuera de las dependencias: App la recrea en cada render y el GET se repetiría.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Guarda un cambio con PUT /platos/{id}: no hay PATCH de stock ni estado y el PUT reemplaza el plato entero,
  // así que se arma el PlatoRequest completo y se pisa solo lo que cambia. mensaje(plato) arma el texto del Toast.
  const guardarCambios = (plato, cambios, mensaje) => {
    const platoRequest = {
      nombre: plato.nombre,
      descripcion: plato.descripcion,
      precio: plato.precio,
      stockDisponible: plato.stockDisponible,
      estado: plato.estado,
      imagenesUrls: plato.imagenesUrls,
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
        onAviso(mensajeDe(fallo))
      })
  }

  // Ajusta el stock sin mandar "estado": el backend pasa PUBLICADO a AGOTADO con stock 0 y de AGOTADO a PUBLICADO si hay stock.
  const ajustarStock = (platoId, stock) => {
    const plato = platos.find((p) => p.id === platoId)
    guardarCambios(plato, { stockDisponible: stock, estado: undefined }, (guardado) => `Stock de ${guardado.nombre}: ${guardado.stockDisponible}`)
  }

  // Pausa un plato o reactiva uno pausado (mandando PUBLICADO; el backend responde 400 si no tiene imagen).
  const pausarOReactivar = (platoId) => {
    const plato = platos.find((p) => p.id === platoId)

    if (plato.estado !== 'PAUSADO') {
      guardarCambios(plato, { estado: 'PAUSADO' }, (guardado) => `${guardado.nombre} quedó pausado`)
      return
    }
    guardarCambios(plato, { estado: 'PUBLICADO' }, (guardado) => `${guardado.nombre} se reactivó`)
  }

  // Aplica (PATCH, 0,01 a 99,99) o quita (DELETE, con 0) el descuento de un plato.
  const aplicarDescuento = (platoId, porcentaje) => {
    const plato = platos.find((p) => p.id === platoId)
    const quitar = porcentaje === 0

    fetch(`${API_URL}/platos/${platoId}/descuento`, {
      method: quitar ? 'DELETE' : 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
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
        onAviso(mensajeDe(fallo))
      })
  }

  // Elimina un plato (DELETE). Si tiene historial el backend lo deja PAUSADO (y lo dice en el "message"): ahí sigue en la lista.
  const eliminarPlato = (platoId) => {
    fetch(`${API_URL}/platos/${platoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }, // ruta privada
    })
      // Sin leerRespuesta: acá hace falta el "message" (el DELETE responde data: null) para saber si se borró o se pausó.
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
        onAviso(mensajeDe(fallo))
      })
  }

  const contar = (estado) => platos.filter((plato) => plato.estado === estado).length

  const opciones = [
    { id: 'todas', label: 'Todas', count: platos.length },
    { id: 'PUBLICADO', label: 'Publicados', count: contar('PUBLICADO') },
    { id: 'AGOTADO', label: 'Agotados', count: contar('AGOTADO') },
    { id: 'PAUSADO', label: 'Pausados', count: contar('PAUSADO') },
    { id: 'BORRADOR', label: 'Borradores', count: contar('BORRADOR') },
  ]

  const platosVisibles = filtro === 'todas' ? platos : platos.filter((plato) => plato.estado === filtro)

  const platoAEliminar = platos.find((plato) => plato.id === platoAEliminarId)
  const platoDescuento = platos.find((plato) => plato.id === platoDescuentoId)

  const abrirDescuento = (plato) => {
    setPlatoDescuentoId(plato.id)
    setDescuentoTexto(String(plato.descuentoPorcentaje))
    setErrorDescuento(null)
  }

  // Valida como la API: un número entre 0 y 99,99 (Number('') da 0, por eso se revisa aparte el campo vacío).
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
        <Link to="/publicar" className="btn btn-primary">
          <span className="material-symbols-outlined">add</span>Publicar un plato
        </Link>
      </div>

      <div className="mt-10">
        <FilterChips options={opciones} activeId={filtro} onChange={setFiltro} label="Filtrar publicaciones por estado" />
      </div>

      <section aria-label="Lista de publicaciones" className="mt-6">
        {/* Encabezados de la tabla (pantallas medianas y grandes) */}
        <div className="hidden grid-cols-[88px_minmax(0,1fr)_150px_170px_auto] gap-x-6 border-b border-hairline pb-3 text-label-md text-on-surface-variant md:grid" aria-hidden="true">
          <span></span><span>Plato</span><span>Precio</span><span>Stock</span><span className="text-right">Acciones</span>
        </div>
        <ContenidoAsync
          cargando={cargando}
          error={error}
          vacio={platosVisibles.length === 0}
          mensajeCarga="Cargando tus publicaciones..."
          mensajeVacio="No tenés platos en este estado."
        >
          <ul className="divide-hair">
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
