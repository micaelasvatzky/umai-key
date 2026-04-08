---
name: umai-key-data
description: >
  Data persistence layer for UMAI-Key: PostgreSQL for transactions,
  Excel export for backup/reports, multi-app API architecture.
  Trigger: When implementing database models, repositories, or data export.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Setting up PostgreSQL database schema
- Creating repository implementations
- Implementing Excel export functionality
- Designing the multi-app API architecture
- Configuring data backup strategies

## Critical Patterns

### Multi-App Architecture (API Azara Style)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MULTI-APP ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                     ┌─────────────────┐                             │
│                     │    PostgreSQL   │                             │
│                     │    (Single      │                             │
│                     │    Source of    │                             │
│                     │    Truth)       │                             │
│                     └────────┬────────┘                             │
│                              │                                      │
│                     ┌────────▼────────┐                             │
│                     │   API Gateway   │                             │
│                     │  (Express/Nest) │                             │
│                     └────────┬────────┘                             │
│                              │                                      │
│          ┌───────────────────┼───────────────────┐                  │
│          │                   │                   │                  │
│  ┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐            │
│  │  Security     │  │   Admin      │  │   Future      │            │
│  │  App          │  │   App        │  │   Apps        │            │
│  │  (Port 3000)  │  │  (Port 3002) │  │               │            │
│  └───────────────┘  └───────────────┘  └───────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Principle**: New app = new frontend that consumes the SAME API. No duplicate business logic.

### Database Schema

```sql
-- Core Tables

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('docente', 'personal_no_docente', 'invitado')),
  email VARCHAR(255),                    -- Only for Docentes
  legajo VARCHAR(50),                    -- Pending confirmation
  dni VARCHAR(20),                       -- Personal No Docente and Guests
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  padrino_id UUID REFERENCES users(id),  -- Only for Invitados
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sector_id UUID REFERENCES sectors(id),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'taken', 'maintenance')),
  held_by_user_id UUID REFERENCES users(id),
  withdrawn_at TIMESTAMP,
  expected_return_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  building VARCHAR(100),
  floor INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  key_id UUID REFERENCES keys(id) NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('withdraw', 'return')),
  qr_token_id UUID REFERENCES qr_tokens(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE qr_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  key_id UUID REFERENCES keys(id) NOT NULL,
  action VARCHAR(20) NOT NULL,
  nonce VARCHAR(32) NOT NULL UNIQUE,
  signature VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  refresh_token_hash VARCHAR(64),
  device_info JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_movements_user_id ON movements(user_id);
CREATE INDEX idx_movements_key_id ON movements(key_id);
CREATE INDEX idx_movements_created_at ON movements(created_at);
CREATE INDEX idx_keys_status ON keys(status);
CREATE INDEX idx_keys_held_by ON keys(held_by_user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_qr_tokens_nonce ON qr_tokens(nonce);
```

## Repository Pattern Implementation

### TypeScript Interfaces (Domain)

```typescript
// src/features/key-management/domain/repositories/IKeyRepository.ts
interface IKeyRepository {
  findById(id: string): Promise<Key | null>;
  findAll(filters?: KeyFilters): Promise<Key[]>;
  findAvailable(): Promise<Key[]>;
  findHeldByUser(userId: string): Promise<Key[]>;
  
  create(key: Key): Promise<Key>;
  update(id: string, data: Partial<Key>): Promise<Key>;
  withdraw(keyId: string, userId: string, expectedReturn: Date): Promise<Key>;
  return(keyId: string): Promise<Key>;
  
  // For dashboard
  findCurrentStatus(): Promise<KeyStatus[]>;
  findOverdue(): Promise<Key[]>;
}
```

### PostgreSQL Implementation (Infrastructure)

```typescript
// src/features/key-management/infrastructure/repositories/PostgresKeyRepository.ts
export class PostgresKeyRepository implements IKeyRepository {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<Key | null> {
    const result = await this.db.query(
      'SELECT * FROM keys WHERE id = $1',
      [id]
    );
    return result.rows[0] ?? null;
  }
  
  async withdraw(keyId: string, userId: string, expectedReturn: Date): Promise<Key> {
    const result = await this.db.transaction(async (tx) => {
      // Check key is available
      const key = await tx.query(
        'SELECT * FROM keys WHERE id = $1 FOR UPDATE',
        [keyId]
      );
      
      if (key.rows[0].status !== 'available') {
        throw new KeyNotAvailableError(keyId);
      }
      
      // Update key
      const updated = await tx.query(
        `UPDATE keys 
         SET status = 'taken', 
             held_by_user_id = $2, 
             withdrawn_at = NOW(),
             expected_return_at = $3,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [keyId, userId, expectedReturn]
      );
      
      return updated.rows[0];
    });
    
    return result;
  }
  
  async findCurrentStatus(): Promise<KeyStatus[]> {
    const result = await this.db.query(`
      SELECT 
        k.id, k.name, k.status, k.withdrawn_at, k.expected_return_at,
        u.id as user_id, u.first_name, u.last_name, u.type as user_type,
        s.name as sector_name
      FROM keys k
      LEFT JOIN users u ON k.held_by_user_id = u.id
      LEFT JOIN sectors s ON k.sector_id = s.id
      ORDER BY k.name
    `);
    
    return result.rows;
  }
}
```

## Excel Export

### Export Service

```typescript
// src/shared/infrastructure/services/ExcelExportService.ts
import ExcelJS from 'exceljs';

export class ExcelExportService {
  async exportMovements(filters: MovementFilters): Promise<Buffer> {
    const movements = await this.movementRepository.findAll(filters);
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Movimientos');
    
    // Headers
    sheet.columns = [
      { header: 'Fecha', key: 'createdAt', width: 20 },
      { header: 'Usuario', key: 'userName', width: 30 },
      { header: 'Tipo Usuario', key: 'userType', width: 15 },
      { header: 'Llave', key: 'keyName', width: 30 },
      { header: 'Sector', key: 'sectorName', width: 20 },
      { header: 'Acción', key: 'action', width: 15 },
      { header: 'IP', key: 'ipAddress', width: 15 },
    ];
    
    // Style headers
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };
    
    // Data rows
    for (const movement of movements) {
      sheet.addRow({
        createdAt: movement.createdAt.toLocaleString('es-AR'),
        userName: `${movement.user.firstName} ${movement.user.lastName}`,
        userType: this.translateUserType(movement.user.type),
        keyName: movement.key.name,
        sectorName: movement.key.sector?.name ?? '-',
        action: movement.action === 'withdraw' ? 'Retiro' : 'Devolución',
        ipAddress: movement.ipAddress,
      });
    }
    
    // Auto-filter
    sheet.autoFilter = {
      from: 'A1',
      to: `G${movements.length + 1}`,
    };
    
    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }
  
  private translateUserType(type: string): string {
    const translations = {
      docente: 'Docente',
      personal_no_docente: 'Personal No Docente',
      invitado: 'Invitado',
    };
    return translations[type] ?? type;
  }
}
```

### Export API Endpoint

```typescript
// src/features/audit/presentation/controllers/ExportController.ts
router.get('/api/v1/movements/export', async (req, res) => {
  const filters = {
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    userId: req.query.userId as string,
    keyId: req.query.keyId as string,
    action: req.query.action as 'withdraw' | 'return',
  };
  
  const buffer = await exportService.exportMovements(filters);
  
  res.setHeader('Content-Type', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="movimientos_${new Date().toISOString().split('T')[0]}.xlsx"`
  );
  
  res.send(buffer);
});
```

## Data Archival Strategy

### Automatic Archival (Logs > 6 months)

```typescript
// src/features/audit/application/services/ArchivalService.ts
@Cron('0 3 * * *') // Daily at 3 AM
async archiveOldMovements(): Promise<void> {
  const cutoffDate = subMonths(new Date(), 6);
  
  // 1. Export to Excel
  const buffer = await this.exportService.exportMovements({
    endDate: cutoffDate.toISOString(),
  });
  
  // 2. Save Excel to storage
  await this.storageService.saveArchive(
    `movimientos_${format(cutoffDate, 'yyyy-MM')}.xlsx`,
    buffer
  );
  
  // 3. Delete from PostgreSQL
  const deleted = await this.movementRepository.deleteOlderThan(cutoffDate);
  
  // 4. Log archival
  this.logger.info(`Archived ${deleted} movements older than ${cutoffDate}`);
}
```

## Environment Configuration

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/umai_key
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis (for sessions and pub/sub)
REDIS_URL=redis://localhost:6379

# Excel Export
EXCEL_EXPORT_PATH=./exports
EXCEL_ARCHIVE_RETENTION_MONTHS=6

# Storage (for Excel archives)
STORAGE_TYPE=local  # or 's3' for cloud
STORAGE_PATH=./archives
```

## Commands

```bash
# Run migrations
npm run db:migrate

# Create migration
npm run db:migration:create -- --name add_user_indexes

# Seed test data
npm run db:seed

# Export movements to Excel
npm run export:movements -- --start 2024-01-01 --end 2024-12-31

# Archive old data
npm run data:archive

# Check DB connection
npm run db:check
```

## Resources

- **ORM/Query Builder**: Prisma or Knex.js (choose based on team preference)
- **Excel Library**: `exceljs` for reading/writing Excel files
- **Storage**: `aws-sdk` for S3 (optional), or local filesystem
