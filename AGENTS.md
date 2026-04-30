# AGENTS.md — Proyecto UMAI-Key

> **Sistema de Préstamo de Llaves Universitarias con Dashboard en Tiempo Real**
> 
> Universidad: Universidad Maimónides

---

## 1. CONTEXTO DEL PROYECTO (ACTUAL - 2026-04-30)

### Estado Actual
- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v3
- **App completa funcionando** en `src/App.tsx`
- **Firebase Firestore implementado y CONECTADO** en `src/firebase.ts` (sincronización en tiempo real activa)

### Visión General

**UMAI-Key** es una solución que reemplaza el proceso manual de firma física para retiro de llaves universitarias por:
1. **App Web** con formulario para docentes
2. **Dashboard** para que Seguridad vea el estado en tiempo real
3. **Firebase Firestore** para sincronización en tiempo real

### Flujo Actualizado (2026-04-30)
```
Docente solicita → Guarda en Firebase (estado: 'pendiente') → Token generado
        ↓
Seguridad valida Token → Actualiza Firebase (estado: 'retirada', guarda fechaRetiro)
        ↓
Seguridad marca "Devolver" → Mueve registro de 'solicitudes' a 'historial' en Firebase
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
| **Docente** | Solicita retiro de llave | Formulario web → genera token → espera validación |
| **Seguridad** | Gestiona llaves prestadas | Dashboard con login → valida tokens → marca devoluciones |

---

## 3. CÓDIGO ACTUAL (src/App.tsx y src/firebase.ts)

### Firebase Helpers (`src/firebase.ts`)
- **`guardarSolicitud(data)`**: Guarda en Firestore (colección `solicitudes`) con estado `pendiente`.
- **`validarTokenEnFirebase(token, idGuardia)`**: Busca token `pendiente` y actualiza a `retirada` (guarda `fechaRetiro`).
- **`marcarDevolucion(id, idGuardia)`**: **Mueve** el registro de `solicitudes` a `historial` en Firebase.
- **`subscribeRegistros(callback)`**: Escucha cambios en tiempo real de `solicitudes`.
- **`subscribeHistorial(callback)`**: Escucha cambios en tiempo real de `historial`.

### Tipo Registro (Actualizado)
```typescript
interface Registro {
  id?: string
  timestamp: string
  nombre: string
  email: string
  tipo: string
  motivo: string
  area: string
  mailAuditor: string
  numeroAula: string
  estado: 'pendiente' | 'retirada' | 'devuelta'
  token?: string
  idGuardia?: string
  fechaRetiro?: string    // Momento en que se validó el token
  fechaDevolucion?: string // Momento en que se marcó como devuelta
}
```

### Dashboard Seguridad (`src/App.tsx`)
1. **Pestañas (Tabs):**
   - **Activos:** Validar Token + Tabla de llaves retiradas.
   - **Historial:** Tabla de devoluciones (colección `historial` de Firebase).
   - **Panel Completo:** Grilla de Cards coloreadas según estado:
     - 🔴 Rojo: Retiradas (en uso).
     - 🟢 Verde: Listas para retirar (Token validado).
     - 🟡 Amarillo: Pendientes de token (recién solicitadas).

2. **Modal de Devolución:** Reemplaza el `confirm()` feo por un modal elegante dentro de la app.

3. **Mensaje de Token:** Aparece "Token validado!" y desaparece solo a los 3 segundos.

### Constantes Importantes
```typescript
const CONTRASENA_GUARDIA = 'seguridad2024'

const AULAS = [
  '101', '102', '103', '201', '202', '203', '301', '302', '303',
  'Laboratorio Quimica', 'Laboratorio Fisica', 'Laboratorio Computacion',
  'Biblioteca', 'Sala de Reuniones', 'Direccion'
]
```

---

## 4. FIREBASE CONFIGURATION

### Configuración Actual
```typescript
const firebaseConfig = {
  apiKey: 'AIzaSyDOOqkroPWlP_TAQB_qpC4Qs4hEKALz33U',
  authDomain: 'umai-key.firebaseapp.com',
  projectId: 'umai-key',
  storageBucket: 'umai-key.firebasestorage.app',
  messagingSenderId: '263059590633',
  appId: '1:263059590633:web:c1e9ae13c490ceabae0f78'
}
```

### Reglas de Firestore (Para testing)
En [Firebase Console](https://console.firebase.google.com/project/umai-key/firestore/rules), usar:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // OJO: Solo para testing
    }
  }
}
```
*Nota: Si usaste "Start in test mode", expirará el 23 de Mayo 2026.*

### Colecciones en Firebase
1. **`solicitudes`**: Contiene registros con estado `pendiente` o `retirada`.
2. **`historial`**: Contiene registros movidos con estado `devuelta`.

---

## 5. CÓMO PROBAR EL FLUJO

1. **Correr el server:** `npm run dev -- --port 5173` (en tu consola).
2. **Docente:** `http://localhost:5173/` → "Soy Docente" → Llenar formulario → "Enviar Solicitud" → Copiar **Token**.
3. **Seguridad:** "Soy Seguridad" → Login (`seguridad2024`) → Pegar Token en "Validar Token" → Apreta "Validar".
4. **Devolver:** En la tabla "Activos", apretar "Devolver" → Confirmar en el **Modal** → La llave desaparece de Activos y aparece en "Historial".

---

## 6. DECISIONES DE DISEÑO

### Email institucional
- **Dominios válidos:** `@maimonides.edu.ar`, `@maimonidesvirtual.com.ar`
- **Validación:** En cliente (formulario)

### Dashboard
- **Dark mode:** Soportado (guardado en localStorage)
- **Sin emojis en UI:** Estilo Sentinel Core
- **Pestañas:** Organización de Activos, Historial y Panel Completo.

---

## 7. HISTORIAL DE CAMBIOS

| Fecha | Cambio |
|-------|--------|
| 2026-04-15 | Initial commit con estructura básica |
| 2026-04-15 | Dashboard con UI Sentinel Core |
| 2026-04-23 | Login flow, token validation, Firebase glossary |
| 2026-04-23 | Firebase Firestore completado y connected |
| 2026-04-23 | Build errors TypeScript fixed |
| 2026-04-30 | **Flujo de Token corregido:** Pendiente → Retirada → Historial |
| 2026-04-30 | **Modal de Devolución** (reemplaza confirm()) |
| 2026-04-30 | **Pestañas (Tabs):** Activos, Historial, Panel Completo |
| 2026-04-30 | **Panel Completo:** Cards coloreadas según estado (Rojo/Verde/Amarillo) |

---

*Documento actualizado: 2026-04-30*
*Último trabajo: Estructura de Tabs, Panel Completo con colores, Modal de devolución, Flujo Firebase corregido*
