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
3. **Dashboard web** para que Seguridad vea el estado en tiempo real

### Problema Actual
- Proceso lento: firma física en papel
- Sin visibilidad en tiempo real: nadie sabe quién tiene qué llave
- Auditoría manual: difícil rastrear historial
- Sin estadísticas de uso

### Arquitectura MVP

```
┌─────────────────┐      ┌──────────────────┐      ┌───────────────┐
│  QR IMPRESO     │ ───→ │  Google Form     │ ───→ │  Google       │
│  (en la puerta) │      │  (1 form, 2 secs)│      │  Sheets       │
└─────────────────┘      └──────────────────┘      │  (base datos) │
                                                    └───────┬───────┘
                                                            │ consulta
                                                            ▼
                                                    ┌───────────────┐
                                                    │  Dashboard    │
                                                    │  (Seguridad)  │
                                                    └───────────────┘
```

---

## 2. DECISIONES DE DISEÑO (2026-04-14)

### Dominio Institucional
- **Email institucional:** `@maimonidesvirtual.com.ar`
- **Validación:** Se hace via AppScript post-envío (Google Workspace Education no disponible)
- **Comportamiento:** Si el email NO termina en `@maimonidesvirtual.com.ar` → se marca como "⚠️ Revisar"

### Formulario: UN SOLO FORM CON DOS SECCIONES

El formulario tiene **una sección inicial** que bifurca a dos caminos:

```
┌─────────────────────────────────────────────────────┐
│  Sección 0: "¿Qué tipo de usuario sos?"            │
│  - Docente / Personal institucional                 │
│  - Mantenimiento / Limpieza / Otro                  │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  Sección A:     │         │  Sección B:     │
│  DOCENTE        │         │  MANTENIMIENTO  │
├─────────────────┤         ├─────────────────┤
│ - Email         │         │ - Sector/Área   │
│ - ¿Qué llave?  │         │ - Email Padrino │
│                 │         │ - ¿Qué llave?  │
└─────────────────┘         └─────────────────┘
                       │
                       ▼
              ───→ MISMA SHEETS ←───
```

### Estructura Final del Formulario

| # | Campo | Tipo | Notas |
|---|-------|------|-------|
| 0 | ¿Qué tipo de usuario sos? | Opción múltiple | Bifurcación a Sección A o B |
| 1A | Email institucional | Texto corto | Solo Sección A (Docente) |
| 1B | Sector / Área | Texto corto | Solo Sección B (Mantenimiento) |
| 2B | Email de tu Padrino | Texto corto | Solo Sección B |
| 3 | ¿Qué llave solicitás? | Desplegable | Ambas secciones |
| 4 | Confirmo que devolveré la llave al terminar | Casilla de verificación | Ambas secciones |

### Campos ELIMINADOS (no se usan)
- ~~Motivo~~ — No es necesario para el MVP
- ~~Acción (Retiro/Devolución)~~ — Solo se usa para retirar; la devolución se hace en Dashboard

### Flujo de Devolución
```
Usuario llena form → Llave marcada como "Retirada"
        ↓
Usuario devuelve llave
        ↓
Seguridad toca el botón "Devolver" en Dashboard → Estado = "Devuelta"
```

---

## 3. ESTRUCTURA DE DATOS (Google Sheets)

### Hoja: Consolidado

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Timestamp | Nombre | Email | Tipo | Email Padrino | Llave | Estado |

### Estados posibles:
- `🔴 Retirada` — Llave en uso (valor inicial)
- `🟢 Devuelta` — Seguridad marcó la devolución

### AppScript: Validación de emails
```javascript
function onFormSubmit(e) {
  const respuesta = e.response;
  const itemResponses = respuesta.getItemResponses();
  
  // Determinar tipo de usuario según la sección
  const tipoUsuario = itemResponses[0].getResponse(); // "¿Qué tipo de usuario?"
  
  let nombre, email, tipo, emailPadrino, llave;
  
  if (tipoUsuario === 'Docente / Personal institucional') {
    // Sección A
    nombre = itemResponses[1].getResponse(); // Nombre
    email = itemResponses[2].getResponse();  // Email
    emailPadrino = '';
    llave = itemResponses[3].getResponse();  // Llave
  } else {
    // Sección B
    nombre = itemResponses[1].getResponse();       // Nombre
    emailPadrino = itemResponses[2].getResponse(); // Email Padrino
    email = itemResponses[3].getResponse();       // Email propio
    llave = itemResponses[4].getResponse();       // Llave
  }
  
  // Validar email institucional
  let estado = '✅ Válido';
  if (!email.endsWith('@maimonidesvirtual.com.ar')) {
    estado = '⚠️ Revisar';
  }
  
  // Escribir en Consolidado
  const sheet = SpreadsheetApp.openById('SHEETS_ID').getSheetByName('Consolidado');
  sheet.appendRow([new Date(), nombre, email, tipoUsuario, emailPadrino, llave, estado]);
}
```

---

## 4. ROLES DEL SISTEMA

| Rol | Descripción | Interacción |
|-----|-------------|-------------|
| **Docente** | Tiene email @maimonidesvirtual.com.ar | Llena Sección A del form |
| **Personal Mantenimiento** | NO tiene email institucional. Su Padrino es su responsable de área | Llena Sección B del form |
| **Seguridad** | Ve quién tiene qué llave EN ESTE MOMENTO | Dashboard + marca devoluciones |

---

## 5. ARQUITECTURA DE ARCHIVOS

```
umai-key/
├── docs/
│   ├── AGENTS.md          # Este archivo
│   └── GLOSARIO.md        # Términos técnicos
│
├── dashboard/
│   ├── index.html         # Dashboard principal (Seguridad)
│   ├── css/
│   │   └── styles.css     # Estilos
│   └── js/
│       ├── dashboard.js   # Lógica
│       └── config.js      # Config (SHEETS_ID)
│
├── apps-script/
│   └── form-to-sheets.js  # AppScript para conectar Form → Sheets
│
├── assets/
│   └── qr/                # QRs impresos
│
└── README.md
```

---

## 6. CONFIGURACIÓN ACTUAL

### Google Form
- **URL:** https://forms.gle/JJYJhjuVM4F4FpC79
- **Tipo:** Un solo form con dos secciones

### Google Sheets
- **URL:** https://docs.google.com/spreadsheets/d/15sm14n2uFIe2bkIG6SZhyot_U61B5yQ-8awXVgq7gSw/edit
- **Hoja:** Consolidado
- **Columnas:** Timestamp, Nombre, Email, Tipo, Email Padrino, Llave, Estado

### Pendiente: AppScript
- [ ] Conectar form → Sheets
- [ ] Validar emails @maimonidesvirtual.com.ar
- [ ] Consolidar ambas secciones en una sola columna "Llave"

---

## 7. FLUJO DE DESARROLLO

### Fase 1: Google Form + Sheets ✅ (Completado)
- [x] Crear Google Form con dos secciones
- [x] Crear Google Sheets
- [ ] Configurar AppScript
- [ ] Probar flujo completo

### Fase 2: Dashboard Seguridad
- [ ] HTML/CSS/JS básico
- [ ] Conexión a Google Sheets
- [ ] Botón "Devolver" para Seguridad
- [ ] Auto-refresh cada 30 segundos

### Fase 3: polish
- [ ] Responsive design
- [ ] Estadísticas básicas
- [ ] QRs impresos

---

## 8. LIMITACIONES CONOCIDAS

| Limitación | Impacto | Solución futura |
|------------|---------|-----------------|
| No hay restricción de dominio en Google Forms | Cualquiera puede escribir cualquier email | Google Workspace Education |
| Validación de email post-envío | No se rechaza el form, solo se marca | Web app custom con validación en tiempo real |
| Un solo Dashboard (Seguridad) | Directores no tienen vista propia | Dashboard Admin (futuro) |

---

## 9. SIGUIENTES PASOS

### Inmediato
- [ ] Crear AppScript para conectar Form → Sheets
- [ ] Probar que los datos llegan correctamente
- [ ] Testear validación de emails

### Corto plazo
- [ ] Dashboard básico de Seguridad
- [ ] Conexión dashboard a Sheets
- [ ] Funcionalidad "Devolver"

---

*Documento actualizado: 2026-04-14*
*Metodología: Lean MVP + iterate based on feedback*
