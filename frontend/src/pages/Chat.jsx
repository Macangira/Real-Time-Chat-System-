import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, getUserId, getUsername, setSession, clearSession } from '../lib/api'
import { WS_BASE } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'
import styles from './Chat.module.css'

export default function Chat() {
  const navigate = useNavigate()
  const toast    = useToast()

  // ─── User identity (state so components re-render when resolved) ──
  const [myUserId,   setMyUserId]   = useState(getUserId())
  const [myUsername, setMyUsername] = useState(getUsername())
  const [userReady,  setUserReady]  = useState(false)

  // Keep a ref too so WS handlers always have latest without stale closure
  const myUserIdRef = useRef(getUserId())

  // ─── State ───────────────────────────────────────────────────────
  const [rooms,         setRooms]         = useState([])
  const [roomsLoading,  setRoomsLoading]  = useState(true)
  const [selectedRoom,  setSelectedRoom]  = useState(null)
  const [messages,      setMessages]      = useState([])
  const [msgsLoading,   setMsgsLoading]   = useState(false)
  const [typingUserId,  setTypingUserId]  = useState(null)
  const [mobileSidebar, setMobileSidebar] = useState(true)
  const [activeRoomId,  setActiveRoomId]  = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState([])

  // ─── Refs ─────────────────────────────────────────────────────────
  const wsRef            = useRef(null)
  const reconnectRef     = useRef(null)
  const currentRoomIdRef = useRef(null)
  const typingTimerRef   = useRef(null)
  const isTypingRef      = useRef(false)
  const typingOutTimer   = useRef(null)
  const loadTokenRef     = useRef(0)

  // ─── Step 1: Resolve current user on mount ───────────────────────
  // Always call /auth/me to get the real MongoDB _id (even if stored session exists)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    async function resolveUser() {
      try {
        const res  = await apiFetch('/auth/me')
        if (!res.ok) {
          // Token invalid → redirect to login
          clearSession()
          navigate('/login')
          return
        }
        const data = await res.json()

        // /auth/me now returns { user_id, username, ... } explicitly
        const resolvedId   = data.user_id || data._id || data.id || ''
        const resolvedName = data.username || myUsername || 'User'

        console.log('[Auth/me] response:', data)
        console.log('[Auth/me] resolved userId:', resolvedId)

        if (!resolvedId) {
          toast('Could not identify user. Please login again.', 'error')
          clearSession()
          navigate('/login')
          return
        }

        // Update session storage with fresh values
        setSession({ token: sessionStorage.getItem('chatflow_token') || '', userId: resolvedId, username: resolvedName })
        myUserIdRef.current = resolvedId

        setMyUserId(resolvedId)
        setMyUsername(resolvedName)
        setUserReady(true)
      } catch {
        toast('Cannot reach server. Is backend running on port 8000?', 'error')
      }
    }
    resolveUser()
  }, []) // eslint-disable-line

  // ─── Step 2: Load rooms + connect WS once user is resolved ───────
  useEffect(() => {
    if (!userReady) return
    loadRooms()
    wsConnect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [userReady]) // eslint-disable-line

  // ─── WebSocket ───────────────────────────────────────────────────
  function wsConnect() {
    const uid = myUserIdRef.current
    if (!uid) return
    if (wsRef.current && wsRef.current.readyState < 2) wsRef.current.close()

    const socket = new WebSocket(`${WS_BASE}/ws/${uid}`)
    wsRef.current = socket

    socket.onopen = () => {
      console.log('[WS] connected as', uid)
      const rid = currentRoomIdRef.current
      if (rid) wsSendRaw({ event: 'join_room', data: { chatRoomId: rid, userId: uid } }, socket)
    }

    socket.onmessage = (ev) => {
      try { handleWsEvent(JSON.parse(ev.data)) } catch { /* ignore */ }
    }

    socket.onclose = () => {
      console.log('[WS] closed — reconnect in 3s')
      reconnectRef.current = setTimeout(wsConnect, 3000)
    }

    socket.onerror = () => {}
  }

  function wsSendRaw(payload, socket) {
    const s = socket || wsRef.current
    if (s?.readyState === WebSocket.OPEN) s.send(JSON.stringify(payload))
  }

  // ─── WS Event Handler ────────────────────────────────────────────
  function handleWsEvent(msg) {
    if (msg.event === 'new_message') {
      const m = msg.data

      if (currentRoomIdRef.current && m.chatRoomId === currentRoomIdRef.current) {
        setMessages(prev => {
          const msgId = m._id || m.id
          // 1. If message already exists by permanent ID, do nothing
          if (msgId && prev.some(x => (x._id || x.id) === msgId)) return prev

          // 2. If it matches a temporary local message sent by me (same message text & sender), replace it
          const isFromMe = String(m.senderId || '').trim() === String(myUserIdRef.current || '').trim()
          if (isFromMe) {
            const tempIdx = prev.findIndex(x => String(x._id || '').startsWith('temp_') && x.message === m.message)
            if (tempIdx !== -1) {
              const updated = [...prev]
              updated[tempIdx] = m
              return updated
            }
          }

          // 3. Otherwise append new message
          return [...prev, m]
        })
      }

      // Update rooms list: lastMessage, lastMessageAt, and unread count
      const isFromMe = String(m.senderId || '').trim() === String(myUserIdRef.current || '').trim()
      const targetRoomId = String(m.chatRoomId || '').trim()
      const currentActiveRoomId = String(currentRoomIdRef.current || '').trim()

      setRooms(prev => prev.map(r => {
        const roomId = String(r._id || r.id || '').trim()
        if (roomId === targetRoomId) {
          const isCurrentActive = currentActiveRoomId !== '' && roomId === currentActiveRoomId
          const newUnread = (isFromMe || isCurrentActive) ? 0 : ((r.unread || 0) + 1)
          return {
            ...r,
            lastMessage: m.message,
            lastMessageAt: m.createdAt,
            unread: newUnread,
            hasNew: !isFromMe && !isCurrentActive
          }
        }
        return r
      }))

      // Trigger Notification for new incoming message from another user
      if (!isFromMe) {
        const senderLabel = m.senderName || m.senderUsername || 'Someone'
        toast(`💬 New message from ${senderLabel}: "${m.message}"`, 'info')

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`New message from ${senderLabel}`, { body: m.message })
          } catch (e) {}
        }
      }
      return
    }

    if (msg.event === 'notification') {
      const notifData = msg.data
      setNotifications(prev => [notifData, ...prev])
      toast(`🔔 ${notifData.title}: "${notifData.body}"`, 'info')
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notifData.title, { body: notifData.body })
        } catch (e) {}
      }
      return
    }

    if (msg.event === 'typing' && msg.senderId && msg.senderId !== myUserIdRef.current) {
      setTypingUserId(msg.senderId)
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => setTypingUserId(null), 2500)
    }
  }

  // ─── Load Rooms & Notifications ─────────────────────────
  const loadRooms = useCallback(async () => {
    setRoomsLoading(true)
    try {
      const res  = await apiFetch('/chat-rooms/')
      const data = await res.json()
      setRooms(Array.isArray(data) ? data : (data.data || []))

      // Also load initial notifications
      const notifRes = await apiFetch('/notifications/')
      if (notifRes.ok) {
        const notifData = await notifRes.json()
        setNotifications(Array.isArray(notifData) ? notifData : [])
      }
    } catch {
      toast('Could not load rooms — is backend running?', 'error')
    } finally {
      setRoomsLoading(false)
    }
  }, [toast])

  // ─── Select Room ─────────────────────────────────────────────────
  const selectRoom = useCallback(async (room) => {
    const roomId = room._id || room.id

    // Reset unread count for selected room
    setRooms(prev => prev.map(r => (r._id || r.id) === roomId ? { ...r, unread: 0 } : r))

    if (currentRoomIdRef.current === roomId) return

    currentRoomIdRef.current = roomId
    setActiveRoomId(roomId)
    setSelectedRoom(room)
    setMessages([])
    setMsgsLoading(true)
    setTypingUserId(null)

    if (window.innerWidth <= 700) setMobileSidebar(false)

    const uid = myUserIdRef.current
    wsSendRaw({ event: 'join_room', data: { chatRoomId: roomId, userId: uid } })

    const token = ++loadTokenRef.current
    try {
      const res  = await apiFetch(`/messages/room/${roomId}`)
      const data = await res.json()

      if (loadTokenRef.current === token) {
        const msgs = Array.isArray(data) ? data : (data.data || [])
        // Debug: log first message to verify senderId format
        if (msgs.length > 0) {
          console.log('[Messages] First msg senderId:', msgs[0].senderId, '| myUserId:', myUserIdRef.current)
          console.log('[Messages] Match?', String(msgs[0].senderId) === String(myUserIdRef.current))
        }
        setMessages(msgs)
      }
    } catch {
      if (loadTokenRef.current === token) toast('Could not load messages.', 'error')
    } finally {
      if (loadTokenRef.current === token) setMsgsLoading(false)
    }
  }, [toast])

  // ─── Send Message ────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const roomId = currentRoomIdRef.current
    if (!roomId || !text.trim()) return

    const uid = myUserIdRef.current
    const room = await new Promise(resolve => {
      setSelectedRoom(cur => { resolve(cur); return cur })
    })
    const receiverId = room?.createdBy || uid

    const wsOpen = wsRef.current?.readyState === WebSocket.OPEN

    if (wsOpen) {
      // 1. Instant local UI update (Optimistic append)
      const localMsg = {
        _id: 'temp_' + Date.now(),
        chatRoomId: roomId,
        senderId: uid,
        senderName: myUsername || 'You',
        message: text,
        createdAt: new Date().toISOString(),
        status: 'send'
      }
      setMessages(prev => [...prev, localMsg])
      setRooms(prev => prev.map(r =>
        (r._id || r.id) === roomId
          ? { ...r, lastMessage: text, lastMessageAt: localMsg.createdAt }
          : r
      ))

      // 2. Send via WebSocket
      wsSendRaw({
        event: 'send_message',
        data: { chatRoomId: roomId, senderId: uid, receiverId, message: text, messageType: 'text' },
      })
    } else {
      try {
        const res = await apiFetch('/messages/', {
          method: 'POST',
          body: JSON.stringify({ chatRoomId: roomId, receiverId, message: text, messageType: 'text' }),
        })
        if (!res.ok) { toast('Failed to send message.', 'error'); return }
        const m = await res.json()
        if (currentRoomIdRef.current === roomId) {
          setMessages(prev => [...prev, m])
        }
        setRooms(prev => prev.map(r =>
          (r._id || r.id) === roomId
            ? { ...r, lastMessage: text, lastMessageAt: new Date().toISOString() }
            : r
        ))
      } catch { toast('Cannot send message.', 'error') }
    }
  }, [toast])

  // ─── Typing ──────────────────────────────────────────────────────
  const sendTyping = useCallback(() => {
    const rid = currentRoomIdRef.current
    const uid = myUserIdRef.current
    if (!rid || !uid || wsRef.current?.readyState !== WebSocket.OPEN) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      wsSendRaw({ event: 'typing', data: { chatRoomId: rid, senderId: uid } })
    }
    clearTimeout(typingOutTimer.current)
    typingOutTimer.current = setTimeout(() => { isTypingRef.current = false }, 2000)
  }, [])

  // ─── Create Room ─────────────────────────────────────────────────
  const createRoom = useCallback(async ({ name, description, roomType }) => {
    const uid = myUserIdRef.current
    const res = await apiFetch('/chat-rooms/', {
      method: 'POST',
      body: JSON.stringify({ name, description: description || undefined, roomType, createdBy: uid }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Failed')
    const newRoom = data.data || data
    setRooms(prev => [newRoom, ...prev])
    selectRoom(newRoom)
    toast(`Room "${name}" created! 🎉`, 'success')
  }, [selectRoom, toast])

  // ─── Delete Room ─────────────────────────────────────────────────
  const deleteRoom = useCallback(async () => {
    const roomId = currentRoomIdRef.current
    if (!roomId) return
    await apiFetch(`/chat-rooms/${roomId}`, { method: 'DELETE' })
    currentRoomIdRef.current = null
    setActiveRoomId(null)
    setRooms(prev => prev.filter(r => (r._id || r.id) !== roomId))
    setSelectedRoom(null)
    setMessages([])
    toast('Room deleted.', 'info')
  }, [toast])

  // ─── Mark Notification Read ───────────────────────────────
  const handleMarkNotifRead = useCallback(async (notifId) => {
    setNotifications(prev => prev.map(n => (n._id || n.id) === notifId ? { ...n, isRead: true } : n))
    try {
      await apiFetch(`/notifications/${notifId}/read`, { method: 'PATCH' })
    } catch (e) {}
  }, [])

  // ─── Logout ──────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession()
    wsRef.current?.close()
    navigate('/login')
  }, [navigate])

  // ─── Loading screen while resolving user ─────────────────────────
  if (!userReady) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: 16,
        background: 'var(--bg-deep)', color: 'var(--text-sub)'
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ fontSize: 14 }}>Connecting…</span>
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className={styles.app}>
      <Sidebar
        rooms={rooms}
        loading={roomsLoading}
        selectedRoomId={activeRoomId}
        username={myUsername}
        onSelectRoom={selectRoom}
        onCreateRoom={createRoom}
        onRefresh={loadRooms}
        onLogout={logout}
        mobileVisible={mobileSidebar}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />
      <ChatArea
        room={selectedRoom}
        messages={messages}
        loading={msgsLoading}
        userId={myUserId}
        username={myUsername}
        typingUserId={typingUserId}
        onSend={sendMessage}
        onDeleteRoom={deleteRoom}
        onTyping={sendTyping}
        onBack={() => setMobileSidebar(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        notifications={notifications}
        onMarkNotifRead={handleMarkNotifRead}
      />
    </div>
  )
}
