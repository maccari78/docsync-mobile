# DocSync Mobile

Aplicación móvil para el sistema de gestión de clínicas DocSync, desarrollada con React Native y Expo.

## Descripción

DocSync Mobile permite a pacientes, profesionales, secretarias y administradores gestionar turnos médicos desde sus dispositivos móviles, con chat en tiempo real y notificaciones push.

### Características principales

- **Gestión de turnos** - Ver, crear y gestionar citas médicas
- **Chat en tiempo real** - Comunicación directa paciente-secretaría
- **Notificaciones push** - Alertas de nuevos mensajes y cambios de estado
- **Pagos con Stripe** - Pago de consultas desde la app
- **Autenticación** - Email/contraseña y Google Sign-In
- **Roles diferenciados** - Interfaces adaptadas según el tipo de usuario

## Tech Stack

| Componente  |     Tecnología      |
|-------------|---------------------|
| Framework   | React Native (Expo) |
| Navegación  | React Navigation 6  |
| HTTP Client |        Axios        |
| WebSockets  |    Action Cable     |
| Storage     |    AsyncStorage     |
| Auth        | JWT, Google Sign-In |

## Requisitos previos

- Node.js 18+
- Expo CLI
- Android Studio (para emulador Android) o dispositivo físico
- Backend DocSync corriendo (ver [docsync](https://github.com/maccari78/docsync))

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/maccari78/docsync-mobile.git
cd docsync-mobile

# Instalar dependencias
npm install

# Iniciar Expo
npx expo start --dev-client
```

## Configuración

### Conexión al Backend

Editar la IP del backend en:

```javascript
// src/services/api.js
const API_URL = 'http://TU_IP_LOCAL:3000/api/v1';

// src/services/actionCableService.js
const CABLE_URL = 'ws://TU_IP_LOCAL:3000/cable';
```

Para obtener tu IP local:
```bash
ip addr | grep "inet 192"
```

### Google Sign-In

Configurar el `webClientId` en:
```javascript
// src/screens/LoginScreen.js
webClientId: 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com'
```

## Estructura del proyecto

```
src/
├── components/          # Componentes reutilizables
├── navigation/          # Configuración de navegación
├── screens/             # Pantallas de la app
│   ├── LoginScreen.js
│   ├── DashboardScreen.js
│   ├── AppointmentsScreen.js
│   ├── AppointmentDetailScreen.js
│   ├── NewAppointmentScreen.js
│   ├── ConversationsScreen.js
│   └── ChatScreen.js
└── services/            # Servicios y API
    ├── api.js           # Configuración Axios
    ├── appointmentsService.js
    ├── conversationsService.js
    └── actionCableService.js
```

## Pantallas principales

### Dashboard
Vista principal con estadísticas y accesos rápidos según el rol del usuario.

### Turnos (Appointments)
- Lista de turnos con filtros (Todos, Pendientes, Confirmados, Completados)
- Detalle del turno con acciones según permisos
- Crear nuevo turno con selección de fecha/hora disponible

### Chat
- Lista de conversaciones con indicador de mensajes no leídos
- Chat en tiempo real con WebSockets
- Indicador de "escribiendo..."

## Roles y Permisos

|     Acción      |  Admin   | Profesional |        Secretaria       |  Paciente  |
|-----------------|----------|-------------|-------------------------|------------|
| Ver turnos      | ✅ Todos | ✅ Propios  | ✅ De sus profesionales | ✅ Propios |
| Confirmar turno | ✅       | ✅          | ✅                      | ❌         |
| Cancelar turno  | ✅       | ✅          | ✅                      | ❌         |
| Completar turno | ✅       | ✅          | ✅                      | ❌         |
| Crear turno     | ✅       | ✅          | ✅                      | ✅         | (pendiente)
| Pagar turno     | ✅       | ✅          | ✅                      | ✅         |
| Chat            | ✅       | ❌          | ✅                      | ✅         |

> **Nota:** Los pacientes no pueden cancelar turnos directamente. Deben solicitarlo a través del chat.

## Flujo de turnos

```
┌─────────────────────────────────────────────────────────┐
│  Paciente propone turno                                 │
│         ↓                                               │
│  Estado: PENDIENTE                                      │
│         ↓                                               │
│  Staff confirma                                         │
│         ↓                                               │
│  Estado: CONFIRMADO  ←──  Se crea chat                  │
│         ↓                                               │
│  Paciente paga (Stripe)                                 │
│         ↓                                               │
│  Estado: COMPLETADO                                     │
└─────────────────────────────────────────────────────────┘
```

## Desarrollo

### Ejecutar en desarrollo
```bash
npx expo start --dev-client
```

### Build de desarrollo (Android)
```bash
eas build --profile development --platform android
```

### Build de producción
```bash
eas build --profile production --platform android
```

## Credenciales de prueba

| Rol         | Email                     |  Password   |
|-------------|---------------------------|-------------|
| Admin       | admin@example.com         | password123 |
| Profesional | dr.alvarez@example.com    | password123 |
| Secretaria  | secretary.sol@example.com | password123 |

## Backend

Esta app requiere el backend DocSync corriendo.

**Repositorio:** [docsync](https://github.com/maccari78/docsync)

### Endpoints principales utilizados

```
POST   /api/v1/auth/login
POST   /api/v1/auth/google
GET    /api/v1/appointments
POST   /api/v1/appointments
POST   /api/v1/appointments/:id/confirm
POST   /api/v1/appointments/:id/cancel
GET    /api/v1/conversations
POST   /api/v1/conversations/:id/messages
```

### WebSocket Channels

- `ChatChannel` - Recibir mensajes en tiempo real
- `NotificationsChannel` - Notificaciones de nuevos mensajes

## Troubleshooting

### Error de conexión al backend
1. Verificar que el backend esté corriendo
2. Verificar la IP en `api.js` y `actionCableService.js`
3. Asegurarse de estar en la misma red WiFi

### Google Sign-In no funciona
1. Verificar el `webClientId`
2. Asegurarse de tener el SHA-1 configurado en Google Cloud Console
3. Usar un build de desarrollo (`--dev-client`)

### WebSocket no conecta
1. Verificar la URL del cable
2. Revisar que Action Cable esté configurado en el backend
3. Verificar autenticación JWT

## Roadmap

- [x] Autenticación JWT
- [x] Google Sign-In
- [x] CRUD de turnos
- [x] Chat en tiempo real
- [x] Pagos con Stripe
- [x] Notificaciones push básicas
- [ ] Notificaciones push mejoradas
- [ ] Modo offline
- [ ] Calendario visual

## Licencia

Este proyecto es privado y de uso exclusivo para DocSync.

---

Desarrollado con React Native y Expo
