import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search,
  FolderKanban,
  Clock,
  Euro
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const estadoLabels = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completado: 'Completado',
  facturado: 'Facturado'
};

const estadoClasses = {
  pendiente: 'badge-gray',
  en_progreso: 'badge-warning',
  completado: 'badge-success',
  facturado: 'badge-primary'
};

export default function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('todos');
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    cliente_id: '',
    nombre: '',
    descripcion: '',
    tipo: 'proyecto',
    precio_hora: '',
    presupuesto: '',
    horas_estimadas: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [proyectosData, clientesData] = await Promise.all([
        api.getProyectos(),
        api.getClientes()
      ]);
      setProyectos(proyectosData);
      setClientes(clientesData);
    } catch (error) {
      addToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openNewModal() {
    setFormData({
      cliente_id: clientes[0]?.id || '',
      nombre: '',
      descripcion: '',
      tipo: 'proyecto',
      precio_hora: '',
      presupuesto: '',
      horas_estimadas: ''
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.createProyecto({
        ...formData,
        precio_hora: parseFloat(formData.precio_hora) || 0,
        presupuesto: parseFloat(formData.presupuesto) || 0,
        horas_estimadas: parseFloat(formData.horas_estimadas) || 0
      });
      addToast('Proyecto creado correctamente');
      setShowModal(false);
      loadData();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  const filteredProyectos = proyectos.filter(p => {
    const matchesSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'todos' || p.estado === filter;
    return matchesSearch && matchesFilter;
  });

  function getProgress(proyecto) {
    if (proyecto.tipo === 'horas' && proyecto.horas_estimadas > 0) {
      return Math.min(100, (proyecto.horas_registradas / proyecto.horas_estimadas) * 100);
    }
    if (proyecto.total_tareas > 0) {
      return (proyecto.tareas_completadas / proyecto.total_tareas) * 100;
    }
    return 0;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Proyectos</h1>
          <p className="page-subtitle">{proyectos.length} proyectos en total</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} />
          Nuevo Proyecto
        </button>
      </header>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div className="search-input">
            <Search />
            <input 
              type="text" 
              placeholder="Buscar proyectos..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="tabs">
            <button 
              className={`tab ${filter === 'todos' ? 'active' : ''}`}
              onClick={() => setFilter('todos')}
            >
              Todos
            </button>
            <button 
              className={`tab ${filter === 'en_progreso' ? 'active' : ''}`}
              onClick={() => setFilter('en_progreso')}
            >
              En Progreso
            </button>
            <button 
              className={`tab ${filter === 'completado' ? 'active' : ''}`}
              onClick={() => setFilter('completado')}
            >
              Completados
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>
        ) : filteredProyectos.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <FolderKanban size={40} />
              </div>
              <h3 className="empty-state-title">No hay proyectos</h3>
              <p className="empty-state-text">Crea tu primer proyecto para empezar</p>
              <button className="btn btn-primary" onClick={openNewModal}>
                <Plus size={18} />
                Nuevo Proyecto
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Horas</th>
                  {user?.rol === 'admin' && <th>Presupuesto</th>}
                  <th>Progreso</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredProyectos.map(proyecto => (
                  <tr
                    key={proyecto.id}
                    onClick={() => navigate(`/proyectos/${proyecto.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 600 }}>{proyecto.nombre}</div>
                      {proyecto.descripcion && (
                        <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>
                          {proyecto.descripcion.substring(0, 60)}{proyecto.descripcion.length > 60 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td>{proyecto.cliente_empresa || proyecto.cliente_nombre}</td>
                    <td>
                      <span className="badge badge-gray">
                        {proyecto.tipo === 'proyecto' ? 'Proyecto Cerrado' : 'Bolsa de Horas'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} />
                        {proyecto.horas_registradas || 0}h
                        {proyecto.horas_estimadas > 0 && (
                          <span style={{ color: 'var(--gray-400)' }}> / {proyecto.horas_estimadas}h</span>
                        )}
                      </div>
                    </td>
                    {user?.rol === 'admin' && (
                      <td>
                        {proyecto.tipo === 'proyecto' && proyecto.presupuesto > 0 ? (
                          <div style={{ fontWeight: 500 }}>
                            {proyecto.presupuesto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                          </div>
                        ) : proyecto.tipo === 'horas' && proyecto.precio_hora > 0 ? (
                          <div>{proyecto.precio_hora} €/h</div>
                        ) : (
                          <span style={{ color: 'var(--gray-400)' }}>-</span>
                        )}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1, maxWidth: 100 }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${getProgress(proyecto)}%` }}
                          />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, minWidth: 35 }}>
                          {Math.round(getProgress(proyecto))}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${estadoClasses[proyecto.estado]}`}>
                        {estadoLabels[proyecto.estado]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Nuevo Proyecto"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Crear Proyecto</button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select 
              className="form-select"
              value={formData.cliente_id}
              onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
              required
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} {c.empresa && `(${c.empresa})`}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre del Proyecto *</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea 
              className="form-textarea"
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Servicio</label>
            <div className="tabs" style={{ width: '100%' }}>
              <button 
                type="button"
                className={`tab ${formData.tipo === 'proyecto' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, tipo: 'proyecto' })}
                style={{ flex: 1 }}
              >
                Proyecto Cerrado
              </button>
              <button 
                type="button"
                className={`tab ${formData.tipo === 'horas' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, tipo: 'horas' })}
                style={{ flex: 1 }}
              >
                Bolsa de Horas
              </button>
            </div>
          </div>

          {user?.rol === 'admin' && (
            formData.tipo === 'proyecto' ? (
              <div className="form-group">
                <label className="form-label">Presupuesto (€)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.presupuesto}
                  onChange={e => setFormData({ ...formData, presupuesto: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
            ) : (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Precio por Hora (€)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.precio_hora}
                    onChange={e => setFormData({ ...formData, precio_hora: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Horas Estimadas</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.horas_estimadas}
                    onChange={e => setFormData({ ...formData, horas_estimadas: e.target.value })}
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            )
          )}
        </form>
      </Modal>
    </>
  );
}
