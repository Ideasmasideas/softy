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
  uploadLogo: async (file) => {
    const url = `${API_URL}/configuracion/logo`;
    const formData = new FormData();
    formData.append('logo', file);
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'Error en la petición');
    }
    return response.json();
  },
  deleteLogo: () => request('/configuracion/logo', { method: 'DELETE' }),

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

  // Gastos
  getGastos: () => request('/gastos'),
  getGasto: (id) => request(`/gastos/${id}`),
  createGasto: async (formData) => {
    const url = `${API_URL}/gastos`;
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'Error en la petición');
    }
    return response.json();
  },
  updateGasto: async (id, formData) => {
    const url = `${API_URL}/gastos/${id}`;
    const response = await fetch(url, { method: 'PUT', body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'Error en la petición');
    }
    return response.json();
  },
  deleteGasto: (id) => request(`/gastos/${id}`, { method: 'DELETE' }),
  getGastosResumenTrimestral: (year) => request(`/gastos/resumen-trimestral?year=${year}`),
  getGastoArchivo: (filename) => `${API_URL.replace('/api', '')}/public/uploads/gastos/${filename}`,

  // Dashboard Fiscal
  getDashboardFiscal: (year) => request(`/dashboard/fiscal?year=${year}`),

  // Recordatorios (Mi Dia)
  getRecordatoriosHoy: () => request('/recordatorios/hoy'),
  getRecordatoriosMatriz: () => request('/recordatorios/matriz'),
  getRecordatoriosSummary: () => request('/recordatorios/summary'),
  getRecordatorios: () => request('/recordatorios'),
  getRecordatorio: (id) => request(`/recordatorios/${id}`),
  createRecordatorio: (data) => request('/recordatorios', { method: 'POST', body: JSON.stringify(data) }),
  updateRecordatorio: (id, data) => request(`/recordatorios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRecordatorio: (id) => request(`/recordatorios/${id}`, { method: 'DELETE' }),
  toggleRecordatorio: (id) => request(`/recordatorios/${id}/toggle`, { method: 'PATCH' }),
  updateRecordatorioCuadrante: (id, cuadrante) => request(`/recordatorios/${id}/cuadrante`, { method: 'PATCH', body: JSON.stringify({ cuadrante }) }),

  // IA
  getBriefing: () => request('/ai/briefing'),
  generateTasks: (data) => request('/ai/generate-tasks', { method: 'POST', body: JSON.stringify(data) }),
  aiChat: (data) => request('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
  // Gmail
  getGmailStatus: () => request('/gmail/status'),
  getGmailAuthUrl: () => request('/gmail/auth'),
  getGmailEmails: (max, q) => request(`/gmail/emails?max=${max || 20}${q ? '&q=' + encodeURIComponent(q) : ''}`),
  getGmailEmail: (id) => request(`/gmail/emails/${id}`),
  procesarEmail: (id) => request(`/gmail/emails/${id}/procesar`, { method: 'POST' }),
  crearTareasDesdeEmail: (id, data) => request(`/gmail/emails/${id}/crear-tareas`, { method: 'POST', body: JSON.stringify(data) }),
  disconnectGmail: () => request('/gmail/disconnect', { method: 'DELETE' }),

  extractInvoice: async (file) => {
    const url = `${API_URL}/ai/extract-invoice`;
    const formData = new FormData();
    formData.append('archivo', file);
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || 'Error en la petición');
    }
    return response.json();
  },
};
