import { useState, useRef, useEffect } from 'react'
import Modal from './Modal'
import NotificationCard from './NotificationCard'
import styles from './ChatArea.module.css'

export default function ChatArea({
  room, messages, loading, userId, username,
  typingUserId, onSend, onDeleteRoom, onTyping, onBack,
  isSidebarOpen = true, onToggleSidebar,
  notifications = [], onMarkNotifRead
}) {
  const [showNotifCard, setShowNotifCard] = useState(false)
  const [text,        setText]        = useState('')
  const [showDelete,  setShowDelete]  = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)
  const typingTimerRef = useRef(null)

  /* Scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* Auto-focus on room select */
  useEffect(() => {
    if (room) textareaRef.current?.focus()
  }, [room])

  /* Send on Enter (not Shift+Enter) */
  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e) {
    setText(e.target.value)
    // Auto-resize
    const ta = e.target
    ta.style.height = ''
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
    // Typing event
    clearTimeout(typingTimerRef.current)
    onTyping?.()
    typingTimerRef.current = setTimeout(() => {}, 2000)
  }

  function handleSend() {
    if (!text.trim() || !room) return
    onSend(text.trim())
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = ''
  }

  async function handleDelete() {
    setDeleting(true)
    try { await onDeleteRoom() }
    finally { setDeleting(false); setShowDelete(false) }
  }

  function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function statusIcon(status) {
    const map = {
      send:      '✓',
      delivered: '✓✓',
      read:      <span style={{ color: 'var(--accent)' }}>✓✓</span>,
      pending:   '⏳',
      failed:    '❌',
    }
    return map[status] || ''
  }

  /* ── No room selected ── */
  if (!room) {
    return (
      <main className={styles.main}>
        {!isSidebarOpen && onToggleSidebar && (
          <div className={styles.header} style={{ justifyContent: 'flex-start' }}>
            <button className={styles.iconBtn} onClick={onToggleSidebar} title="Open sidebar">
              <OpenSidebarIcon />
            </button>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-sub)' }}>Open Sidebar</span>
          </div>
        )}
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>💬</div>
          <h3>Select a room to start chatting</h3>
          <p>Choose a conversation from the sidebar or create a new room.</p>
          {!isSidebarOpen && onToggleSidebar && (
            <button
              className={styles.btnSecondary}
              style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={onToggleSidebar}
            >
              <OpenSidebarIcon /> Open Sidebar
            </button>
          )}
        </div>
      </main>
    )
  }

  const roomName  = room.name || 'Direct Chat'
  const isGroup   = room.roomType === 'group'
  const roomInit  = roomName[0].toUpperCase()

  return (
    <>
      <main className={styles.main}>

        {/* Header */}
        <div className={styles.header}>
          {!isSidebarOpen && onToggleSidebar && (
            <button className={styles.iconBtn} onClick={onToggleSidebar} title="Open sidebar">
              <OpenSidebarIcon />
            </button>
          )}

          <button className={styles.backBtn} onClick={onBack} title="Back">
            <BackIcon />
          </button>

          <div className={`${styles.headerAvatar} ${isGroup ? styles.avatarGroup : ''}`}>
            {roomInit}
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.headerTitle}>{roomName}</div>
            <div className={styles.headerStatus}>
              <span className={styles.statusDot} />
              {room.status || 'active'}
            </div>
          </div>

          <div className={styles.headerActions} style={{ position: 'relative' }}>
            <button
              className={styles.iconBtn}
              title="Notifications"
              onClick={() => setShowNotifCard(prev => !prev)}
              style={{ position: 'relative' }}
            >
              <BellIcon />
              {notifications.some(n => !n.isRead) && (
                <span className={styles.bellBadge} />
              )}
            </button>

            {/* Top-Right Header Glassmorphic Notification Card */}
            <NotificationCard
              open={showNotifCard}
              notifications={notifications}
              onClose={() => setShowNotifCard(false)}
              onMarkRead={onMarkNotifRead}
            />

            <button className={styles.iconBtn} title="Delete room" onClick={() => setShowDelete(true)}>
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <span>Loading messages…</span>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👋</div>
              <p>No messages yet. Say hello!</p>
            </div>
          )}

          {!loading && messages.map((msg, i) => {
            const senderIdStr = String(msg.senderId || '').trim()
            const myIdStr     = String(userId || '').trim()
            const mine = senderIdStr !== '' && myIdStr !== '' && senderIdStr === myIdStr

            const displayName = mine
              ? 'You'
              : (msg.senderName || msg.senderUsername || (senderIdStr ? `User (${senderIdStr.slice(-4)})` : 'User'))

            const senderInitial = (displayName === 'You' ? (username || 'Y') : displayName)[0].toUpperCase()
            const time = formatTime(msg.createdAt)

            return (
              <div key={msg._id || msg.id || i} className={`${styles.msgRow} ${mine ? styles.mine : styles.theirs}`}>

                {/* Left avatar & name — for received messages */}
                {!mine && (
                  <div className={styles.msgAvatar} title={displayName}>
                    {senderInitial}
                  </div>
                )}

                <div className={styles.msgContent}>
                  {/* Sender label above received message */}
                  {!mine && (
                    <div className={styles.senderName}>
                      {displayName}
                    </div>
                  )}

                  {/* Sent label above my message */}
                  {mine && (
                    <div className={styles.mySenderName}>
                      You
                    </div>
                  )}

                  <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleThem}`}>
                    {msg.message}
                  </div>

                  <div className={`${styles.meta} ${mine ? styles.metaRight : styles.metaLeft}`}>
                    {time && <span>{time}</span>}
                    {mine && msg.status && (
                      <span className={styles.status}>{statusIcon(msg.status)}</span>
                    )}
                  </div>
                </div>

                {/* Right avatar — for sent messages */}
                {mine && (
                  <div className={`${styles.msgAvatar} ${styles.msgAvatarMe}`} title="You">
                    {(username || 'Y')[0].toUpperCase()}
                  </div>
                )}

              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        <div className={`${styles.typing} ${typingUserId ? styles.typingVisible : ''}`}>
          <div className={styles.typingDots}>
            <span /><span /><span />
          </div>
          <span>Someone is typing…</span>
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrap}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              value={text}
              onKeyDown={handleKey}
              onInput={handleInput}
              onChange={e => setText(e.target.value)}
            />
          </div>
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!text.trim()}
            title="Send"
          >
            <SendIcon />
          </button>
        </div>

      </main>

      {/* Delete modal */}
      <Modal
        open={showDelete}
        title="Delete Room?"
        subtitle="This permanently deletes the room and all messages."
        onClose={() => setShowDelete(false)}
      >
        <div className={styles.deleteFooter}>
          <button className={styles.btnSecondary} onClick={() => setShowDelete(false)}>Cancel</button>
          <button className={styles.btnDanger} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete Room'}
          </button>
        </div>
      </Modal>
    </>
  )
}

/* ── Icons ── */
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const OpenSidebarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
    <path d="M13 10l2 2-2 2"/>
  </svg>
)
const BellIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
