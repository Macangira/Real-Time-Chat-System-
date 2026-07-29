import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const icons = { success: '✅', error: '❌', info: '💬', warning: '⚠️' }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={styles.container}>
        {toasts.map(t => (
          <div key={t.id} style={{ ...styles.toast, ...styles[t.type] }}>
            <span style={styles.icon}>{icons[t.type] || '💬'}</span>
            <span style={styles.text}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const styles = {
  container: {
    position: 'fixed',
    top: 20,
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    zIndex: 9999,
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255, 255, 255, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 14,
    padding: '12px 18px',
    fontSize: 13.5,
    fontWeight: 500,
    color: '#0f172a',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04)',
    animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    minWidth: 260,
    maxWidth: 380,
  },
  text: {
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  success: { borderLeft: '4px solid #16a34a' },
  error:   { borderLeft: '4px solid #ef4444' },
  info:    { borderLeft: '4px solid #6c63ff' },
  warning: { borderLeft: '4px solid #eab308' },
  icon:    { fontSize: 16, flexShrink: 0 },
}
