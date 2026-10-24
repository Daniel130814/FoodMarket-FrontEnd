// Vista de checkout (ruta /checkout). Se abre desde la Cesta: se elige el domicilio de entrega y se confirma el pedido.
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DomicilioPicker from '../components/cesta/DomicilioPicker'
import DomicilioForm from '../components/cesta/DomicilioForm'
import OrderSummary from '../components/cesta/OrderSummary'
import EmptyState from '../components/comunes/EmptyState'
import Alert from '../components/comunes/Alert'
import LoadingState from '../components/comunes/LoadingState'
import ErrorState from '../components/comunes/ErrorState'

// Costo de envío fijo de ejemplo (el mismo valor que en la Cesta). La API todavía no lo calcula.
const ENVIO = 3200

// URL base del backend (se lee del archivo .env, igual que en App).
const API_URL = import.meta.env.VITE_API_URL

// Texto de un error de fetch para mostrárselo al usuario. Si el servidor RESPONDIÓ con un error (400, 403...)
// usamos su "message". Si ni siquiera llegamos al servidor (apagado, sin red), fetch rechaza la promesa con
// un error SIN status y el texto del navegador ("Failed to fetch") no le sirve a nadie: damos uno claro.
const mensajeDe = (fallo) =>
  fallo.status === undefined
    ? 'No pudimos conectar con el servidor. Revisá que el backend esté funcionando e intentá de nuevo.'
    : fallo.message

// Formulario de domicilio vacío: todos los campos como texto vacío.
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

// Campos que la API exige (@NotBlank). Los demás son opcionales.
const CAMPOS_OBLIGATORIOS = ['calle', 'numero', 'ciudad', 'provincia', 'codigoPostal']

// Props (vienen de App):
//  - carrito: { id, items, totalEstimado } con la forma de CarritoResponse de la API
//  - cartCount: total de unidades (ya calculado por App)
//  - token: el JWT de la sesión, para las llamadas privadas (GET y POST de domicilios)
//  - onSesionVencida: función () de App que cierra la sesión; se llama cuando el backend responde 401
//  - onPedidoCreado: función (pedido) de App. Checkout hace el POST /carrito/checkout y, cuando el backend
//    responde bien, le entrega el pedido creado; App lo suma a los pedidos, vacía la cesta y avisa.
function Checkout({ carrito, cartCount, token, onSesionVencida, onPedidoCreado }) {
  const navigate = useNavigate()
  const { items, totalEstimado } = carrito

  // ESTADOS de carga y error del GET de domicilios. Arranca cargando.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // ESTADO: los domicilios guardados. Viven acá porque esta vista es el padre de DomicilioPicker
  // y DomicilioForm (ellos solo reciben datos y avisan cambios).
  const [domicilios, setDomicilios] = useState([])

  // ESTADO: mensaje de error del POST de un domicilio nuevo (null si no hay).
  const [errorDomicilio, setErrorDomicilio] = useState(null)

  // ESTADO: id del domicilio elegido, o null si todavía no eligió ninguno.
  const [domicilioElegidoId, setDomicilioElegidoId] = useState(null)

  // ESTADOS del formulario de domicilio nuevo: si está abierto, sus datos y sus errores por campo.
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formDomicilio, setFormDomicilio] = useState(FORM_VACIO)
  const [erroresForm, setErroresForm] = useState({})

  // ESTADO: mensajes de error al confirmar (stock insuficiente, plato no publicado...). Lista vacía = sin errores.
  const [conflictos, setConflictos] = useState([])

  // ESTADO: true mientras esperamos la respuesta del checkout. Deshabilita el botón para que un
  // doble clic no cree dos pedidos.
  const [confirmando, setConfirmando] = useState(false)

  // GET /domicilios al abrir la vista (paso 12.4a). Es ruta privada: lleva el token.
  // Dependencias [token]: solo se vuelve a ejecutar si cambia el token (el efecto no lo modifica).
  useEffect(() => {
    fetch(`${API_URL}/domicilios`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      .then((data) => setDomicilios(data ?? [])) // lista vacía llega como null
      .catch((fallo) => {
        // 401: el token ya no sirve; App cierra la sesión y la ruta protegida nos manda a /ingreso.
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        setError(mensajeDe(fallo))
      })
      .finally(() => setCargando(false))
  // onSesionVencida queda afuera de las dependencias a propósito: App la crea de nuevo en cada render y
  // el GET se repetiría sin parar. (Se resuelve con useCallback cuando se vea en clase.)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Renderizado condicional: si estamos cargando o hubo un error, mostramos eso y cortamos acá.
  // Los hooks (useState) siempre van ANTES de estos return.
  if (cargando) {
    return <LoadingState message="Cargando tus domicilios..." />
  }
  if (error !== null) {
    return <ErrorState message={error} />
  }

  // Sin ítems no hay nada que comprar.
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

  // Un único handler para todos los inputs del formulario: event.target.name dice qué campo
  // cambió y value qué escribió el usuario ([name]: value es una "clave calculada").
  const handleFormChange = (event) => {
    const { name, value } = event.target
    setFormDomicilio({ ...formDomicilio, [name]: value })
    if (erroresForm[name]) {
      setErroresForm({ ...erroresForm, [name]: null })
    }
  }

  // Guarda el domicilio nuevo. Valida los campos obligatorios igual que la API.
  const guardarDomicilio = (event) => {
    event.preventDefault()

    // filter se queda con los obligatorios que están vacíos; Object.fromEntries arma un objeto
    // { campo: mensaje } a partir de una lista de pares [campo, mensaje].
    const faltantes = CAMPOS_OBLIGATORIOS.filter((nombre) => formDomicilio[nombre].trim() === '')
    if (faltantes.length > 0) {
      setErroresForm(Object.fromEntries(faltantes.map((nombre) => [nombre, 'Este dato es obligatorio.'])))
      return
    }

    // Los opcionales vacíos se mandan como null, como los devuelve la API.
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

    // POST /domicilios/createDomicilio (paso 12.4a): escritura dentro del handler del submit.
    fetch(`${API_URL}/domicilios/createDomicilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ruta privada
      },
      body: JSON.stringify(datos),
    })
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      // Sumamos el domicilio creado (con el id que asignó el backend) SIN volver a pedir la lista.
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

  // Confirmar pedido (paso 12.4b). Requiere un domicilio elegido (el botón ya está deshabilitado sin uno).
  // POST /carrito/checkout { domicilioEntregaId }: el backend valida el stock, descuenta, arma un subpedido
  // por chef, vacía la cesta del servidor y devuelve el pedido (OrderResponse). Es una escritura: va acá
  // en el handler del clic, nunca en un efecto.
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
      .then((response) =>
        response.json().then((cuerpo) => {
          if (!response.ok) {
            const fallo = new Error(cuerpo.message)
            fallo.status = response.status
            throw fallo
          }
          return cuerpo.data
        })
      )
      .then((pedido) => {
        // App suma el pedido y vacía la cesta; nosotros vamos a "Mis pedidos".
        onPedidoCreado(pedido)
        navigate('/pedidos')
      })
      .catch((fallo) => {
        if (fallo.status === 401) {
          onSesionVencida()
          return
        }
        // 400 (stock insuficiente, carrito vacío...), 403, 404: mostramos el mensaje del backend.
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

      {/* Renderizado condicional: el aviso solo aparece si hay conflictos */}
      {conflictos.length > 0 && (
        <div className="mt-6">
          <Alert title="No pudimos confirmar tu pedido" messages={conflictos} />
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-8">
          <DomicilioPicker domicilios={domicilios} selectedId={domicilioElegidoId} onSelect={setDomicilioElegidoId} />

          {/* El formulario se muestra o se esconde según el estado mostrarForm (nada de DOM) */}
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

          {/* Mientras no haya domicilio elegido, explicamos por qué el botón está deshabilitado */}
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
