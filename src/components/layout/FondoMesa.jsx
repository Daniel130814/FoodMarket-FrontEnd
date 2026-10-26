// FondoMesa: fondo de la portada, una mesa vista desde arriba (anillos de plato y fotos de platos). Solo decoración.
import FondoFoto from './FondoFoto'

// Factores de tamaño de los anillos (múltiplos del logo) y íconos de respaldo, en el orden de las posiciones.
const ANILLOS = [7, 10, 13, 16]
const ICONOS = ['restaurant', 'eco', 'nutrition', 'egg_alt', 'bakery_dining', 'set_meal']

// Props: platos (los de Inicio; se usan las primeras fotos). Con menos de 3 fotos se muestran íconos.
function FondoMesa({ platos }) {
  // Sin repetidas: varios platos pueden compartir la misma foto y la URL es la key.
  const fotos = [...new Set(platos.map((plato) => plato.imagenesUrls?.[0]).filter((url) => url !== undefined))].slice(0, 6)

  return (
    <div className="aparece pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true" style={{ '--retraso': '1.6s' }}>
      {/* Anillos concéntricos que prolongan el aro del logo */}
      <div className="fondo-anillos">
        {ANILLOS.map((factor) => (
          <span key={factor} className="fondo-anillo" style={{ '--k': factor }} />
        ))}
      </div>

      {fotos.length >= 3
        ? fotos.map((url, indice) => <FondoFoto key={url} url={url} clase={`fondo-foto-${indice + 1}`} />)
        : ICONOS.map((icono, indice) => (
            <span key={icono} className={`fondo-icono material-symbols-outlined fondo-foto-${indice + 1}`}>
              {icono}
            </span>
          ))}
    </div>
  )
}

export default FondoMesa
