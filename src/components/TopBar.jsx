import { useState } from 'react'

export default function TopBar({ searchQuery, onSearchChange, onAddClick, showForm }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-logo">📚</span>
        <h1 className="topbar-title">CampusDrop</h1>
        <span className="topbar-subtitle">Academic Resource Hub</span>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <button
          className={`btn-add ${showForm ? 'active' : ''}`}
          onClick={onAddClick}
          aria-label={showForm ? 'Close form' : 'Add resource'}
          title={showForm ? 'Close form' : 'Add resource'}
        >
          <span className="btn-add-icon">{showForm ? '✕' : '+'}</span>
          <span className="btn-add-text">{showForm ? 'Close' : 'Add Resource'}</span>
        </button>
      </div>
    </header>
  )
}
