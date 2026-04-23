# AGENTS.md — Proyecto UMAI-Key

> **Sistema de Préstamo de Llaves Universitarias con Dashboard en Tiempo Real**
> 
> Universidad: Universidad Maimónides

---

## 1. CONTEXTO DEL PROYECTO (ACTUAL - 2026-04-23)

### Estado Actual
- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v3
- **App completa funcionando** en `src/App.tsx`
- **Firebase Firestore implementado** en `src/firebase.ts` (sincronización en tiempo real activa)

### Visión General

**UMAI-Key** es una solución que reemplaza el proceso manual de firma física para retiro de llaves universitarias por:
1. **App Web** con formulario para docentes
2. **Dashboard** para que Seguridad vea el estado en tiempo real
3. **Firebase Firestore** para sincronización en tiempo real (EN CONSTRUCCIÓN)

### Arquitectura Actual

```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────┐
│  App Web        │      │  Firebase        │      │  Dashboard    │
│  (Docente)      │ ───→ │  Firestore       │ ───→ │  (Seguridad)  │
│  Formulario     │      │  (Tiempo Real)   │      │  Vista       │
└─────────────────┘      └──────────────────┘      └───────────────┘
```

---

## 2. ESTRUCTURA DEL PROYECTO

### Archivos Principales
```
TP1/
├── src/
│   ├── App.tsx           # App principal (TODO el código está aquí)
│   ├── firebase.ts       # Firebase Firestore config y helpers
│   ├── main.tsx          # Entry point
│   └── index.css         # Tailwind
├── package.json          # Dependencias: react, react-dom, vite, tailwindcss, firebase
├── vite.config.ts
├── tailwind.config.js
├── docs/
│   └── GLOSARIO.md      # Términos técnicos (Firebase, etc)
└── index.html
```

### Roles del Sistema

| Rol | Descripción | Interacción |
|-----|-------------|-------------|
| **Docente** | Solicita retiro de llave | Formulario web → genera token |
| **Seguridad** | Gestiona llaves prestadas | Dashboard con login → valida tokens → marca devoluciones |

### Flujo Completo

```
Docente solicita → Token generado → Seguridad valida → Entrega llave
        ↓
Docente devuelve → Seguridad marca "Devuelta" en Dashboard
```

---

## 3. CÓDIGO ACTUAL (src/App.tsx)

### Componentes Principales

1. **PantallaInicio** - Selector de rol (Docente / Seguridad)
2. **FormularioDocente** - Solicita: nombre, email institucional, aula, motivo
3. **LoginSeguridad** - Login con contraseña (FIJA: `seguridad2024`)
4. **DashboardSeguridad** - Vista principal con:
   - Validar token手动
   - Lista de llaves retiradas
   - Historial del día
   - Botón "Devolver"

### Constantes Importantes

```typescript
const CONTRASENA_GUARDIA = 'seguridad2024'

const AULAS = [
  '101', '102', '103', '201', '202', '203', '301', '302', '303',
  'Laboratorio Quimica', 'Laboratorio Fisica', 'Laboratorio Computacion',
  'Biblioteca', 'Sala de Reuniones', 'Direccion'
]
```

### Datos Mock (MOCK_DATA)

Ya no se usa — datos ahora vienen de Firebase Firestore.

---

## 4. FIREBASE INTEGRATION (IMPLEMENTADO)

### Configuración Actual

```typescript
// src/firebase.ts - Configuración activa
const firebaseConfig = {
  apiKey: 'AIzaSyDOOqkroPWlP_TAQB_qpC4Qs4hEKALz33U',
  authDomain: 'umai-key.firebaseapp.com',
  projectId: 'umai-key',
  storageBucket: 'umai-key.firebasestorage.app',
  messagingSenderId: '263059590633',
  appId: '1:263059590633:web:c1e9ae13c490ceabae0f78'
}
```

### Helpers Implementados

1. **`guardarSolicitud(data)`** - Guarda en Firestore, genera token automáticamente
2. **`subscribeRegistros(callback)`** - Escucha cambios en tiempo real (onSnapshot)
3. **`marcarDevolucion(id, idGuardia)`** - Actualiza estado a 'devuelta'

### Tipo Registro

```typescript
interface Registro {
  id?: string           // Firebase doc ID
  timestamp: string
  nombre: string
  email: string
  tipo: string
  motivo: string
  area: string
  mailAuditor: string
  numeroAula: string
  estado: 'retirada' | 'devuelta'
  token?: string
  idGuardia?: string
}
```

### Estado: COMPLETADO ✅

- [x] Firebase SDK instalado
- [x] Configuración en firebase.ts
- [x] FormularioDocente guarda en Firestore
- [x] DashboardSeguridad escucha Firestore en tiempo real
- [ ] Probar flujo completo (pendiente)

---

## 5. DECISIONES DE DISEÑO

### Email institucional
- **Dominios válidos:** `@maimonides.edu.ar`, `@maimonidesvirtual.com.ar`
- **Validación:** En cliente (formulario)

### Dashboard
- **Dark mode:** Soportado (guardado en localStorage)
- **Sin emojis en UI:** Estilo Sentinel Core

---

## 6. HISTORIAL DE CAMBIOS

| Fecha | Cambio |
|-------|--------|
| 2026-04-15 | Initial commit con estructura básica |
| 2026-04-15 | Dashboard con UI Sentinel Core |
| 2026-04-23 | Login flow, token validation, Firebase glossary |
| 2026-04-23 | Firebase Firestore completado y connected |
| 2026-04-23 | Build errors TypeScript fixed |

---

*Documento actualizado: 2026-04-23*
*Último trabajo: Arreglado build errors, Firebase integrado*
