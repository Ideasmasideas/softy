# Servicios Manager - ideasmasideas.com

Aplicación web para gestionar servicios digitales, proyectos, clientes y facturación.

![Preview](preview.png)

## Características

- **Dashboard**: Vista general con estadísticas y gráficos de facturación
- **Clientes**: Gestión completa de clientes (CRUD)
- **Proyectos**: Dos tipos de proyectos
  - Proyecto cerrado (presupuesto fijo)
  - Bolsa de horas (tarifa por hora)
- **Tareas**: Registro de tareas y horas por proyecto
- **Facturas**: 
  - Creación de facturas con múltiples líneas
  - Generación automática de número de factura
  - Exportación a PDF
  - Envío automático por email
  - Estados: borrador, enviada, pagada, vencida

## Tecnologías

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- Puppeteer (generación de PDF)
- Nodemailer (envío de emails)

### Frontend
- React.js
- React Router
- Recharts (gráficos)
- Lucide React (iconos)
- date-fns (fechas)

## Instalación

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus datos SMTP
npm run dev
```

El servidor iniciará en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación iniciará en `http://localhost:3000`

## Configuración de Email

Para enviar facturas por email, configura las variables SMTP en `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

Para Gmail, genera una "Contraseña de aplicación" en:
1. Ve a tu cuenta de Google > Seguridad
2. Activa la verificación en 2 pasos
3. Genera una contraseña de aplicación

## API Endpoints

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Obtener cliente
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Proyectos
- `GET /api/proyectos` - Listar proyectos
- `GET /api/proyectos/:id` - Obtener proyecto con tareas
- `POST /api/proyectos` - Crear proyecto
- `PUT /api/proyectos/:id` - Actualizar proyecto
- `DELETE /api/proyectos/:id` - Eliminar proyecto

### Tareas
- `POST /api/tareas` - Crear tarea
- `PUT /api/tareas/:id` - Actualizar tarea
- `DELETE /api/tareas/:id` - Eliminar tarea

### Facturas
- `GET /api/facturas` - Listar facturas
- `GET /api/facturas/:id` - Obtener factura con líneas
- `POST /api/facturas` - Crear factura
- `PUT /api/facturas/:id` - Actualizar factura
- `DELETE /api/facturas/:id` - Eliminar factura
- `GET /api/facturas/:id/pdf` - Descargar PDF
- `POST /api/facturas/:id/enviar` - Enviar por email

### Dashboard
- `GET /api/dashboard` - Estadísticas generales

### Configuración
- `GET /api/configuracion` - Obtener configuración
- `PUT /api/configuracion` - Actualizar configuración

## Estructura del Proyecto

```
servicios-app/
├── backend/
│   ├── server.js         # API Express
│   ├── package.json
│   ├── .env.example
│   └── servicios.db      # Base de datos SQLite (se crea automáticamente)
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Modal.js
    │   │   └── Sidebar.js
    │   ├── context/
    │   │   └── ToastContext.js
    │   ├── pages/
    │   │   ├── Dashboard.js
    │   │   ├── Clientes.js
    │   │   ├── Proyectos.js
    │   │   ├── ProyectoDetalle.js
    │   │   ├── Facturas.js
    │   │   ├── NuevaFactura.js
    │   │   ├── FacturaDetalle.js
    │   │   └── Configuracion.js
    │   ├── styles/
    │   │   └── global.css
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Diseño

El diseño está inspirado en interfaces modernas como Factorial, con:
- Sidebar de navegación
- Cards con estadísticas
- Gráficos de líneas para facturación
- Tablas con acciones
- Modales para formularios
- Notificaciones toast
- Colores: blanco, grises, acento coral (#ff6b6b)

## Licencia

MIT
