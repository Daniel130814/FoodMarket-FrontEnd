// Tarjeta de un chef (foto, especialidad, reputación y presentación) para la sección "Quiénes cocinan" de Inicio.
import { useState } from 'react'

// Props: chef (ChefProfileResponse; los textos pueden venir vacíos o en null).
// TODO(backend): el perfil no trae el nombre del chef ni su taller; por eso no se muestran.
function ChefCard({ chef }) {
  const { fotoUrl, especialidad, reputacion, biografia, descripcion } = chef

  // true si la foto no cargó (por ejemplo, una URL rota): se muestra un ícono.
  const [fotoRota, setFotoRota] = useState(false)

  return (
    <li className="flex flex-col gap-5 py-8 first:pt-0 md:px-8 md:py-0 md:first:pl-0 md:last:pr-0">
      <div className="flex items-center gap-4">
        {fotoUrl && !fotoRota ? (
          <img
            src={fotoUrl}
            alt=""
            onError={() => setFotoRota(true)}
            className="h-[72px] w-[72px] flex-none rounded-full object-cover ring-1 ring-hairline"
          />
        ) : (
          <span className="grid h-[72px] w-[72px] flex-none place-items-center rounded-full bg-surface-container-high text-primary ring-1 ring-hairline">
            <span className="material-symbols-outlined text-[32px]" aria-hidden="true">restaurant</span>
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-display text-headline-sm text-primary">{especialidad ?? 'Chef de Appetitos'}</h3>
          {/* La API devuelve reputación 0 si el chef no tiene reseñas */}
          <p className="mt-0.5 text-label-md text-primary">
            {reputacion > 0 ? (
              <>★ {reputacion}</>
            ) : (
              <span className="font-normal text-on-surface-variant">Todavía sin reseñas</span>
            )}
          </p>
        </div>
      </div>
      {biografia && (
        <blockquote className="flex-1 font-display text-[20px] italic leading-[30px] text-on-surface">“{biografia}”</blockquote>
      )}
      {descripcion && <p className="text-body-sm text-on-surface-variant">{descripcion}</p>}
    </li>
  )
}

export default ChefCard
