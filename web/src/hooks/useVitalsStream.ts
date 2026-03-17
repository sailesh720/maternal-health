import { useEffect, useRef, useState, useCallback } from 'react'
import type { WsVitalsUpdate } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/vitals'

export function useVitalsStream() {
  const ws = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<WsVitalsUpdate | null>(null)
  // Map of patient_id -> latest vitals update
  const [liveVitals, setLiveVitals] = useState<Record<string, WsVitalsUpdate>>({})

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    const socket = new WebSocket(WS_URL)

    socket.onopen = () => {
      setConnected(true)
      // Keep-alive ping
      const ping = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        } else {
          clearInterval(ping)
        }
      }, 30000)
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsVitalsUpdate
        if (data.type === 'vitals_update') {
          setLastUpdate(data)
          setLiveVitals((prev) => ({
            ...prev,
            [data.patient_id]: data,
          }))
        }
      } catch {
        // ignore parse errors
      }
    }

    socket.onclose = () => {
      setConnected(false)
      // Reconnect after 3s
      setTimeout(connect, 3000)
    }

    socket.onerror = () => {
      socket.close()
    }

    ws.current = socket
  }, [])

  useEffect(() => {
    connect()
    return () => {
      ws.current?.close()
    }
  }, [connect])

  return { connected, lastUpdate, liveVitals }
}
