import { useState, useEffect, useCallback, useRef } from 'react'
import TopBar from './components/TopBar'
import FilterBar from './components/FilterBar'
import AddResourceForm from './components/AddResourceForm'
import ResourceGrid from './components/ResourceGrid'
import Toast from './components/Toast'
import * as api from './api'
import './App.css'

export default function App() {
  const [resources, setResources] = useState([])
  const [meta, setMeta] = useState({ weeks: [], courses: [] })
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterWeek, setFilterWeek] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  const loadResources = useCallback(async () => {
    try {
      const data = await api.fetchResources({
        q: debouncedQuery,
        category: filterCategory,
        week: filterWeek,
      })
      setResources(data)
    } catch (err) {
      console.error('Load error:', err)
      showToast(err.message || 'Failed to load resources', 'error')
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, filterCategory, filterWeek, showToast])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const loadMeta = useCallback(async () => {
    try {
      const data = await api.fetchMeta()
      setMeta(data)
    } catch (err) {
      console.error('Meta load error:', err)
    }
  }, [])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  const categories = ['All', 'Lab Notes', 'Cloud Checklist', 'Study Resource']
  const weeks = ['All', ...meta.weeks]

  const hasActiveFilters = filterCategory !== 'All' || filterWeek !== 'All' || searchQuery !== ''

  function resetFilters() {
    setFilterCategory('All')
    setFilterWeek('All')
    setSearchQuery('')
    setDebouncedQuery('')
  }

  async function addResource(data) {
    await api.createResource(data)
    await Promise.all([loadResources(), loadMeta()])
    setShowForm(false)
    showToast('Resource added!')
  }

  async function handleDelete(id) {
    try {
      await api.deleteResource(id)
      await Promise.all([loadResources(), loadMeta()])
      showToast('Resource deleted')
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error')
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text).then(
      () => showToast('Copied to clipboard!'),
      () => showToast('Copy failed — try selecting and copying manually', 'error')
    )
  }

  return (
    <div className="app">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={() => setShowForm(v => !v)}
        showForm={showForm}
      />

      <main className="main-content">
        <FilterBar
          categories={categories}
          weeks={weeks}
          filterCategory={filterCategory}
          filterWeek={filterWeek}
          onCategoryChange={setFilterCategory}
          onWeekChange={setFilterWeek}
        />

        {showForm && (
          <AddResourceForm
            onSubmit={addResource}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading resources...</p>
          </div>
        ) : (
          <ResourceGrid
            resources={resources}
            onDelete={handleDelete}
            onCopy={handleCopy}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
            searchQuery={debouncedQuery}
          />
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
