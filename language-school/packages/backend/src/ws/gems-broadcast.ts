/** Per-user WebSocket connections for real-time gems balance updates */
export const gemsConnections = new Map<string, Set<any>>()

export function pushGemsBalance(userId: string, balance: number) {
  const sockets = gemsConnections.get(userId)
  if (!sockets?.size) return
  const msg = JSON.stringify({ type: 'balance_update', balance })
  sockets.forEach(ws => {
    try { ws.send(msg) } catch (_) {}
  })
}
