# Backend Structure - ContableSoft

## Clean, Modular Architecture with MySQL

This backend has been refactored to use MySQL with a clean, modular architecture following best practices.

## Directory Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # MySQL connection pool
│   │   └── initDatabase.js # Database initialization
│   ├── models/           # Data models (business logic)
│   │   ├── Cliente.js
│   │   ├── Proyecto.js
│   │   ├── Tarea.js
│   │   ├── Factura.js
│   │   ├── Usuario.js
│   │   ├── Configuracion.js
│   │   └── Dashboard.js
│   ├── controllers/      # Request handlers
│   │   ├── clienteController.js
│   │   ├── proyectoController.js
│   │   ├── tareaController.js
│   │   ├── facturaController.js
│   │   ├── usuarioController.js
│   │   ├── configuracionController.js
│   │   └── dashboardController.js
│   ├── routes/           # API routes
│   │   ├── index.js      # Main router
│   │   ├── clientes.js
│   │   ├── proyectos.js
│   │   ├── tareas.js
│   │   ├── facturas.js
│   │   ├── usuarios.js
│   │   ├── auth.js
│   │   ├── configuracion.js
│   │   ├── dashboard.js
│   │   └── gantt.js
│   ├── middleware/       # Custom middleware (future use)
│   └── utils/            # Utility functions
│       ├── pdfGenerator.js
│       └── emailSender.js
├── server.js             # Application entry point
├── .env                  # Environment variables
└── package.json

```

## Architecture Layers

### 1. **Routes** (`src/routes/`)
- Define API endpoints
- Map HTTP methods to controller functions
- Lightweight and focused on routing only

### 2. **Controllers** (`src/controllers/`)
- Handle HTTP requests and responses
- Validate input
- Call model methods
- Return appropriate responses

### 3. **Models** (`src/models/`)
- Contain business logic
- Interact with database
- Perform data validation
- Return data or errors

### 4. **Config** (`src/config/`)
- Database connection pool
- Environment configuration
- Database initialization

### 5. **Utils** (`src/utils/`)
- Reusable utility functions
- PDF generation
- Email sending

## Database Configuration

### Environment Variables (.env)

```env
# Server
PORT=3001

# MySQL Database
DB_HOST=172.16.0.238
DB_PORT=3306
DB_USER=usersoftdb
DB_PASSWORD=52c26dxO@
DB_NAME=db_softideas

# SendGrid (Email)
SENDGRID_API_KEY=your_key_here
SENDGRID_FROM_EMAIL=your_email_here
```

### Connection Pool

The application uses `mysql2/promise` with connection pooling for optimal performance:

```javascript
{
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}
```

## Database Tables

The application automatically creates these tables on startup:

- **clientes** - Customer information
- **proyectos** - Projects
- **tareas** - Tasks within projects
- **facturas** - Invoices
- **factura_lineas** - Invoice line items
- **configuracion** - Application configuration
- **usuarios** - Users
- **proyecto_usuarios** - Project-user relationships

## API Endpoints

### Clientes (Customers)
- `GET /api/clientes` - Get all customers
- `GET /api/clientes/:id` - Get customer by ID
- `POST /api/clientes` - Create customer
- `PUT /api/clientes/:id` - Update customer
- `DELETE /api/clientes/:id` - Delete customer

### Proyectos (Projects)
- `GET /api/proyectos` - Get all projects
- `GET /api/proyectos/:id` - Get project by ID
- `POST /api/proyectos` - Create project
- `PUT /api/proyectos/:id` - Update project
- `DELETE /api/proyectos/:id` - Delete project
- `GET /api/proyectos/:id/usuarios` - Get project users
- `POST /api/proyectos/:id/usuarios` - Add user to project
- `DELETE /api/proyectos/:proyectoId/usuarios/:usuarioId` - Remove user from project

### Tareas (Tasks)
- `POST /api/tareas` - Create task
- `PUT /api/tareas/:id` - Update task
- `DELETE /api/tareas/:id` - Delete task

### Facturas (Invoices)
- `GET /api/facturas` - Get all invoices
- `GET /api/facturas/:id` - Get invoice by ID
- `POST /api/facturas` - Create invoice
- `PUT /api/facturas/:id` - Update invoice
- `DELETE /api/facturas/:id` - Delete invoice
- `GET /api/facturas/:id/pdf` - Generate PDF
- `POST /api/facturas/:id/enviar` - Send invoice via email

### Usuarios (Users)
- `GET /api/usuarios` - Get all users
- `GET /api/usuarios/:id` - Get user by ID
- `POST /api/usuarios` - Create user
- `PUT /api/usuarios/:id` - Update user
- `DELETE /api/usuarios/:id` - Delete user
- `GET /api/usuarios/:id/proyectos` - Get user's projects

### Auth
- `POST /api/login` - User login

### Configuracion (Configuration)
- `GET /api/configuracion` - Get configuration
- `PUT /api/configuracion` - Update configuration

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Gantt
- `GET /api/gantt` - Get Gantt chart data

## Running the Application

### Test Database Connection

```bash
node test-connection.js
```

### Start Development Server

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

## Default Credentials

After initialization, a default admin user is created:

- **Email**: admin@ideasmasideas.com
- **Password**: admin123

**IMPORTANT**: Change this password in production!

## Key Features

### Clean Code Principles
- ✅ Separation of concerns
- ✅ Single responsibility principle
- ✅ Modular architecture
- ✅ Reusable components
- ✅ Easy to test and maintain

### Database
- ✅ MySQL with connection pooling
- ✅ Automatic table creation
- ✅ Foreign key constraints
- ✅ UTF-8 support

### Error Handling
- ✅ Try-catch blocks in all controllers
- ✅ Descriptive error messages
- ✅ Proper HTTP status codes

### Scalability
- ✅ Connection pooling for performance
- ✅ Modular structure for easy feature addition
- ✅ Clear separation of business logic

## Migration from SQLite

The new MySQL structure maintains compatibility with the existing API, so your frontend should work without changes. The main differences:

1. Database is now MySQL instead of SQLite
2. Better connection management with pooling
3. Improved error handling
4. Cleaner code structure

## Troubleshooting

### Cannot connect to MySQL

1. Verify MySQL server is running
2. Check firewall settings
3. Verify credentials in .env
4. Test with: `node test-connection.js`

### Tables not created

The application automatically creates tables on startup. If this fails:
1. Check database permissions
2. Verify database exists
3. Check MySQL logs

## Next Steps

Consider adding:
- [ ] JWT authentication
- [ ] Request validation middleware
- [ ] API rate limiting
- [ ] Logging system
- [ ] Unit tests
- [ ] API documentation (Swagger)
