import { useState } from 'react'

const EMPTY = {
  title: '', course: '', week: 'Week 1', category: 'Lab Notes',
  notes: '', link: '', snippet: '',
}

function validateField(name, value, allValues) {
  switch (name) {
    case 'title':
      if (!value.trim()) return 'Title is required'
      if (value.trim().length < 3) return 'Title must be at least 3 characters'
      if (value.trim().length > 120) return 'Title must be under 120 characters'
      return ''
    case 'course':
      if (!value.trim()) return 'Course or tag is required'
      if (value.trim().length > 60) return 'Course must be under 60 characters'
      return ''
    case 'link':
      if (!value.trim()) return '' // optional
      try {
        const url = new URL(value.trim())
        if (!['http:', 'https:'].includes(url.protocol)) {
          return 'Link must start with http:// or https://'
        }
      } catch {
        return 'Enter a valid URL (e.g. https://example.com)'
      }
      return ''
    default:
      return ''
  }
}

export default function AddResourceForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Clear error on edit if already touched
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value, { ...form, [field]: value }) }))
    }
  }

  function handleBlur(field) {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(prev => ({ ...prev, [field]: validateField(field, form[field], form) }))
  }

  function validateAll() {
    const fields = ['title', 'course', 'link']
    const newErrors = {}
    let valid = true

    for (const field of fields) {
      const error = validateField(field, form[field], form)
      newErrors[field] = error
      if (error) valid = false
    }

    setErrors(newErrors)
    setTouched({ title: true, course: true, link: true })
    return valid
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateAll()) return

    setSubmitting(true)
    try {
      await onSubmit(form)
      setForm(EMPTY)
      setErrors({})
      setTouched({})
    } catch {
      // parent handles the toast
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">➕ Add New Resource</h2>
      <div className="form-grid">

        <div className={`form-field ${errors.title && touched.title ? 'has-error' : ''}`}>
          <label>Title *</label>
          <input
            type="text"
            placeholder="e.g. Sorting Algorithms Lab"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            onBlur={() => handleBlur('title')}
            aria-invalid={!!(errors.title && touched.title)}
          />
          {errors.title && touched.title && (
            <span className="field-error">{errors.title}</span>
          )}
        </div>

        <div className={`form-field ${errors.course && touched.course ? 'has-error' : ''}`}>
          <label>Course / Tag *</label>
          <input
            type="text"
            placeholder="e.g. CS301 Cloud Computing"
            value={form.course}
            onChange={e => update('course', e.target.value)}
            onBlur={() => handleBlur('course')}
            aria-invalid={!!(errors.course && touched.course)}
          />
          {errors.course && touched.course && (
            <span className="field-error">{errors.course}</span>
          )}
        </div>

        <div className="form-field">
          <label>Week</label>
          <select value={form.week} onChange={e => update('week', e.target.value)}>
            {Array.from({ length: 14 }, (_, i) => (
              <option key={i} value={`Week ${i + 1}`}>Week {i + 1}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Category</label>
          <select value={form.category} onChange={e => update('category', e.target.value)}>
            <option>Lab Notes</option>
            <option>Cloud Checklist</option>
            <option>Study Resource</option>
          </select>
        </div>

        <div className="form-field full-width">
          <label>Notes</label>
          <textarea
            rows="3"
            placeholder="Key points, checklist items, or description..."
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
          />
        </div>

        <div className="form-field full-width">
          <label>Code Snippet / Command</label>
          <textarea
            rows="3"
            className="snippet-input"
            placeholder="Paste CLI commands, config blocks, code snippets..."
            value={form.snippet}
            onChange={e => update('snippet', e.target.value)}
          />
        </div>

        <div className={`form-field full-width ${errors.link && touched.link ? 'has-error' : ''}`}>
          <label>Link (optional)</label>
          <input
            type="url"
            placeholder="https://..."
            value={form.link}
            onChange={e => update('link', e.target.value)}
            onBlur={() => handleBlur('link')}
            aria-invalid={!!(errors.link && touched.link)}
          />
          {errors.link && touched.link && (
            <span className="field-error">{errors.link}</span>
          )}
        </div>

      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Resource'}
        </button>
      </div>
    </form>
  )
}
