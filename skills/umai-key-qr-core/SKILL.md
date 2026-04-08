---
name: umai-key-qr-core
description: >
  QR code generation, scanning, and secure validation for UMAI-Key. 
  Handles token signing, expiry, and server-side verification.
  Trigger: When implementing QR generation, validation, or scanning features.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Generating QR codes for key withdrawal/return
- Implementing QR scanning in the Security App
- Validating QR tokens server-side
- Handling QR expiry and token rotation
- Managing edge cases (low light, reflections, damaged QR)

## Critical Patterns

### QR Token Structure

The QR contains a **signed payload** that must be validated server-side:

```
┌─────────────────────────────────────────────────────────────┐
│                      QR PAYLOAD (Base64)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  {                                                           │
│    "userId": "uuid",                                         │
│    "keyId": "uuid",                                          │
│    "action": "withdraw" | "return",                         │
│    "timestamp": 1234567890,      // Unix timestamp (ms)     │
│    "nonce": "random-16-chars",   // Prevent replay attacks  │
│    "signature": "hmac-sha256(...)"                           │
│  }                                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │   QR Code Image  │
                   │   (256x256 min)  │
                   └──────────────────┘
```

### Token Generation Flow

```typescript
// src/features/qr-core/application/services/QRTokenService.ts
interface QRTokenPayload {
  userId: string;
  keyId: string;
  action: 'withdraw' | 'return';
  timestamp: number;
  nonce: string;
}

interface QRTokenService {
  generateToken(payload: Omit<QRTokenPayload, 'timestamp' | 'nonce' | 'signature'>): string;
  // Returns Base64 encoded QR content + signature
  
  signPayload(payload: QRTokenPayload): string;
  // HMAC-SHA256(userId + keyId + action + timestamp + nonce, secret)
  
  generateQRImage(token: string): Promise<Buffer>;
  // Returns PNG buffer for qrcode library
}
```

### Token Validation Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                      QR VALIDATION PIPELINE                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. DECODE QR                                                      │
│     └─ Base64 decode → extract JSON payload                        │
│                                                                     │
│  2. CHECK TIMESTAMP                                                │
│     └─ Now - timestamp < 5 minutes? → FAIL if expired              │
│                                                                     │
│  3. VERIFY SIGNATURE                                               │
│     └─ Recompute HMAC-SHA256 with server secret                     │
│     └─ Compare with payload.signature → FAIL if mismatch           │
│                                                                     │
│  4. CHECK NONCE (Replay Protection)                               │
│     └─ Is nonce in recent-used list? → FAIL if replay detected    │
│     └─ Add nonce to recent-used (TTL: 10 minutes)                 │
│                                                                     │
│  5. CHECK USER                                                     │
│     └─ Does user exist and is active? → FAIL if not                │
│     └─ Has user permission for this action?                        │
│                                                                     │
│  6. CHECK KEY                                                      │
│     └─ Does key exist?                                             │
│     └─ For withdraw: is key available? → FAIL if already taken   │
│     └─ For return: is key currently held by user? → FAIL if not   │
│                                                                     │
│  7. RECORD MOVEMENT                                                │
│     └─ Create Movement entity in database                          │
│     └─ Broadcast via WebSocket                                     │
│                                                                     │
│  8. RETURN RESULT                                                  │
│     └─ { valid: true, user: {...}, key: {...} }                   │
│     └─ { valid: false, reason: "KEY_NOT_AVAILABLE" }              │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Token Expiry** | 5 minutes max from generation |
| **Signature** | HMAC-SHA256 with server secret (env: `QR_SECRET`) |
| **Replay Protection** | Nonce stored in Redis with 10-min TTL |
| **Server-Side Validation** | NEVER trust QR content alone |
| **Rate Limiting** | Max 5 validations per user per minute |

## Domain Entities

### QRToken Entity

```typescript
// src/features/qr-core/domain/entities/QRToken.ts
interface QRToken {
  id: string;
  payload: QRTokenPayload;
  expiresAt: Date;
  usedAt?: Date;           // Null if not used yet
  usedBy?: string;         // User ID who scanned it
  isValid: boolean;        // False if expired or invalidated
  createdAt: Date;
}

interface QRTokenPayload {
  userId: string;
  keyId: string;
  action: 'withdraw' | 'return';
  timestamp: number;
  nonce: string;
  signature: string;
}
```

### Validation Result Value Object

```typescript
// src/features/qr-core/domain/value-objects/ValidationResult.ts
interface ValidationResult {
  isValid: boolean;
  error?: ValidationError;
  user?: User;
  key?: Key;
  movement?: Movement;
}

type ValidationError = 
  | 'TOKEN_EXPIRED'
  | 'INVALID_SIGNATURE'
  | 'REPLAY_DETECTED'
  | 'USER_NOT_FOUND'
  | 'USER_INACTIVE'
  | 'KEY_NOT_FOUND'
  | 'KEY_NOT_AVAILABLE'
  | 'KEY_NOT_HELD_BY_USER'
  | 'RATE_LIMITED';
```

## Repository Interfaces

```typescript
// src/features/qr-core/domain/repositories/IQRTokenRepository.ts
interface IQRTokenRepository {
  findById(id: string): Promise<QRToken | null>;
  findValidByUserAndKey(userId: string, keyId: string): Promise<QRToken | null>;
  
  create(token: QRToken): Promise<QRToken>;
  markAsUsed(id: string, usedBy: string): Promise<QRToken>;
  invalidate(id: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

// src/features/qr-core/domain/repositories/INonceRepository.ts
// Uses Redis for fast nonce checking
interface INonceRepository {
  isUsed(nonce: string): Promise<boolean>;
  markAsUsed(nonce: string, ttlSeconds: number): Promise<void>;
  cleanup(): Promise<void>; // Redis handles TTL, but explicit cleanup OK
}
```

## QR Image Requirements

For reliable scanning under varying conditions:

| Property | Value | Rationale |
|----------|-------|-----------|
| **Size** | 256x256 px minimum | Ensures readability |
| **Error Correction** | Level H (30%) | Handles damage/reflections |
| **Margin** | 4 modules | Prevents scan errors |
| **Format** | PNG | Best compatibility |
| **Encoding** | UTF-8 | Supports special characters |

```typescript
// QR Image Generation Config
const QR_CONFIG = {
  width: 256,
  margin: 4,
  errorCorrectionLevel: 'H', // High - 30% recovery
  color: {
    dark: '#000000',    // Black modules
    light: '#FFFFFF',   // White background
  },
};
```

## Scanning UX Requirements

The Security App scanner must:

1. **Fast Detection**: < 500ms to detect QR in frame
2. **Low Light Mode**: Use camera flash/torch if available
3. **Continuous Scanning**: Keep scanning after successful scan
4. **Haptic Feedback**: Vibrate on successful scan
5. **Audio Feedback**: Beep on scan (configurable)
6. **Visual Feedback**: 
   - Green border: Valid
   - Red border: Invalid + error message

## API Endpoints

```
POST   /api/v1/qr/generate          # Generate QR for user
  Body: { userId, keyId, action }
  Response: { qrToken, qrImage: base64, expiresAt }

POST   /api/v1/qr/validate         # Validate scanned QR
  Body: { qrContent }               # Raw QR string
  Response: { valid, user, key, movement } or { valid: false, error }

GET    /api/v1/qr/status/:tokenId  # Check if QR is still valid
  Response: { isValid, expiresAt, usedAt }

DELETE /api/v1/qr/invalidate/:id   # Manually invalidate QR (Admin)
```

## Commands

```bash
# Generate test QR locally
npm run qr:generate-test

# Validate a QR token
npm run qr:validate <token>

# Cleanup expired tokens
npm run qr:cleanup

# Test scanner with webcam
npm run qr:test-scanner
```

## Testing Patterns

```typescript
// src/features/qr-core/__tests__/QRTokenService.test.ts
describe('QRTokenService', () => {
  it('should generate valid signed token', async () => {
    const token = await service.generateToken({
      userId: 'user-123',
      keyId: 'key-456',
      action: 'withdraw',
    });
    
    expect(token).toBeDefined();
    expect(token.signature).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
  });
  
  it('should reject expired tokens', async () => {
    const payload = createExpiredPayload();
    const result = await service.validate(payload);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('TOKEN_EXPIRED');
  });
  
  it('should reject tampered tokens', async () => {
    const payload = createValidPayload();
    payload.userId = 'hacked-user'; // Tamper after signing
    
    const result = await service.validate(payload);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('INVALID_SIGNATURE');
  });
});
```

## Resources

- **Library**: `qrcode` for generation, `html5-qrcode` or `zxing-js/library` for scanning
- **Security**: Always validate server-side, never trust client
- **Performance**: Use Redis for nonce storage, keep validation under 100ms
