interface Slice {
  label: string
  value: number
  color: string
}

interface Props {
  slices: Slice[]
  centerLabel: string
  centerValue: string
}

export function PieChart({ slices, centerLabel, centerValue }: Props) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  let gradient = 'conic-gradient(rgba(16, 42, 40, 0.08) 0 100%)'
  if (total > 0) {
    let cursor = 0
    const parts = slices.map((slice) => {
      const start = cursor
      const pct = (slice.value / total) * 100
      cursor += pct
      return `${slice.color} ${start}% ${cursor}%`
    })
    gradient = `conic-gradient(${parts.join(', ')})`
  }

  return (
    <div className="pie">
      <div className="pie__chart" style={{ background: gradient }} aria-hidden="true">
        <div className="pie__hole">
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>
      <ul className="pie__legend">
        {slices.map((slice) => {
          const pct = total === 0 ? 0 : Math.round((slice.value / total) * 100)
          return (
            <li key={slice.label}>
              <span className="pie__swatch" style={{ background: slice.color }} />
              <span className="pie__label">{slice.label}</span>
              <span className="pie__value">
                {slice.value} · {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
