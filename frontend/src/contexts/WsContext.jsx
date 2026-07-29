import { createContext, useContext, useRef, useEffect, useCallback } from 'react'
import { WS_BASE, getUserId } from '../lib/api'

const WsContext = createContext(null)

export function WsProvider({ children, onEvent }) {
  const wsRef       = useRef(null)
  const reconnectRef = useRef(null)
  const onEventRef  = useRef(onEvent)
  onEventRef.current = onEvent

  const connect = useCallback(() => {
    const uid = getUserId()
    if (!uid) return
    if (wsRef.current && wsRef.current.readyState < 2) wsRef.current.close()

    const socket = new WebSocket(`${WS_BASE}/ws/${uid}`)
    wsRef.current = socket

    socket.onopen = () => {
      console.log('[WS] Connected')
    }

    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        onEventRef.current?.(msg)
      } catch { /* ignore */ }
    }

    socket.onclose = () => {
      console.log('[WS] Closed — reconnecting in 3s')
      reconnectRef.current = setTimeout(connect, 3000)
    }

    socket.onerror = (e) => console.error('[WS] error', e)
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  const joinRoom = useCallback((roomId) => {
    send({ event: 'join_room', data: { chatRoomId: roomId, userId: getUserId() } })
  }, [send])

  const sendMessage = useCallback((data) => {
    send({ event: 'send_message', data })
  }, [send])

  const sendTyping = useCallback((roomId) => {
    send({ event: 'typing', data: { chatRoomId: roomId, senderId: getUserId() } })
  }, [send])

  return (
    <WsContext.Provider value={{ joinRoom, sendMessage, sendTyping, isReady: () => wsRef.current?.readyState === WebSocket.OPEN }}>
      {children}
    </WsContext.Provider>
  )
}

export const useWs = () => useContext(WsContext)
