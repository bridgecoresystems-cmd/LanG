/** Shared WebSocket clients for contact-messages real-time updates */
export const adminClients = new Set<{ send: (data: string) => void }>()
export const publicClients = new Set<{ send: (data: string) => void }>()

export function broadcastToAdmin(data: object) {
  const msg = JSON.stringify(data)
  adminClients.forEach((ws) => {
    try { ws.send(msg) } catch (_) {}
  })
}

export function broadcastToPublic(data: object) {
  const msg = JSON.stringify(data)
  publicClients.forEach((ws) => {
    try { ws.send(msg) } catch (_) {}
  })
}
