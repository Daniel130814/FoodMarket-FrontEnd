import { Link } from 'react-router-dom'

function Inicio() {
  return (
    <>
      <h1 className="font-display text-display-lg text-primary">
        Comida real, de talleres cercanos
      </h1>
      <p className="mt-5 max-w-[34rem] text-body-lg text-on-surface-variant">
        Pedile a cocinas pequeñas e independientes. Cada plato se prepara en tandas cortas.
      </p>
      <Link to="/catalogo" className="btn btn-primary mt-8">Ver los platos</Link>
    </>
  )
}

export default Inicio
