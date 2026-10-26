// FondoFoto: una foto redonda del fondo de la portada (decorativa).
import { useState } from 'react'

// Props: url (foto del plato), clase (posición y tamaño: .fondo-foto-1 ... .fondo-foto-6 en index.css).
function FondoFoto({ url, clase }) {
  // true si la foto no cargó: no se muestra nada (es solo decoración).
  const [fotoRota, setFotoRota] = useState(false)

  if (fotoRota) {
    return null
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFotoRota(true)}
      className={`fondo-foto ${clase}`}
    />
  )
}

export default FondoFoto
