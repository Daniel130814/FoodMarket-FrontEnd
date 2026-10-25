// Pestañas para alternar entre listas. No guarda cuál está activa: el padre manda el id y recibe los cambios.

// Props: tabs ({ id, label, count }), activeId, onChange (id), label (nombre accesible del grupo).
function Tabs({ tabs, activeId, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
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
