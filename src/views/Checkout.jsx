// Vista de checkout (ruta /checkout). Se abre desde la Cesta: se elige el domicilio de entrega y se confirma el pedido.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DomicilioPicker from '../components/DomicilioPicker'
import DomicilioForm from '../components/DomicilioForm'
import OrderSummary from '../components/OrderSummary'
import EmptyState from '../components/EmptyState'
import Alert from '../components/Alert'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import PLATOS_EJEMPLO from '../data/platosEjemplo'

// Costo de envío fijo de ejemplo (el mismo valor que en la Cesta). La API todavía no lo calcula.
const ENVIO = 3200

// DOMICILIOS DE EJEMPLO (TEMPORAL, paso 11b.7). Tienen la forma de DomicilioResponse de la API
// (ENDPOINTS.md, sección 3.11). En el paso 12 se piden con GET /domicilios.
const DOMICILIOS_EJEMPLO = [
  {
    id: 5,
    calle: 'Av. Santa Fe',
    numero: '3421',
    piso: '4',
    departamento: 'B',
    ciudad: 'CABA',
    provincia: 'Buenos Aires',
    codigoPostal: '1425',
    indicacionesEntrega: 'Timbre 4B',
  },
  {
    id: 6,
    calle: 'Mendoza',
    numero: '1850',
    piso: null,
    departamento: null,
    ciudad: 'CABA',
    provincia: 'Buenos Aires',
    codigoPostal: '1428',
    indicacionesEntrega: null,
  },
]

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
//  - onConfirm: función (domicilioId) de App. Crea el pedido, vacía la cesta y avisa. Checkout solo
//    avisa "confirmé con este domicilio"; qué pasa con los pedidos lo decide App.
function Checkout({ carrito, cartCount, onConfirm }) {
  const navigate = useNavigate()
  const { items, totalEstimado } = carrito

  // ESTADOS de carga y error. Todavía no hay pedidos al backend, así que quedan fijos. El setter
  // (setCargando / setError) se agrega en el paso 12.
  const [cargando] = useState(false)
  const [error] = useState(null)

  // ESTADO: los domicilios guardados. Viven acá porque esta vista es el padre de DomicilioPicker
  // y DomicilioForm (ellos solo reciben datos y avisan cambios).
  const [domicilios, setDomicilios] = useState(DOMICILIOS_EJEMPLO)

  // ESTADO: id del domicilio elegido, o null si todavía no eligió ninguno.
  const [domicilioElegidoId, setDomicilioElegidoId] = useState(null)

  // ESTADOS del formulario de domicilio nuevo: si está abierto, sus datos y sus errores por campo.
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formDomicilio, setFormDomicilio] = useState(FORM_VACIO)
  const [erroresForm, setErroresForm] = useState({})

  // ESTADO: mensajes de conflicto de stock al confirmar. Lista vacía = sin conflictos.
  const [conflictos, setConflictos] = useState([])

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

    // Los opcionales vacíos se guardan como null, como los devuelve la API.
    const opcional = (valor) => (valor.trim() === '' ? null : valor.trim())

    // TEMPORAL: el id lo inventamos (el siguiente al más grande). En el paso 12 lo asigna el backend
    // al hacer POST /domicilios/createDomicilio.
    const nuevo = {
      id: domicilios.reduce((mayor, d) => Math.max(mayor, d.id), 0) + 1,
      calle: formDomicilio.calle.trim(),
      numero: formDomicilio.numero.trim(),
      piso: opcional(formDomicilio.piso),
      departamento: opcional(formDomicilio.departamento),
      ciudad: formDomicilio.ciudad.trim(),
      provincia: formDomicilio.provincia.trim(),
      codigoPostal: formDomicilio.codigoPostal.trim(),
      indicacionesEntrega: opcional(formDomicilio.indicacionesEntrega),
    }

    setDomicilios([...domicilios, nuevo])
    setDomicilioElegidoId(nuevo.id)
    setMostrarForm(false)
    setFormDomicilio(FORM_VACIO)
    setErroresForm({})
  }

  const cancelarForm = () => {
    setMostrarForm(false)
    setFormDomicilio(FORM_VACIO)
    setErroresForm({})
  }

  // Confirmar pedido. Requiere un domicilio elegido (el botón ya está deshabilitado sin uno).
  // TEMPORAL: en producción el backend valida el stock al hacer el checkout (responde 400 si no
  // hay) y esta revisión en el front se elimina.
  const confirmar = () => {
    // La regla de la profe pide .map() para recorrer (nunca forEach), así que lo hacemos en 2 pasos:
    //  1) .map() convierte CADA ítem en un mensaje de conflicto, o en null si está todo bien.
    //  2) .filter() descarta los null y deja solo los conflictos reales.
    // El ítem del carrito no trae el stock (la API no lo manda), así que lo consultamos por platoId.
    const mensajes = items
      .map((item) => {
        const actual = PLATOS_EJEMPLO.find((p) => p.id === item.platoId)
        const disponible = actual === undefined ? 0 : actual.stockDisponible

        if (disponible === 0) {
          return `${item.nombrePlato} se agotó.`
        }
        if (item.cantidad > disponible) {
          return `De ${item.nombrePlato} quedan ${disponible} y pediste ${item.cantidad}.`
        }
        // Sin conflicto: devolvemos null para que el filter lo saque
        return null
      })
      .filter((mensaje) => mensaje !== null)

    if (mensajes.length > 0) {
      // Hay conflicto: lo mostramos y NO confirmamos.
      setConflictos(mensajes)
      return
    }

    // Todo bien: App crea el pedido y vacía la cesta, y nosotros vamos a "Mis pedidos".
    setConflictos([])
    onConfirm(domicilioElegidoId)
    navigate('/pedidos')
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
            <DomicilioForm
              datos={formDomicilio}
              errores={erroresForm}
              onChange={handleFormChange}
              onSubmit={guardarDomicilio}
              onCancel={cancelarForm}
            />
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
            disabled={domicilioElegidoId === null}
          />
        </div>
      </div>
    </>
  )
}

export default Checkout
