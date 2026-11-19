import { useState } from 'react'

const CATEGORY_STYLES = {
  'Lab Notes':        { emoji: '🧪', color: '#6366f1', bg: '#eef2ff' },
  'Cloud Checklist':  { emoji: '☁️', color: '#0891b2', bg: '#ecfeff' },
  'Study Resource':   { emoji: '📖', color: '#059669', bg: '#ecfdf5' },
}

export default function ResourceCard({ resource, onDelete, onCopy }) {
  const [copied, setCopied] = useState(null) // 'snippet' | 'link' | null
  const style = CATEGORY_STYLES[resource.category] || CATEGORY_STYLES['Study Resource']

  const timeAgo = getTimeAgo(resource.created_at)

  function handleCopy(text, type) {
    onCopy(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <article className="resource-card">
      <div className="card-header">
        <span
          className="card-category-badge"
          style={{ color: style.color, backgroundColor: style.bg }}
        >
          {style.emoji} {resource.category}
        </span>
        <button
          className="card-delete"
          onClick={() => onDelete(resource.id)}
          title="Delete resource"
        >
          ×
        </button>
      </div>

      <h3 className="card-title">{resource.title}</h3>

      <div className="card-tags">
        <span className="tag tag-course">{resource.course}</span>
        <span className="tag tag-week">{resource.week}</span>
      </div>

      {resource.notes && (
        <p className="card-notes">{resource.notes}</p>
      )}

      {resource.snippet && (
        <div className="card-snippet-wrapper">
          <div className="snippet-header">
            <span className="snippet-label">📋 Snippet</span>
            <button
              className={`btn-copy ${copied === 'snippet' ? 'copied' : ''}`}
              onClick={() => handleCopy(resource.snippet, 'snippet')}
              aria-label="Copy code snippet"
              title="Copy snippet"
            >
              {copied === 'snippet' ? '✓ Copied!' : '⧉ Copy'}
            </button>
          </div>
          <pre className="card-snippet"><code>{resource.snippet}</code></pre>
        </div>
      )}

      <div className="card-footer">
        <div className="card-footer-left">
          {resource.link && (
            <>
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="card-link"
              >
                🔗 Open Link
              </a>
              <button
                className={`btn-copy-link ${copied === 'link' ? 'copied' : ''}`}
                onClick={() => handleCopy(resource.link, 'link')}
              >
                {copied === 'link' ? '✓' : '⧉'}
              </button>
            </>
          )}
        </div>
        <span className="card-time">{timeAgo}</span>
      </div>
    </article>
  )
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
