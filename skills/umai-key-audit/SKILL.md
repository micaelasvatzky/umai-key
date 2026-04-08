---
name: umai-key-audit
description: >
  Audit logging and history tracking for UMAI-Key.
  Records all movements, user actions, and system events.
  Trigger: When implementing logging, audit trails, or history features.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Implementing audit logging for all user actions
- Creating movement history views
- Building admin audit trails
- Setting up system event logging
- Implementing compliance requirements

## Critical Patterns

### Audit Event Types

| Category | Events | Data Captured |
|----------|--------|---------------|
| **Authentication** | login, logout, login_failed, session_expired | userId, ip, userAgent, reason |
| **Key Movements** | key_withdrawn, key_returned, key_overdue | userId, keyId, timestamp, qrTokenId |
| **Admin Actions** | key_created, key_updated, key_deleted, user_created | adminId, targetId, changes |
| **System Events** | session_cleanup, data_archive, backup_completed | stats, duration |

### Event Structure

```typescript
// src/features/audit/domain/events/AuditEvent.ts
interface AuditEvent {
  id: string;                    // UUID
  eventType: EventType;          // e.g., 'key_withdrawn'
  category: EventCategory;       // 'auth' | 'movement' | 'admin' | 'system'
  
  // Actor (who did it)
  actorId?: string;              // User ID
  actorType?: ActorType;          // 'user' | 'system' | 'admin'
  
  // Target (what was affected)
  targetId?: string;             // Key ID, User ID, etc.
  targetType?: string;           // 'key' | 'user' | 'session'
  
  // Context
  metadata: Record<string, unknown>;  // Additional event-specific data
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  occurredAt: Date;
  createdAt: Date;
}

type EventCategory = 'auth' | 'movement' | 'admin' | 'system';
type ActorType = 'user' | 'system' | 'admin';
```

### Audit Logger Service

```typescript
// src/features/audit/application/services/AuditLogger.ts
export class AuditLogger {
  constructor(
    private eventRepository: IAuditEventRepository,
    private logger: Logger,
  ) {}
  
  // Log a key movement
  async logKeyMovement(
    userId: string,
    keyId: string,
    action: 'withdraw' | 'return',
    context: RequestContext,
  ): Promise<AuditEvent> {
    const event = await this.eventRepository.create({
      eventType: action === 'withdraw' ? 'key_withdrawn' : 'key_returned',
      category: 'movement',
      actorId: userId,
      targetId: keyId,
      metadata: {
        qrTokenId: context.qrTokenId,
      },
      ipAddress: context.ip,
      userAgent: context.userAgent,
      occurredAt: new Date(),
    });
    
    this.logger.info(`Key ${action}: user=${userId}, key=${keyId}`);
    
    return event;
  }
  
  // Log authentication event
  async logAuthEvent(
    eventType: 'login' | 'logout' | 'login_failed',
    data: {
      userId?: string;
      email?: string;
      reason?: string;
    },
    context: RequestContext,
  ): Promise<AuditEvent> {
    const event = await this.eventRepository.create({
      eventType,
      category: 'auth',
      actorId: data.userId,
      metadata: {
        email: data.email,
        reason: data.reason,
      },
      ipAddress: context.ip,
      userAgent: context.userAgent,
      occurredAt: new Date(),
    });
    
    return event;
  }
  
  // Log system event
  async logSystemEvent(
    eventType: string,
    metadata: Record<string, unknown>,
  ): Promise<AuditEvent> {
    return this.eventRepository.create({
      eventType,
      category: 'system',
      actorType: 'system',
      metadata,
      occurredAt: new Date(),
    });
  }
}
```

### Domain Events Integration

Integrate audit logging with domain events for automatic tracking:

```typescript
// src/features/key-management/domain/events/KeyEvents.ts
// Domain event dispatched when a key is withdrawn
class KeyWithdrawnEvent {
  readonly eventType = 'key_withdrawn';
  
  constructor(
    public readonly keyId: string,
    public readonly userId: string,
    public readonly withdrawnAt: Date,
    public readonly expectedReturnAt: Date,
  ) {}
}

// Event handler subscribes to domain event
// and creates audit log automatically
class KeyWithdrawnEventHandler {
  constructor(private auditLogger: AuditLogger) {}
  
  async handle(event: KeyWithdrawnEvent, context: RequestContext): Promise<void> {
    await this.auditLogger.logKeyMovement(
      event.userId,
      event.keyId,
      'withdraw',
      context,
    );
  }
}
```

## Audit Query Patterns

### Query by Date Range

```typescript
interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  category?: EventCategory;
  actorId?: string;
  targetId?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}

// Usage
const events = await auditRepository.findAll({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  category: 'movement',
  limit: 100,
});
```

### Query by User (Full History)

```typescript
async getUserHistory(userId: string): Promise<UserAuditSummary> {
  const events = await this.auditRepository.findByActorId(userId);
  
  return {
    userId,
    totalMovements: events.filter(e => e.category === 'movement').length,
    withdrawals: events.filter(e => e.eventType === 'key_withdrawn').length,
    returns: events.filter(e => e.eventType === 'key_returned').length,
    loginAttempts: events.filter(e => e.category === 'auth').length,
    lastActivity: events[0]?.occurredAt ?? null,
    events: events.slice(0, 20), // Last 20 events
  };
}
```

### Query for Compliance Report

```typescript
async generateComplianceReport(
  startDate: Date,
  endDate: Date,
): Promise<ComplianceReport> {
  const movements = await this.auditRepository.findAll({
    startDate,
    endDate,
    category: 'movement',
  });
  
  const adminActions = await this.auditRepository.findAll({
    startDate,
    endDate,
    category: 'admin',
  });
  
  return {
    period: { start: startDate, end: endDate },
    summary: {
      totalMovements: movements.length,
      totalWithdrawals: movements.filter(m => m.eventType === 'key_withdrawn').length,
      totalReturns: movements.filter(m => m.eventType === 'key_returned').length,
      overdueIncidents: movements.filter(m => m.metadata.overdue).length,
      adminActionsCount: adminActions.length,
    },
    movements,
    adminActions,
    generatedAt: new Date(),
  };
}
```

## Audit Dashboard (Admin View)

### History Table Component

```typescript
// src/features/audit/presentation/components/AuditHistoryTable.tsx
interface AuditHistoryTableProps {
  filters: AuditQuery;
}

export function AuditHistoryTable({ filters }: AuditHistoryTableProps) {
  const { data, isLoading } = useAuditEvents(filters);
  
  return (
    <Table>
      <TableHeader>
        <TableColumn>Fecha/Hora</TableColumn>
        <TableColumn>Usuario</TableColumn>
        <TableColumn>Tipo</TableColumn>
        <TableColumn>Acción</TableColumn>
        <TableColumn>Llave</TableColumn>
        <TableColumn>IP</TableColumn>
      </TableHeader>
      
      <TableBody>
        {data.events.map(event => (
          <TableRow key={event.id}>
            <TableCell>{formatDateTime(event.occurredAt)}</TableCell>
            <TableCell>{event.actor?.name ?? 'Sistema'}</TableCell>
            <TableCell>
              <Badge variant={getCategoryColor(event.category)}>
                {translateCategory(event.category)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={getActionColor(event.eventType)}>
                {translateAction(event.eventType)}
              </Badge>
            </TableCell>
            <TableCell>{event.target?.name ?? '-'}</TableCell>
            <TableCell>{event.ipAddress ?? '-'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Filters Component

```typescript
// src/features/audit/presentation/components/AuditFilters.tsx
export function AuditFilters() {
  const [filters, setFilters] = useState<AuditQuery>({
    startDate: startOfMonth(new Date()),
    endDate: new Date(),
    category: undefined,
  });
  
  return (
    <div className="filters">
      <DateRangePicker
        start={filters.startDate}
        end={filters.endDate}
        onChange={(start, end) => setFilters(f => ({ ...f, startDate: start, endDate: end }))}
      />
      
      <Select
        value={filters.category}
        onChange={(category) => setFilters(f => ({ ...f, category }))}
      >
        <Option value={undefined}>Todas las categorías</Option>
        <Option value="auth">Autenticación</Option>
        <Option value="movement">Movimientos</Option>
        <Option value="admin">Admin</Option>
        <Option value="system">Sistema</Option>
      </Select>
      
      <Input
        placeholder="Buscar por usuario o llave..."
        onChange={(search) => setFilters(f => ({ ...f, search }))}
      />
      
      <Button onClick={() => onApply(filters)}>Aplicar Filtros</Button>
      <Button variant="secondary" onClick={() => onExport(filters)}>
        Exportar a Excel
      </Button>
    </div>
  );
}
```

## Security Considerations

### Data Retention

| Data Type | Retention | Storage |
|-----------|-----------|---------|
| Audit Events | 6 months | PostgreSQL |
| Archived Events | 7 years | Excel/CSV in secure storage |
| Session Logs | 30 days | PostgreSQL |
| Error Logs | 90 days | Log aggregator (optional) |

### PII Handling

- **IP Addresses**: Stored for fraud detection, anonymized after 90 days
- **User Agents**: Stored for debugging, no PII concerns
- **Sensitive Data**: Never logged (passwords, tokens, etc.)

### Access Control

- Only admins can view full audit logs
- Users can view their own history only
- Audit access is itself logged

## API Endpoints

```
GET    /api/v1/audit/events           # List audit events (paginated)
GET    /api/v1/audit/events/:id       # Get single event
GET    /api/v1/audit/user/:userId     # User's activity history
GET    /api/v1/audit/key/:keyId       # Key's movement history
GET    /api/v1/audit/export           # Export audit log to Excel
GET    /api/v1/audit/report           # Generate compliance report
```

## Commands

```bash
# View recent audit events
npm run audit:recent -- --limit 50

# Export audit log
npm run audit:export -- --start 2024-01-01 --end 2024-12-31

# Generate compliance report
npm run audit:report -- --format pdf

# Check audit log integrity
npm run audit:verify
```

## Resources

- **Log Levels**: Use appropriate levels (INFO for actions, WARN for warnings, ERROR for failures)
- **Correlation**: Include request ID in all logs for tracing
- **Compliance**: Consult legal team for retention policies
