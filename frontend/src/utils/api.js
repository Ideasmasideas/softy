const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || 'Error en la petición');
  }

  return response.json();
}

export const api = {
  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Clientes
  getClientes: () => request('/clientes'),
  getCliente: (id) => request(`/clientes/${id}`),
  createCliente: (data) => request('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  updateCliente: (id, data) => request(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCliente: (id) => request(`/clientes/${id}`, { method: 'DELETE' }),

  // Proyectos
  getProyectos: () => request('/proyectos'),
  getProyecto: (id) => request(`/proyectos/${id}`),
  createProyecto: (data) => request('/proyectos', { method: 'POST', body: JSON.stringify(data) }),
  updateProyecto: (id, data) => request(`/proyectos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProyecto: (id) => request(`/proyectos/${id}`, { method: 'DELETE' }),

  // Tareas
  createTarea: (data) => request('/tareas', { method: 'POST', body: JSON.stringify(data) }),
  updateTarea: (id, data) => request(`/tareas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTarea: (id) => request(`/tareas/${id}`, { method: 'DELETE' }),

  // Facturas
  getNextFacturaNumber: () => request('/facturas/next-number'),
  getFacturas: () => request('/facturas'),
  getFactura: (id) => request(`/facturas/${id}`),
  createFactura: (data) => request('/facturas', { method: 'POST', body: JSON.stringify(data) }),
  updateFactura: (id, data) => request(`/facturas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFactura: (id) => request(`/facturas/${id}`, { method: 'DELETE' }),
  sendFactura: (id) => request(`/facturas/${id}/enviar`, { method: 'POST' }),
  duplicateFactura: (id) => request(`/facturas/${id}/duplicar`, { method: 'POST' }),
  getEmailLog: () => request('/facturas/email-log'),
  getFacturaPDF: (id) => `${API_URL}/facturas/${id}/pdf`,
  getLogo: () => `${API_URL.replace('/api', '')}/public/uploads/logo.png`,

  // Configuración
  getConfig: () => request('/configuracion'),
  updateConfig: (data) => request('/configuracion', { method: 'PUT', body: JSON.stringify(data) }),

  // Usuarios
  getUsuarios: () => request('/usuarios'),
  getUsuario: (id) => request(`/usuarios/${id}`),
  createUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  updateUsuario: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
  login: (data) => request('/login', { method: 'POST', body: JSON.stringify(data) }),

  // Proyecto Usuarios
  getProyectoUsuarios: (proyectoId) => request(`/proyectos/${proyectoId}/usuarios`),
  addUsuarioToProyecto: (proyectoId, data) => request(`/proyectos/${proyectoId}/usuarios`, { method: 'POST', body: JSON.stringify(data) }),
  removeUsuarioFromProyecto: (proyectoId, usuarioId) => request(`/proyectos/${proyectoId}/usuarios/${usuarioId}`, { method: 'DELETE' }),
  getUsuarioProyectos: (usuarioId) => request(`/usuarios/${usuarioId}/proyectos`),

  // Facturas Recurrentes
  getFacturasRecurrentes: () => request('/facturas-recurrentes'),
  getFacturaRecurrente: (id) => request(`/facturas-recurrentes/${id}`),
  createFacturaRecurrente: (data) => request('/facturas-recurrentes', { method: 'POST', body: JSON.stringify(data) }),
  updateFacturaRecurrente: (id, data) => request(`/facturas-recurrentes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFacturaRecurrente: (id) => request(`/facturas-recurrentes/${id}`, { method: 'DELETE' }),
  toggleFacturaRecurrente: (id) => request(`/facturas-recurrentes/${id}/toggle`, { method: 'PUT' }),

  // Gantt
  getGanttData: () => request('/gantt'),
};
