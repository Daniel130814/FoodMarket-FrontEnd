// LogoCloche: el logo grande de la portada. Aparece cuando se levanta una cloche (animación solo de CSS en index.css).
import Logo from './Logo'

// Sin props: la escena entera (cloche, logo y aro) se anima sola al montarse.
function LogoCloche() {
  return (
    <div className="cloche">
      {/* Aro terracota: se dibuja alrededor del logo, como el borde de un plato (pathLength=1 permite animarlo) */}
      <svg className="cloche__aro" viewBox="0 0 580 220" aria-hidden="true" focusable="false">
        <rect x="2" y="2" width="576" height="216" rx="108" pathLength="1" />
      </svg>

      <div className="cloche__logo">
        <Logo size="xl" />
      </div>

      {/* La tapa va al final para quedar por encima del logo mientras lo cubre */}
      <svg className="cloche__tapa" viewBox="0 0 240 106" aria-hidden="true" focusable="false">
        <path className="cloche__domo" d="M16 100C16 52 60 14 120 14C180 14 224 52 224 100Z" />
        <circle className="cloche__perilla" cx="120" cy="9" r="7" />
        <path className="cloche__base" d="M6 100H234" />
        <path className="cloche__brillo" d="M40 86C42 62 60 40 88 28" />
      </svg>
    </div>
  )
}

export default LogoCloche
