import ResourceCard from './ResourceCard'

export default function ResourceGrid({ resources, onDelete, onCopy, hasActiveFilters, onResetFilters, searchQuery }) {
  if (resources.length === 0) {
    // Different empty states depending on context
    if (searchQuery) {
      return (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>No results for "{searchQuery}"</h3>
          <p>Try different keywords or check your spelling.</p>
          {hasActiveFilters && (
            <button className="btn-reset" onClick={onResetFilters}>
              Clear all filters
            </button>
          )}
        </div>
      )
    }

    if (hasActiveFilters) {
      return (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>Nothing matches these filters</h3>
          <p>No resources found for the selected category and week combination.</p>
          <button className="btn-reset" onClick={onResetFilters}>
            Reset filters
          </button>
        </div>
      )
    }

    return (
      <div className="empty-state">
        <span className="empty-icon">🚀</span>
        <h3>No resources yet</h3>
        <p>Click <strong>+ Add Resource</strong> in the top bar to get started.</p>
      </div>
    )
  }

  return (
    <>
      <p className="result-count">
        {resources.length} resource{resources.length !== 1 ? 's' : ''}
        {searchQuery && <> matching <strong>"{searchQuery}"</strong></>}
      </p>
      <div className="resource-grid">
        {resources.map(r => (
          <ResourceCard key={r.id} resource={r} onDelete={onDelete} onCopy={onCopy} />
        ))}
      </div>
    </>
  )
}
