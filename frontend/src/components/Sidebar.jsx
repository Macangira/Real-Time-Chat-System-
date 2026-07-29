import { useState } from 'react'
import Modal from './Modal'
import styles from './Sidebar.module.css'

function Avatar({ name, group }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div className={`${styles.avatar} ${group ? styles.avatarGroup : ''}`}>
      {initial}
    </div>
  )
}

export default function Sidebar({
  rooms, loading, selectedRoomId,
  username, onSelectRoom, onCreateRoom, onRefresh, onLogout,
  mobileVisible, isOpen = true, onToggleSidebar
}) {
  const [search,   setSearch]   = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form,     setForm]     = useState({ name: '', description: '', roomType: 'direct' })
  const [creating, setCreating] = useState(false)
  const [formErr,  setFormErr]  = useState('')

  const filtered = rooms.filter(r =>
    (r.name || 'Direct').toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return setFormErr('Room name is required.')
    setFormErr('')
    setCreating(true)
    try {
      await onCreateRoom(form)
      setShowModal(false)
      setForm({ name: '', description: '', roomType: 'direct' })
    } catch (err) {
      setFormErr(err.message || 'Failed to create room.')
    } finally {
      setCreating(false)
    }
  }

  function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const initial = (username || 'U')[0].toUpperCase()

  return (
    <>
      <aside className={`${styles.sidebar} ${!mobileVisible ? styles.mobileHidden : ''} ${!isOpen ? styles.collapsed : ''}`}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>💬</div>
            <span className={styles.brandName}>MegaBite Chat</span>
          </div>
          <div className={styles.headerBtns}>
            <button className={styles.iconBtn} title="New room" onClick={() => setShowModal(true)}>
              <PlusIcon />
            </button>
            <button className={styles.iconBtn} title="Refresh" onClick={onRefresh}>
              <RefreshIcon />
            </button>
            {onToggleSidebar && (
              <button className={styles.iconBtn} title="Close sidebar" onClick={onToggleSidebar}>
                <CloseSidebarIcon />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <SearchIcon />
          <input
            className={styles.searchInput}
            placeholder="Search rooms…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Room list */}
        <div className={styles.roomList}>
          <div className={styles.sectionLabel}>Conversations</div>

          {loading && (
            <div className={styles.emptyState}>
              <div className={styles.spinnerLg} />
              <span>Loading rooms…</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <span>{rooms.length === 0 ? 'No rooms yet. Create one!' : 'No results'}</span>
            </div>
          )}

          {!loading && filtered.map(room => {
            const id        = String(room._id || room.id || '').trim()
            const activeId  = String(selectedRoomId || '').trim()
            const name      = room.name || 'Direct Chat'
            const isGroup   = room.roomType === 'group'
            const active    = id !== '' && activeId !== '' && id === activeId
            const hasUnread = Boolean(room.unread && room.unread > 0)

            return (
              <button
                key={id}
                className={`${styles.roomItem} ${active ? styles.roomActive : ''}`}
                onClick={() => onSelectRoom(room)}
              >
                <Avatar name={name} group={isGroup} />
                <div className={styles.roomInfo}>
                  <div className={styles.roomName}>{name}</div>
                  <div className={styles.roomLast}>
                    {room.lastMessage || <em style={{ color: 'var(--text-muted)' }}>No messages yet</em>}
                  </div>
                </div>
                <div className={styles.roomMeta}>
                  {room.lastMessageAt && <span className={styles.roomTime}>{formatTime(room.lastMessageAt)}</span>}
                  {hasUnread && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span className={styles.unreadBadge}>NEW</span>
                      <span className={styles.unreadDot} title="New Message" />
                    </div>
                  )}
                  {room.hasNew && !hasUnread && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <span className={styles.unreadDot} title="New Message" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.userAvatar}>{initial}</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{username}</div>
            <div className={styles.userStatus}><span className={styles.dot} />Online</div>
          </div>
          <button className={styles.iconBtn} title="Logout" onClick={onLogout}>
            <LogoutIcon />
          </button>
        </div>

      </aside>

      {/* Create room modal */}
      <Modal
        open={showModal}
        title="Create New Room"
        subtitle="Set up a chat room to start messaging"
        onClose={() => { setShowModal(false); setFormErr('') }}
      >
        <form onSubmit={handleCreate} className={styles.modalForm}>
          {formErr && <div className={styles.formErr}><span>⚠️</span> {formErr}</div>}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Room Name</label>
            <input className={styles.fieldInput} type="text" placeholder="e.g. Project Alpha"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Description <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>(optional)</small></label>
            <input className={styles.fieldInput} type="text" placeholder="What's this room for?"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Room Type</label>
            <select className={styles.fieldSelect}
              value={form.roomType} onChange={e => setForm(p => ({ ...p, roomType: e.target.value }))}>
              <option value="direct">Direct</option>
              <option value="group">Group</option>
            </select>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={creating}>
              {creating ? 'Creating…' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

/* ── SVG Icons ── */
const PlusIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, color: 'var(--text-muted)' }}>
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const CloseSidebarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
    <path d="M15 10l-2 2 2 2"/>
  </svg>
)
