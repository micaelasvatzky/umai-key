---
name: umai-key-realtime
description: >
  Real-time WebSocket communication for UMAI-Key Security Dashboard.
  Handles live key status updates, notifications, and presence.
  Trigger: When implementing WebSocket, live dashboard, or real-time notifications.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Implementing the Security Dashboard with live updates
- Setting up WebSocket connections between server and clients
- Broadcasting key withdrawal/return events
- Implementing real-time notifications for overdue keys
- Handling presence (who's viewing the dashboard)

## Critical Patterns

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REAL-TIME ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐         ┌─────────────────┐         ┌───────────┐ │
│   │ Security    │         │                 │         │ Admin     │ │
│   │ Dashboard   │◄──────►│  Socket.io      │◄──────►│ Dashboard │ │
│   │ (Port 3000) │  WS     │  Server         │  WS     │ (3002)    │ │
│   └─────────────┘         │  (Port 3001)    │         └───────────┘ │
│                           │                 │                        │
│                           │  ┌───────────┐  │                        │
│                           │  │ Redis     │  │                        │
│                           │  │ Adapter   │  │                        │
│                           │  │ (Pub/Sub) │  │                        │
│                           │  └───────────┘  │                        │
│                           └─────────────────┘                        │
│                                    │                                  │
│                                    │ Broadcast                        │
│                                    ▼                                  │
│                           ┌─────────────────┐                        │
│                           │ PostgreSQL      │                        │
│                           │ (Movements DB) │                        │
│                           └─────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### WebSocket Events

| Event Name | Direction | Payload | Description |
|------------|-----------|---------|-------------|
| `key:withdrawn` | Server → Client | `{keyId, userId, userName, userType, timestamp}` | New key withdrawal |
| `key:returned` | Server → Client | `{keyId, userId, timestamp}` | Key returned |
| `key:overdue` | Server → Client | `{keyId, userId, overdueMinutes}` | Key past due time |
| `key:status` | Client → Server | `{keyId}` | Request current key status |
| `dashboard:join` | Client → Server | `{userId, role}` | Join dashboard room |
| `dashboard:leave` | Client → Server | `{userId}` | Leave dashboard room |
| `presence:update` | Server → Client | `{viewers: number}` | Dashboard viewers count |
| `error` | Server → Client | `{code, message}` | Error notification |

### Room Structure

```typescript
// Rooms for targeted broadcasts
const ROOMS = {
  SECURITY_DASHBOARD: 'security:dashboard',    // All security staff
  ADMIN_DASHBOARD: 'admin:dashboard',           // All admins
  KEY_ROOM_PREFIX: 'key:',                       // Per-key room: key:uuid
  SECTOR_PREFIX: 'sector:',                      // Per-sector room: sector:uuid
};
```

## Server Implementation

### Socket.io Setup

```typescript
// src/features/security-dashboard/infrastructure/websocket/SocketServer.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

class RealTimeServer {
  private io: Server;
  private pubClient: RedisClient;
  private subClient: RedisClient;
  
  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(','),
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'], // Prefer websocket
      pingTimeout: 10000,
      pingInterval: 5000,
    });
    
    this.setupRedisAdapter();
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Join appropriate rooms based on role
      socket.on('dashboard:join', (data) => this.handleJoin(socket, data));
      socket.on('dashboard:leave', (data) => this.handleLeave(socket));
      
      // Handle disconnection
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }
  
  // Broadcast methods for use cases
  broadcastKeyWithdrawn(data: KeyWithdrawnEvent): void {
    this.io.to(ROOMS.SECURITY_DASHBOARD).emit('key:withdrawn', data);
    this.io.to(`key:${data.keyId}`).emit('key:withdrawn', data);
  }
  
  broadcastKeyReturned(data: KeyReturnedEvent): void {
    this.io.to(ROOMS.SECURITY_DASHBOARD).emit('key:returned', data);
    this.io.to(`key:${data.keyId}`).emit('key:returned', data);
  }
  
  broadcastKeyOverdue(data: KeyOverdueEvent): void {
    this.io.to(ROOMS.SECURITY_DASHBOARD).emit('key:overdue', data);
  }
}
```

### Overdue Key Checker (Cron Job)

```typescript
// src/features/security-dashboard/application/services/OverdueCheckerService.ts
// Runs every minute to check for overdue keys
class OverdueCheckerService {
  @Cron('* * * * *') // Every minute
  async checkOverdueKeys(): Promise<void> {
    const overdueKeys = await this.keyRepository.findOverdue();
    
    for (const key of overdueKeys) {
      const overdueMinutes = Math.floor(
        (Date.now() - key.withdrawnAt.getTime()) / 60000
      );
      
      // Only notify once per key per hour (avoid spam)
      if (key.lastOverdueNotifiedAt &&
          Date.now() - key.lastOverdueNotifiedAt.getTime() < 3600000) {
        continue;
      }
      
      this.socketServer.broadcastKeyOverdue({
        keyId: key.id,
        userId: key.heldByUserId,
        overdueMinutes,
      });
      
      await this.keyRepository.markOverdueNotified(key.id);
    }
  }
}
```

## Client Implementation (React)

### Dashboard Hook

```typescript
// src/apps/web-security/hooks/useSecurityDashboard.ts
interface DashboardState {
  keys: KeyStatus[];
  viewers: number;
  isConnected: boolean;
  error: string | null;
}

export function useSecurityDashboard() {
  const [state, setState] = useState<DashboardState>({
    keys: [],
    viewers: 0,
    isConnected: false,
    error: null,
  });
  
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      setState(s => ({ ...s, isConnected: true }));
      socket.emit('dashboard:join', { userId: currentUserId, role: 'security' });
    });
    
    socket.on('disconnect', () => {
      setState(s => ({ ...s, isConnected: false }));
    });
    
    socket.on('key:withdrawn', (data) => {
      setState(s => ({
        ...s,
        keys: [...s.keys.filter(k => k.id !== data.keyId), {
          id: data.keyId,
          heldBy: data.userName,
          userType: data.userType,
          withdrawnAt: new Date(data.timestamp),
          status: 'taken',
        }],
      }));
    });
    
    socket.on('key:returned', (data) => {
      setState(s => ({
        ...s,
        keys: s.keys.map(k => 
          k.id === data.keyId ? { ...k, status: 'available', returnedAt: new Date() } : k
        ),
      }));
    });
    
    socket.on('key:overdue', (data) => {
      // Show alert/notification
      showOverdueAlert(data);
    });
    
    socket.on('presence:update', (data) => {
      setState(s => ({ ...s, viewers: data.viewers }));
    });
    
    return () => socket.disconnect();
  }, []);
  
  return state;
}
```

### Dashboard Component

```typescript
// src/apps/web-security/presentation/components/KeyStatusBoard.tsx
export function KeyStatusBoard() {
  const { keys, viewers, isConnected } = useSecurityDashboard();
  
  return (
    <div className="dashboard">
      <div className="status-bar">
        <ConnectionIndicator connected={isConnected} />
        <ViewerCount count={viewers} />
      </div>
      
      <div className="keys-grid">
        {keys.map(key => (
          <KeyCard
            key={key.id}
            name={key.name}
            status={key.status}
            heldBy={key.heldBy}
            userType={key.userType}
            withdrawnAt={key.withdrawnAt}
          />
        ))}
      </div>
    </div>
  );
}
```

## Connection Resilience

### Auto-Reconnection Strategy

```typescript
// Reconnection config for production reliability
const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: Infinity,    // Keep trying forever
  reconnectionDelay: 1000,          // Start with 1 second
  reconnectionDelayMax: 30000,       // Cap at 30 seconds
  randomizationFactor: 0.5,         // Add jitter to prevent thundering herd
};
```

### Offline Handling

```typescript
// Queue actions when offline, replay when reconnected
const offlineQueue: SocketEvent[] = [];

socket.on('offline', () => {
  // Show offline indicator
  showOfflineBanner();
});

socket.on('reconnect', () => {
  // Replay queued events
  offlineQueue.forEach(event => socket.emit(event.name, event.data));
  offlineQueue.length = 0;
  hideOfflineBanner();
});
```

## Performance Requirements

| Metric | Target | Why |
|--------|--------|-----|
| **Latency** | < 500ms | Security staff need instant feedback |
| **Throughput** | 1000 events/sec | Handle multiple simultaneous events |
| **Connections** | 100 concurrent | Support multiple dashboard instances |
| **Reconnection** | < 5 seconds | Minimize downtime after network issues |

## Commands

```bash
# Test WebSocket connection
npm run ws:test

# Monitor WebSocket traffic
npm run ws:debug

# Check Redis pub/sub status
npm run redis:psubscribe
```

## Resources

- **Socket.io**: Main WebSocket library
- **Redis Adapter**: For horizontal scaling with multiple server instances
- **Client Library**: `socket.io-client` for React apps
