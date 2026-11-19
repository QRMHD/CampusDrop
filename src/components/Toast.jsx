export default function Toast({ message, type = 'success' }) {
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">
        {type === 'success' ? '✓' : '✕'}
      </span>
      {message}
    </div>
  )
}
