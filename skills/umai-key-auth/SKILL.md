---
name: umai-key-auth
description: >
  Authentication system for UMAI-Key: institutional login (Docentes), Guest access with Padrino, 
  and session management. Trigger: When implementing login, authentication, or session cleanup.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Implementing user login/logout flows
- Setting up Google OAuth for institutional accounts
- Creating Guest access with Padrino linking
- Implementing session management and cleanup
- Handling user identification for Docentes, Personal No Docente, and Invitados

## Critical Patterns

### User Types & Identification

| User Type | Email | Legajo | Identification Method |
|-----------|-------|--------|----------------------|
| **Docente** | ✅ `@maimonidesVirtual` or `@maimonides.edu` | ❓ Pending | Legajo or email |
| **Personal No Docente** | ❌ None | ❓ Pending | DNI, legajo, or internal code |
| **Invitado** | ❌ None | ❌ None | Requires Padrino |

> ⚠️ **PENDING**: Confirm if Docentes and Personal No Docente have legajo numbers. This affects identification strategy.

### Authentication Flows

```
┌─────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOWS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DOCENTE                                                         │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐          │
│  │ Email    │───→│ Google OAuth │───→│ Validate @    │          │
│  │ @maimon* │    │ or Custom    │    │ maimonides    │          │
│  └──────────┘    └──────────────┘    └───────────────┘          │
│                                                                  │
│  PERSONAL NO DOCENTE                                            │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐          │
│  │ DNI/    │───→│ Internal     │───→│ Validate     │          │
│  │ Legajo  │    │ Auth API     │    │ against DB   │          │
│  └──────────┘    └──────────────┘    └───────────────┘          │
│                                                                  │
│  INVITADO (GUEST)                                               │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐          │
│  │ Email    │───→│ Padrino      │───→│ Link Guest   │          │
│  │ Padrino  │    │ Approval     │    │ to Padrino   │          │
│  └──────────┘    └──────────────┘    └───────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Passwordless Authentication (Preferred)

For Personal No Docente without institutional email:

```typescript
// Passwordless flow: user enters DNI/Legajo, receives temporary code
interface PasswordlessAuthRequest {
  identifier: string; // DNI or Legajo
  authType: 'docente' | 'personal_no_docente' | 'guest';
}

interface PasswordlessAuthResponse {
  code: string;        // Temporary 6-digit code
  expiresAt: Date;    // Code expires in 5 minutes
  channel: 'email' | 'sms' | 'whatsapp'; // How code was sent
}
```

### Padrino/Guest Linking

```typescript
// Guest requests access linked to a Padrino
interface GuestLinkRequest {
  guestEmail: string;
  padrinoEmail: string; // Must be a registered user
  purpose: string;     // Reason for access
}

interface GuestLinkApproval {
  padrinoEmail: string;
  guestId: string;
  approved: boolean;
  approvalTimestamp?: Date;
}
```

## Domain Entities

### User Entity

```typescript
// src/features/auth/domain/entities/User.ts
interface User {
  id: string;                    // UUID
  type: UserType;                // 'docente' | 'personal_no_docente' | 'invitado'
  
  // Identification (varies by type)
  email?: string;                // Only for Docentes
  legajo?: string;               // Docentes y Personal No Docente (PENDING)
  dni?: string;                  // Personal No Docente or Guests
  
  // Relationships
  padrinoId?: string;            // Only for Invitados
  
  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type UserType = 'docente' | 'personal_no_docente' | 'invitado';
```

### Session Entity

```typescript
// src/features/auth/domain/entities/Session.ts
interface Session {
  id: string;
  userId: string;
  token: string;                 // JWT
  refreshToken?: string;
  expiresAt: Date;
  createdAt: Date;
  deviceInfo?: DeviceInfo;
}

interface DeviceInfo {
  userAgent: string;
  ip: string;
  location?: string;
}
```

## Repository Interfaces

```typescript
// src/features/auth/domain/repositories/IUserRepository.ts
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByLegajo(legajo: string): Promise<User | null>;
  findByDni(dni: string): Promise<User | null>;
  findPadrinoByEmail(email: string): Promise<User | null>;
  
  create(user: User): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  deactivate(id: string): Promise<void>;
}

// src/features/auth/domain/repositories/ISessionRepository.ts
interface ISessionRepository {
  findByToken(token: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  
  create(session: Session): Promise<Session>;
  invalidate(token: string): Promise<void>;
  invalidateAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>; // Returns count of deleted sessions
}
```

## Use Cases

### Login Use Cases

```typescript
// src/features/auth/application/usecases/DocenteLoginUseCase.ts
class DocenteLoginUseCase {
  execute(input: { email: string; token: string }): Promise<AuthResult>;
  // Validates Google OAuth token, checks email domain,
  // creates session if valid
}

// src/features/auth/application/usecases/PersonalNoDocenteLoginUseCase.ts
class PersonalNoDocenteLoginUseCase {
  execute(input: { identifier: string; code: string }): Promise<AuthResult>;
  // Validates temp code sent to registered identifier
}

// src/features/auth/application/usecases/GuestRequestAccessUseCase.ts
class GuestRequestAccessUseCase {
  execute(input: { dni: string; padrinoEmail: string; purpose: string }): Promise<GuestAccessRequest>;
  // Creates pending request, notifies Padrino
}

// src/features/auth/application/usecases/PadrinoApproveGuestUseCase.ts
class PadrinoApproveGuestUseCase {
  execute(input: { padrinoId: string; guestId: string; approved: boolean }): Promise<void>;
  // Approves or rejects guest access request
}
```

### Session Management Use Cases

```typescript
// src/features/auth/application/usecases/RefreshSessionUseCase.ts
// src/features/auth/application/usecases/LogoutUseCase.ts
// src/features/auth/application/usecases/CleanupExpiredSessionsUseCase.ts
//   - Cron job: runs daily at 2 AM
//   - Deletes sessions where expiresAt < now
//   - Logs cleanup count
```

## API Endpoints

```
POST   /api/v1/auth/docente/login        # Login with institutional email
POST   /api/v1/auth/docente/verify       # Verify Google OAuth token

POST   /api/v1/auth/personal/login       # Login with DNI/Legajo + code
POST   /api/v1/auth/personal/code        # Request temp code

POST   /api/v1/auth/guest/request        # Request access (with Padrino email)
POST   /api/v1/auth/guest/approve        # Padrino approves guest
GET    /api/v1/auth/guest/status/:id     # Check guest request status

GET    /api/v1/auth/session/validate     # Validate current session
POST   /api/v1/auth/session/refresh      # Refresh JWT
DELETE /api/v1/auth/session/logout      # Invalidate session
```

## Security Rules

1. **Email Domain Validation**: Docentes must have `@maimonidesVirtual` or `@maimonides.edu`
2. **Rate Limiting**: Max 5 login attempts per minute per IP
3. **Temp Code Expiry**: Codes expire in 5 minutes
4. **Session Duration**: JWT expires in 8 hours (configurable)
5. **Padrino Accountability**: Padrino is responsible for Guest actions
6. **No Sensitive Data in JWT**: Don't store email/DNI in token payload

## Commands

```bash
# Run session cleanup manually
npm run auth:cleanup-sessions

# Seed test users
npm run db:seed:users

# Test OAuth flow locally
npm run auth:test-google-oauth
```

## Resources

- **Templates**: See [assets/](assets/) for DTO schemas
- **Documentation**: See [references/](references/) for API docs
