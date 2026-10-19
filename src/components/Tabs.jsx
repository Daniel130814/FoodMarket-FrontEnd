// Pestañas para alternar entre dos o más listas. Se usa en views/MisPedidos.
// Componente "tonto": no guarda cuál pestaña está activa, el padre manda el id y recibe los cambios.

// Props:
//  - tabs: array de pestañas { id, label, count }. count es la cantidad que se muestra al lado.
//  - activeId: id de la pestaña activa (lo guarda el padre con useState)
//  - onChange: función del padre (id); se llama al tocar una pestaña
//  - label: nombre accesible del grupo de pestañas (lo lee el lector de pantalla)
function Tabs({ tabs, activeId, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {/* map: un botón por pestaña. key = id, único y estable */}
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === activeId}
          onClick={() => onChange(tab.id)}
        >
          {tab.label} <span className="tabular text-on-surface-variant">{tab.count}</span>
        </button>
      ))}
    </div>
  )
}

export default Tabs
