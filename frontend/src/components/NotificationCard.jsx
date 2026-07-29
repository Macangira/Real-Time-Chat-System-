import styles from './NotificationCard.module.css'

export default function NotificationCard({ notifications, open, onClose, onMarkRead }) {
  if (!open) return null

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.glassCard}>
        {/* Card Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <div className={styles.bellIcon}>🔔</div>
            <div>
              <h3 className={styles.title}>Notifications</h3>
              <p className={styles.subtitle}>
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">✕</button>
        </div>

        {/* List of Notifications */}
        <div className={styles.body}>
          {notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✨</div>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => {
              const id = n._id || n.id
              return (
                <div
                  key={id}
                  className={`${styles.notifItem} ${!n.isRead ? styles.unreadItem : ''}`}
                  onClick={() => onMarkRead && onMarkRead(id)}
                >
                  <div className={styles.notifIcon}>💬</div>
                  <div className={styles.notifContent}>
                    <div className={styles.notifTitle}>{n.title || 'New Message'}</div>
                    <div className={styles.notifBody}>{n.body}</div>
                    <div className={styles.notifTime}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                  {!n.isRead && <span className={styles.unreadDot} title="Unread" />}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
