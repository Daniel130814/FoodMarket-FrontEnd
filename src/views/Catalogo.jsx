import PlatoCard from '../components/PlatoCard'
import hero from '../assets/hero.png'

const PLATOS = [
  {
    id: 1,
    title: 'Ravioli de hongos silvestres y noisette',
    description: 'Pasta de sémola rellena de ricotta de granja, setas de temporada y salvia crujiente.',
    images: [hero],
    price: 18400,
    discountPercent: 0,
    stock: 4,
    seller: { id: 1, name: 'Matteo Rossi' },
  },
  {
    id: 2,
    title: 'Berenjena asada laqueada con miso',
    description: 'Berenjena al horno con glaseado de miso y cebolla de verdeo.',
    images: [hero],
    price: 12750,
    discountPercent: 15,
    stock: 12,
    seller: { id: 2, name: 'Clara Méndez' },
  },
  {
    id: 3,
    title: 'Tiramisú de la casa',
    description: 'Mascarpone, café de especialidad y bizcochos caseros.',
    images: [hero],
    price: 6500,
    discountPercent: 0,
    stock: 0,
    seller: { id: 1, name: 'Matteo Rossi' },
  },
]

function Catalogo() {
  return (
    <>
      <h1 className="font-display text-headline-lg text-primary">Catálogo</h1>
      <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
        {PLATOS.map((plato) => (
          <PlatoCard key={plato.id} dish={plato} />
        ))}
      </div>
    </>
  )
}

export default Catalogo
