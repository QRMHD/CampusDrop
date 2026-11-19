export default function FilterBar({
  categories,
  weeks,
  filterCategory,
  filterWeek,
  onCategoryChange,
  onWeekChange,
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Category</span>
        <div className="pills">
          {categories.map(c => (
            <button
              key={c}
              className={`pill ${filterCategory === c ? 'pill-active' : ''}`}
              onClick={() => onCategoryChange(c)}
            >
              {c === 'All' ? '🗂 All' : c === 'Lab Notes' ? '🧪 Lab Notes' : c === 'Cloud Checklist' ? '☁️ Cloud Checklist' : '📖 Study Resource'}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-group filter-group-weeks">
        <span className="filter-label">Week</span>
        <div className="pills pills-weeks">
          {weeks.map(w => (
            <button
              key={w}
              className={`pill ${filterWeek === w ? 'pill-active' : ''}`}
              onClick={() => onWeekChange(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
