// Checkout (/checkout, CLIENTE): se elige o crea el domicilio de entrega y se confirma el pedido.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DomicilioPicker from '../components/cesta/DomicilioPicker'
import DomicilioForm from '../components/cesta/DomicilioForm'
import OrderSummary from '../components/cesta/OrderSummary'
import EmptyState from '../components/comunes/EmptyState'
import Alert from '../components/comunes/Alert'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'

// Envío fijo de ejemplo, igual que en la Cesta (la API todavía no lo calcula).
const ENVIO = 3200

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

const FORM_VACIO = {
  calle: '',
  numero: '',
  piso: '',
  departamento: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  indicacionesEntrega: '',
}

// Campos obligatorios para la API; los demás son opcionales.
const CAMPOS_OBLIGATORIOS = ['calle', 'numero', 'ciudad', 'provincia', 'codigoPostal']

// Props: carrito, cartCount (unidades), token (JWT), onSesionVencida (401), onPedidoCreado (App vacía su copia de la cesta).
function Checkout({ carrito, cartCount, token, onSesionVencida, onPedidoCreado }) {
  const navigate = useNavigate()
  const { items, totalEstimado } = carrito

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [domicilios, setDomicilios] = useState([])

  const [errorDomicilio, setErrorDomicilio] = useState(null)

  const [domicilioElegidoId, setDomicilioElegidoId] = useState(null)

  // Formulario de domicilio nuevo: abierto, datos y errores por campo.
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formDomicilio, setFormDomicilio] = useState(FORM_VACIO)
  const [erroresForm, setErroresForm] = useState({})

  // Errores al confirmar el pedido (stock insuficiente, plato no publicado...).
  const [conflictos, setConflictos] = useState([])

  // Confirmación en curso: deshabilita el botón para que un doble clic no cree dos pedidos.
  const [confirmando, setConfirmando] = useState(false)

  // Al abrir: GET /domicilios.
  useEffect(() => {
    fetch(`${API_URL}/domicilios`, { headers: { Authorization: `Bearer ${token}` } })
      .then(leerRespuesta)
      .then((data) => setDomicilios(data ?? [])) // lista vacía llega como null
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setError(mensajeDe(fallo))
      })
      .finally(() => setCargando(false))
  // onSesionVencida queda afuera de las dependencias: App la recrea en cada render y el GET se repetiría.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (cargando) {
    return <LoadingState message="Cargando tus domicilios..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Tu cesta está vacía"
        message="Sumá platos de los chefs de tu barrio para poder finalizar la compra."
        actionLabel="Ver platos de hoy"
        onAction={() => navigate('/catalogo')}
      />
    )
  }

  // Handler de los inputs del formulario de domicilio.
  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormDomicilio({ ...formDomicilio, [name]: value })
    if (erroresForm[name]) {
      setErroresForm({ ...erroresForm, [name]: null })
    }
  }

  // Guarda el domicilio nuevo (POST) tras validar los obligatorios, y lo suma a la lista sin volver a pedirla.
  const guardarDomicilio = (event) => {
    event.preventDefault()

    const faltantes = CAMPOS_OBLIGATORIOS.filter((nombre) => formDomicilio[nombre].trim() === '')
    if (faltantes.length > 0) {
      setErroresForm(Object.fromEntries(faltantes.map((nombre) => [nombre, 'Este dato es obligatorio.'])))
      return
    }

    // Los opcionales vacíos van como null, como los devuelve la API.
    const opcional = (valor) => (valor.trim() === '' ? null : valor.trim())

    const datos = {
      calle: formDomicilio.calle.trim(),
      numero: formDomicilio.numero.trim(),
      piso: opcional(formDomicilio.piso),
      departamento: opcional(formDomicilio.departamento),
      ciudad: formDomicilio.ciudad.trim(),
      provincia: formDomicilio.provincia.trim(),
      codigoPostal: formDomicilio.codigoPostal.trim(),
      indicacionesEntrega: opcional(formDomicilio.indicacionesEntrega),
    }

    fetch(`${API_URL}/domicilios/createDomicilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify(datos),
    })
      .then(leerRespuesta)
      .then((creado) => {
        setDomicilios((actuales) => [...actuales, creado])
        setDomicilioElegidoId(creado.id)
        setMostrarForm(false)
        setFormDomicilio(FORM_VACIO)
        setErroresForm({})
        setErrorDomicilio(null)
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setErrorDomicilio(mensajeDe(fallo))
      })
  }

  const cancelarForm = () => {
    setErrorDomicilio(null)
    setMostrarForm(false)
    setFormDomicilio(FORM_VACIO)
    setErroresForm({})
  }

  // Confirma el pedido (POST /carrito/checkout): el backend valida y descuenta el stock, arma un subpedido por chef
  // y vacía la cesta del servidor.
  const confirmar = () => {
    setConfirmando(true)
    setConflictos([])

    fetch(`${API_URL}/carrito/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify({ domicilioEntregaId: domicilioElegidoId }),
    })
      .then(leerRespuesta)
      .then((pedido) => {
        onPedidoCreado(pedido)
        navigate('/pedidos')
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setConflictos([mensajeDe(fallo)])
        setConfirmando(false)
      })
  }

  return (
    <>
      <Link to="/cesta" className="inline-flex min-h-[44px] items-center gap-1 text-label-lg text-on-surface-variant hover:text-primary">
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
        Volver a la cesta
      </Link>
      <h1 className="mt-4 font-display text-display-lg-mobile text-primary lg:text-[52px] lg:leading-[56px]">Finalizar compra</h1>

      {conflictos.length > 0 && (
        <div className="mt-6">
          <Alert title="No pudimos confirmar tu pedido" messages={conflictos} />
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          <DomicilioPicker domicilios={domicilios} selectedId={domicilioElegidoId} onSelect={setDomicilioElegidoId} />

          {mostrarForm ? (
            <>
              {errorDomicilio !== null && (
                <div className="mt-4">
                  <Alert title="No pudimos guardar el domicilio" messages={[errorDomicilio]} />
                </div>
              )}
            <DomicilioForm
              datos={formDomicilio}
              errores={erroresForm}
              onChange={handleFormChange}
              onSubmit={guardarDomicilio}
              onCancel={cancelarForm}
            />
            </>
          ) : (
            <div className="mt-4">
              <button type="button" className="btn btn-secondary" onClick={() => setMostrarForm(true)}>
                Agregar domicilio nuevo
              </button>
            </div>
          )}

          {domicilioElegidoId === null && (
            <p className="mt-4 text-body-sm text-on-surface-variant">Elegí un domicilio para poder confirmar el pedido.</p>
          )}
        </div>
        <div className="lg:col-span-4">
          <OrderSummary
            units={cartCount}
            subtotal={totalEstimado}
            shipping={ENVIO}
            onConfirm={confirmar}
            buttonLabel="Confirmar pedido"
            disabled={domicilioElegidoId === null || confirmando}
          />
        </div>
      </div>
    </>
  )
}

export default Checkout
