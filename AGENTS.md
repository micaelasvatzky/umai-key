# AGENTS.md — Proyecto UMAI-Key

> **Sistema de Préstamo de Llaves Universitarias con Dashboard en Tiempo Real**
> 
> Universidad: Universidad Maimónides

---

## 1. CONTEXTO DEL PROYECTO (ACTUAL - 2026-04-23)

### Estado Actual
- **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v3
- **App completa funcionando** en `src/App.tsx`
- **Pendiente:** Conexión Firebase Firestore para sincronización en tiempo real (NO implementada)

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
│   ├── main.tsx          # Entry point
│   └── index.css         # Tailwind
├── package.json          # Dependencias: react, react-dom, vite, tailwindcss
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

4 registros de ejemplo hardcodeados para testing local.

---

## 4. PENDIENTE: FIREBASE INTEGRATION

### Lo que falta implementar

1. **Instalar Firebase SDK:**
   ```bash
   npm install firebase
   ```

2. **Configurar firebase.ts:**
   - Credentials del proyecto Firebase
   - Inicializar app y firestore

3. **Sincronizar datos:**
   - Guardar solicitudes en Firestore (no solo en memoria)
   - Escuchar cambios en tiempo real en Dashboard
   - Reemplazar MOCK_DATA con datos reales

### Estado: NO INICIADO

- [ ] Instalar firebase SDK
- [ ] Crear config/firebase.ts
- [ ] Modificar FormularioDocente para guardar en Firestore
- [ ] Modificar DashboardSeguridad para escuchar Firestore
- [ ] Probar flujo completo

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

---

*Documento actualizado: 2026-04-23*
*Último trabajo: Conexión Firebase (incompleta)*
