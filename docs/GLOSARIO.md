# GLOSARIO — UMAI-Key

> Términos técnicos y acrónimos del proyecto. Agregar acá cualquier término nuevo que surja.

---

## A

### API (Application Programming Interface)
Conjunto de reglas que permite que dos sistemas se comuniquen. En el contexto web, es el "contrato" entre el frontend (dashboard) y una fuente de datos (Sheets).

### Apps Script / Google Apps Script
Plataforma de Google para automatizar y extender sus productos (Sheets, Forms, Drive, Gmail) usando JavaScript. **No requiere instalar nada** — se programa desde el navegador.

#### ¿Qué es?
Es como "JavaScript" pero sabe comunicarse directamente con los productos de Google:
- Leer/escribir en Sheets
- Enviar emails por Gmail
- Modificar Forms
- Acceder a Drive

#### ¿Para qué se usa en UMAI-Key?
1. **Conectar Form → Sheets**: Cuando alguien envía el form, Apps Script guarda los datos en el Sheet
2. **Validaciones**: Verificar legajos contra una base de datos
3. **Notificaciones**: Enviar email al Padrino cuando alguien de mantenimiento pide llave
4. **Actualizar estados**: Marcar solicitudes como "Cerradas" cuando se devuelve

#### Conceptos clave

| Concepto | Qué hace |
|----------|----------|
| **Trigger** | Un "escuchador" que detecta cuándo ocurrió algo (ej: se envió un form) |
| **onFormSubmit()** | La función que se ejecuta automáticamente al enviar el formulario |
| **SpreadsheetApp** | Clase para abrir y manipular Sheets |
| **MailApp** | Clase para enviar emails |

#### Cómo acceder
1. Abrir el Google Form o Sheet
2. Click en **⋮ (tres puntos)** → **Editor de Apps Script**
3. Se abre un editor en el navegador (como VS Code pero más simple)

#### Estructura del código

```javascript
// Esta función se ejecuta cuando alguien envía el formulario
function onFormSubmit(e) {
  
  // 1. Obtener la respuesta del form
  var respuesta = e.response;
  
  // 2. Extraer los datos de cada pregunta (por índice)
  var nombre = respuesta.getResponse()[0];  // Pregunta 1
  var legajo = respuesta.getResponse()[1];   // Pregunta 2
  var sector = respuesta.getResponse()[2];  // Pregunta 3
  var tipo = respuesta.getResponse()[3];    // Pregunta 4
  var motivo = respuesta.getResponse()[4];  // Pregunta 5
  var accion = respuesta.getResponse()[5];  // Pregunta 6
  
  // 3. Abrir el Sheet destino
  var sheet = SpreadsheetApp
    .openById('AQUI_VA_EL_ID_DEL_SHEET')
    .getSheetByName('Solicitudes');
  
  // 4. Guardar la fila
  sheet.appendRow([
    new Date(),   // Timestamp automático
    nombre,
    legajo,
    sector,
    tipo,
    '',          // Padrino (se llena si es mantenimiento)
    motivo,
    accion,
    'Activo'     // Estado inicial
  ]);
  
  // 5. (Opcional) Enviar email si es mantenimiento
  if (tipo === 'Mantenimiento') {
    MailApp.sendEmail({
      to: 'direccion.mantenimiento@umai.edu.ar',
      subject: 'Nueva solicitud de llave - Mantenimiento',
      body: nombre + ' solicitó acceso a ' + sector + '. Legajo: ' + legajo
    });
  }
}
```

#### Cómo configurar el Trigger
1. En el editor de Apps Script, click en **⚡ (Triggers)** en el menú lateral izquierdo
2. Click en **"+ Añadir trigger"**
3. Configurar:
   - Función: `onFormSubmit`
   - Implementación: `onFormSubmit`
   - Evento: **Al enviar el formulario**

#### Limitaciones en Google Forms nativo
| Lo que querés hacer | ¿Se puede? |
|---------------------|------------|
| Poblar dropdown desde Sheet | ✅ Sí |
| Validar legajo contra DB | ⚠️ Solo post-envío (no en tiempo real) |
| Rechazar envío si no es válido | ❌ No directamente |
| Mensaje de error por campo | ❌ No |

> **Nota**: Para validación en tiempo real se necesitaría un formulario web custom ( Apps Script como Web App), pero eso es más complejo y está en el roadmap del **Camino B**.

---

## D

### Dashboard
Pantalla o aplicación que muestra datos de forma visual y organizada. En este proyecto: el panel que ve Seguridad con las llaves prestadas en tiempo real.

---

## I

### ISO (International Organization for Standardization)
Organización internacional que crea **estándares/reglas** para que productos y servicios sean seguros, confiables y de calidad. Abarca todo: desde tecnología hasta gestión empresarial.

**Ejemplos conocidos:**
| ISO | Qué regula | En simples |
|-----|-----------|------------|
| ISO 9001 | Calidad | "La empresa sigue procesos para no fallar" |
| ISO 27001 | Seguridad de la información | "Los datos están protegidos de hackeos" |
| ISO 14001 | Gestión ambiental | "La empresa contamina lo menos posible" |
| ISO 22301 | Continuidad del negocio | "Si se cae el server, hay plan B" |

> **En contexto de UMAI-Key**: Cuando hablamos de "normas ISO" en el Camino B, nos referimos principalmente a **ISO 27001** (seguridad de datos). Significa que si la app maneja datos sensibles de la universidad, debería cumplir estándares de seguridad internacionales.

**En resumen**: ISO = las "reglas del juego" a nivel mundial para que todo sea más seguro y confiable.

---

## G

### Google Form
Herramienta gratuita de Google para crear formularios. Los usuarios completan el formulario → los datos van a Google Sheets automáticamente (o via AppScript).

### Google Sheets
Hoja de cálculo de Google. Funciona como base de datos simplificada en el MVP.

---

## M

### Migración
Proceso de mover datos o funcionalidades de un sistema a otro. Por ejemplo: migrar de Google Sheets a PostgreSQL cuando el MVP crezca.

### MVP (Minimum Viable Product)
Producto mínimo viable. Versión más simple de tu producto que cumple la función core. Permite validar la idea con el menor esfuerzo posible antes de invertir más.

> En nuestro caso: QR impreso + Google Form + Sheets + Dashboard simple.

---

## P

### Padrino (de área)
En el contexto de Personal de Mantenimiento: es la **Dirección de Mantenimiento**. Cuando un empleado de mantenimiento solicita una llave, se aprueba pero se envía una notificación al área.

> No confundir con el "Padrino" de auth/Guest de la versión previa del documento.

### PostgreSQL
Sistema de base de datos relacional (tipo SQL). Es robusto, open source, y muy usado en producción. En el MVP **no se usa** — usamos Google Sheets — pero es la opción para el Camino B.

> **Analogía**: Si Google Sheets es una hoja de cálculo de Excel, PostgreSQL es un archivo de base de datos de verdad, capaz de manejar miles de registros y consultas complejas.

**Ejemplo de estructura:**
```sql
CREATE TABLE solicitudes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255),
  llave VARCHAR(100),
  accion VARCHAR(50),
  estado VARCHAR(50),
  timestamp TIMESTAMP
);
```

### Publish-as-web (Sheets)
Opción de Google Sheets que permite exponer una hoja como página web pública (HTML). Se puede consultar via JavaScript sin API keys.

---

## Q

### QR (Quick Response)
Código de barras 2D que almacena información. En este proyecto se **imprime** y se pega en las puertas. Al escanearlo con cualquier celular → abre el Google Form.

**Diferencia importante:**
- ❌ ~~Escanear QR con la app para retirar llave~~ → NO SE HACE
- ✅ QR impreso en puerta → link al Google Form → SE HACE

---

## R

### Real-time / Tiempo Real
Actualización de datos instantáneamente. En el dashboard de Seguridad: se refresca automáticamente cada 30 segundos para mostrar quién tiene qué llave ahora.

---

## S

### SDD (Spec-Driven Development)
Metodología de desarrollo donde **la especificación viene primero**. Antes de escribir código, definís:
1. **Qué** se va a hacer (propuesta)
2. **Cómo** se va a hacer (spec detallada)
3. **Diseño técnico** (arquitectura)
4. **Tareas concretas** (checklist)
5. **Implementación** (código)
6. **Verificación** (que el código matchee la spec)

> Es como construir una casa: primero los planos, después los cimientos, después las paredes.

En este proyecto lo usamos con los comandos `/opencode sdd-*`:
- `sdd-propose` → crear propuesta
- `sdd-spec` → escribir specs
- `sdd-design` → diseño técnico
- `sdd-tasks` → dividir en tareas
- `sdd-apply` → implementar
- `sdd-verify` → verificar contra spec

### Sheets API
API de Google para leer/escribir datos en Sheets programáticamente. Requiere autenticación pero da más control que "publish-as-web".

### SSO (Single Sign-On)
Inicio de sesión único. Un usuario se loguea una vez y tiene acceso a todos los sistemas de la institución. **No se usa en el MVP** pero está en el roadmap (Camino B).

### Supabase
Plataforma "todo-en-uno" que te da una base de datos PostgreSQL en la nube + Auth + Realtime + Storage + API automática. Es como un **"Firebase pero con PostgreSQL"**.

**¿Qué ofrece?**
| Componente | Función |
|------------|---------|
| PostgreSQL | Base de datos relacional robusta |
| Auth | Sistema de login de usuarios |
| Realtime | Actualizaciones en tiempo real (tipo WebSocket) |
| Storage | Guardar archivos (fotos, PDFs) |
| API automática | Endpoints REST generados automáticamente |

**Ejemplo de uso:**
```javascript
const { data, error } = await supabase
  .from('solicitudes')
  .select('*')
  .eq('estado', 'Activo');
```

> En el roadmap (Camino B), Supabase es la opción para migrar cuando Google Sheets se quede chico. Cambiás Sheets por Supabase y mantenés la web app.

---

## T

### Timestamp
Marca de tiempo. Registro de cuándo ocurrió un evento (fecha + hora). En Sheets lo usamos para saber cuándo se solicitó y cuándo se devolvió una llave.

---

## W

### WebSocket
Protocolo de comunicación bidireccional entre cliente y servidor. A diferencia de HTTP (request → response → fin), WebSocket mantiene la conexión **abierta** para enviar datos en tiempo real sin que el cliente tenga que pedir.

**Ejemplo:**
- HTTP: "Dame los datos" → "Aquí están" → "Dame los datos" → "Aquí están" (polling)
- WebSocket: Conexión abierta → Server envía "¡Alguien retiró una llave!" automáticamente

> **Analogía**: HTTP es como pedirle a alguien que te llame cuando cambie algo (y vos llamar cada 5 min para preguntar). WebSocket es como tener una línea abierta con esa persona que te avisa instantáneamente.

En el MVP **no se usa** — usamos auto-refresh cada 30 segundos. En el Camino B, WebSocket permitiría ver cambios instantáneos en el dashboard.

---

## Conceptos Eliminados / En Espera

Estos términos estaban en versiones anteriores pero **NO se usan en el MVP actual**:

| Término | Motivo de eliminación |
|---------|---------------------|
| Login/Auth institucional | No hay login en MVP |
| WebSocket | Sin backend propio, se usa auto-refresh |
| QR escaneado | El QR es impreso, no se escanea |
| PostgreSQL | Se usa Sheets por ahora |
| Clean Architecture | MVP muy simple, overkill |
| Guest/Padrino (auth) | Padrino ahora es solo la Dirección de Mantenimiento |
| OAuth | Sin login = sin OAuth |

---

## Roadmap: Camino B (Futuro)

Cuando el MVP esté validado y haya presupuesto para el **Camino B**, estos términos volverían a aplicarse:

- **Backend propio**: Node.js + PostgreSQL o Supabase
- **Login institucional**: SSO con cuenta Google institucional
- **App móvil**: Escaneo de QR con la cámara
- **WebSocket**: Actualizaciones instantáneas sin refresh
- **API REST**: Comunicación formal entre frontend y backend

---

---

## Conceptos Actualizados (2026-04-14)

### Formulario con Secciones
Google Forms permite crear **secciones** (páginas) dentro de un mismo formulario. Esto permite:
- Una pregunta inicial que bifurca el flujo
- Diferentes campos según la respuesta
- Todo en un solo QR/link

### Validación de Email Post-Envío
Sin Google Workspace Education, no se puede restringir el dominio en el formulario. La validación se hace via AppScript:
```javascript
if (email.endsWith('@maimonidesvirtual.com.ar')) {
  // Es institucional
} else {
  // Marcar como "⚠️ Revisar"
}
```

---

*Última actualización: 2026-04-14*
