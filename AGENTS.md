# AGENTS.md — Proyecto UMAI-Key

> **取代 Firmas Físicas → QR + Dashboard para Préstamo de Llaves Universitarias**
> 
> Universidad: Universidad Maimónides

---

## 1. CONTEXTO DEL PROYECTO

### Visión General

**UMAI-Key** es una solución que reemplaza el proceso manual de firma física para retiro de llaves universitarias por:
1. **QR impresos** en la puerta que linkean a un Google Form
2. **Google Sheets** como base de datos
3. **Dashboard web** para que Seguridad y Directores vean el estado en tiempo real

### Problema Actual
- Proceso lento: firma física en papel
- Sin visibilidad en tiempo real: nadie sabe quién tiene qué llave
- Auditoría manual: difícil rastrear historial
- Sin estadísticas de uso

### Arquitectura MVP (Camino A - Sin Backend Propio)

```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────┐
│  QR IMPRESO     │ ───→ │  Google Form     │ ───→ │  Google       │
│  (en la puerta) │      │  (usuario llena) │      │  Sheets       │
└─────────────────┘      └──────────────────┘      │  (base datos) │
                                                    └───────┬───────┘
                                                            │ consulta
                                                            ▼
                                                    ┌───────────────┐
                                                    │  Dashboard    │
                                                    │  (Seguridad/  │
                                                    │   Directores) │
                                                    └───────────────┘
```

### Roles del Sistema

| Rol | Descripción | Vista en App |
|-----|-------------|--------------|
| **Docente** | Solicita llaves | Historial de sus solicitudes |
| **Director/Coordinador** | Aprueba y audita | Dashboard completo + historial |
| **Personal Limpieza/Mantenimiento** | No tiene mail institucional. Su "Padrino" es la Dirección de Mantenimiento. Se aprueba pero se notifica al área. | Historial de sus solicitudes |
| **Seguridad** | Ve quién tiene qué llave EN ESTE MOMENTO | Dashboard en compu fija en entrada |

### Stakeholders
| Rol | Necesidad |
|-----|-----------|
| **Docente** | Solicitar/devolver llave de forma rápida |
| **Personal Mantenimiento** | Solicitar llave (requiere aprobación + notificación a Dirección) |
| **Seguridad** | Ver en tiempo real quién tiene cada llave |
| **Director/Coordinador** | Auditar movimientos, ver estadísticas |

---

## 2. ENFOQUE MVP (CAMINO A)

> **PRINCIPIO: Empezar simple, escalar después.**

### Stack MVP
- **Base de datos**: Google Sheets (conectado a Google Form via AppScript)
- **Frontend**: HTML/CSS/JS simple o React básico (solo dashboard)
- **Sin backend propio**: Todo corre en Google ecosystem
- **Sin login**: Los usuarios solo interactúan con el Google Form

### Migración Futura (Camino B)
Cuando el MVP esté validado y haya presupuesto, se puede migrar a:
- Backend propio (Node.js + PostgreSQL)
- Login institucional (SSO)
- App móvil para escaneo de QR
- Supabase como alternativa a Google Sheets

---

## 3. USER STORIES DEL MVP

### US-001: Solicitud de Llave via Form
```
Como docente,
Quiero completar un formulario simple para solicitar una llave,
Para no tener que firmar en papel.
```
**Criterios:**
- [ ] Formulario con campos: Nombre, Sector/Llave solicitada, Motivo, Email (opcional)
- [ ] QR impreso en puerta abre el Google Form
- [ ] Al enviar → datos van a Google Sheets
- [ ] Confirmación visual para el usuario

### US-002: Devolución de Llave
```
Como usuario con llave,
Quiero registrar la devolución,
Para que conste en el sistema.
```
**Criterios:**
- [ ] Mismo form permite marcar "Devolución"
- [ ] Se registra timestamp de devolución en Sheets
- [ ] Seguridad ve actualización en Dashboard

### US-003: Personal de Mantenimiento (Con Padrino)
```
Como personal de limpieza/mantenimiento,
Quiero solicitar una llave,
Para que mi solicitud sea aprobada pero notifique a mi dirección.
```
**Criterios:**
- [ ] Form incluye selector "¿Sos personal de mantenimiento?"
- [ ] Si es sí → la solicitud se marca como "Requiere notificación"
- [ ] Email automático a Dirección de Mantenimiento (via AppScript)

### US-004: Dashboard Seguridad (Vista Principal)
```
Como personal de seguridad,
Quiero ver en UNA PANTALLA quién tiene qué llave AHORA,
Para tener control total desde la entrada.
```
**Criterios:**
- [ ] Lista de llaves actualmente prestadas: nombre usuario + llave + hora retiro
- [ ] Filtros: por sector, por tipo de usuario
- [ ] Auto-refresh cada 30 segundos
- [ ] Alertas visuales para préstamos > 2 horas

### US-005: Dashboard Director/Coordinador
```
Como director o coordinador,
Quiero ver el historial de solicitudes y aprobaciones,
Para auditar y generar reportes.
```
**Criterios:**
- [ ] Vista del historial completo
- [ ] Filtros: por fecha, por usuario, por llave, por sector
- [ ] Exportar a Excel/CSV
- [ ] Estadísticas básicas: cuántas solicitudes por día, llaves más pedidas

---

## 4. ESTRUCTURA DE DATOS (Google Sheets)

### Hoja: Solicitudes

| Timestamp | Nombre Solicitante | Sector/Llave | Tipo Usuario | Motivo | Acción | Estado | Notas |
|-----------|---------------------|--------------|--------------|--------|--------|--------|-------|
| 2026-04-06 09:00 | Juan Pérez | Lab. Química | Docente | Práctica | Retiro | Activo | - |
| 2026-04-06 10:30 | María García | Lab. Física | Docente | Práctica | Devolución | Cerrado | - |
| 2026-04-06 11:00 | Carlos Ruiz | Aulas 3° piso | Mantenimiento | Limpieza | Retiro | Activo | ⚠️ Notificar |

### Hoja: Llaves (Catálogo)

| ID | Nombre | Sector | Estado |
|----|--------|--------|--------|
| L001 | Llave Lab. Química | Planta Baja | Disponible |
| L002 | Llave Lab. Física | Planta Baja | Prestada |
| L003 | Llave Aulas 3° piso | 3° Piso | Disponible |

---

## 5. ARQUITECTURA DE ARCHIVOS (MVP Simple)

```
umai-key/
├── docs/
│   ├── AGENTS.md          # Este archivo
│   └── GLOSARIO.md        # Términos técnicos
│
├── dashboard/
│   ├── index.html         # Dashboard principal (Seguridad)
│   ├── admin.html         # Dashboard administración
│   ├── css/
│   │   └── styles.css     # Estilos compartidos
│   └── js/
│       ├── dashboard.js   # Lógica del dashboard
│       └── config.js      # Configuración (ID de Sheets)
│
├── form/
│   └── form-config.js     # AppScript para conectar Form → Sheets
│
├── assets/
│   └── qr/                # QRs impresos (generados staticamente)
│       └── generar-qr.js  # Script para generar QRs
│
└── README.md              # Guía de setup
```

---

## 6. FLUJO DE DESARROLLO

### Fase 1: Google Form + Sheets
1. Crear Google Form con campos necesarios
2. Configurar AppScript para guardar en Sheets
3. Probar flujo completo

### Fase 2: Dashboard Seguridad
1. HTML/CSS/JS básico
2. Conexión a Google Sheets via Sheets API o publish-as-web
3. Auto-refresh
4. Alertas visuales

### Fase 3: Dashboard Admin
1. Agregar filtros
2. Exportación CSV/Excel
3. Estadísticas básicas

### Fase 4: polish
1. Responsive design
2. Notificaciones email (AppScript)
3. QRs impresos

---

## 7. CONFIGURACIÓN

### Google Sheets (Requerido)
```javascript
// config.js
const CONFIG = {
  SHEETS_ID: 'tu-google-sheets-id-aqui',
  SHEET_NAME: 'Solicitudes',
  REFRESH_INTERVAL: 30000 // 30 segundos
};
```

### Google AppScript (Para conectar Form → Sheets)
```javascript
// form-config.js - Va en el AppScript del Google Form
function onFormSubmit(e) {
  const sheet = SpreadsheetApp.openById('SHEETS_ID').getSheetByName('Solicitudes');
  const row = [
    new Date(),
    e.response.getRespondentEmail(),
    e.response.getItemResponses()[0].getResponse(),
    // ... más campos
  ];
  sheet.appendRow(row);
}
```

---

## 8. TÉRMINOS IMPORTANTES

Para términos técnicos y acrónimos, ver **GLOSARIO.md**.

---

## 9. SIGUIENTES PASOS

### Inmediato (Esta semana)
- [ ] Crear Google Form con campos
- [ ] Configurar Sheets + AppScript
- [ ] Probar flujo: Form → Sheets

### Corto plazo
- [ ] Dashboard básico de Seguridad
- [ ] Conectar dashboard a Sheets
- [ ] Auto-refresh funcionando

### Medio plazo
- [ ] Dashboard Admin con filtros
- [ ] Exportación a Excel
- [ ] Notificaciones por email

---

*Documento actualizado: 2026-04-06*
*Metodología: Lean MVP + iterate based on feedback*
