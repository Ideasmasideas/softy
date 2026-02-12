import React, { useState, useEffect } from 'react';
import { Plus, Search, Users as UsersIcon, Shield, UserCheck, UserX } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const rolLabels = {
  admin: 'Administrador',
  manager: 'Manager',
  colaborador: 'Colaborador'
};

const modulosDisponibles = [
  { id: 'clientes', nombre: 'Clientes' },
  { id: 'proyectos', nombre: 'Proyectos' },
  { id: 'tareas', nombre: 'Tareas' },
  { id: 'facturas', nombre: 'Facturas' },
  { id: 'gantt', nombre: 'Diagrama de Gantt' },
  { id: 'configuracion', nombre: 'Configuración' },
  { id: 'usuarios', nombre: 'Usuarios' }
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'colaborador',
    permisos: [],
    activo: true
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      addToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openNewModal() {
    setEditingUsuario(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'colaborador',
      permisos: [],
      activo: true
    });
    setShowModal(true);
  }

  function openEditModal(usuario) {
    setEditingUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      permisos: usuario.permisos || [],
      activo: usuario.activo === 1
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingUsuario) {
        await api.updateUsuario(editingUsuario.id, formData);
        addToast('Usuario actualizado correctamente');
      } else {
        if (!formData.password) {
          addToast('La contraseña es requerida', 'error');
          return;
        }
        await api.createUsuario(formData);
        addToast('Usuario creado correctamente');
      }
      setShowModal(false);
      loadUsuarios();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await api.deleteUsuario(id);
      addToast('Usuario eliminado');
      loadUsuarios();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  function togglePermiso(modulo) {
    setFormData(prev => ({
      ...prev,
      permisos: prev.permisos.includes(modulo)
        ? prev.permisos.filter(p => p !== modulo)
        : [...prev.permisos, modulo]
    }));
  }

  const filteredUsuarios = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </header>

      <div className="page-content">
        <div style={{ marginBottom: 24 }}>
          <div className="search-input">
            <Search />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <UsersIcon size={40} />
              </div>
              <h3 className="empty-state-title">No hay usuarios</h3>
              <p className="empty-state-text">Crea tu primer usuario colaborador</p>
              <button className="btn btn-primary" onClick={openNewModal}>
                <Plus size={18} />
                Nuevo Usuario
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Permisos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map(usuario => (
                  <tr key={usuario.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: 14
                        }}>
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{usuario.nombre}</div>
                          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        usuario.rol === 'admin' ? 'badge-danger' :
                        usuario.rol === 'manager' ? 'badge-warning' :
                        'badge-gray'
                      }`}>
                        {rolLabels[usuario.rol]}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(usuario.permisos || []).slice(0, 3).map(p => (
                          <span key={p} className="badge badge-primary" style={{ fontSize: 11 }}>
                            {modulosDisponibles.find(m => m.id === p)?.nombre || p}
                          </span>
                        ))}
                        {(usuario.permisos || []).length > 3 && (
                          <span className="badge badge-gray" style={{ fontSize: 11 }}>
                            +{(usuario.permisos || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {usuario.activo === 1 ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)' }}>
                          <UserCheck size={16} />
                          Activo
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gray-400)' }}>
                          <UserX size={16} />
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openEditModal(usuario)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleDelete(usuario.id)}
                          style={{ color: 'var(--danger)' }}
                        >
                          Eliminar
                        </button>
                      </div>
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
        title={editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingUsuario ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              className="form-input"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Contraseña {editingUsuario && '(dejar vacío para mantener la actual)'}
            </label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUsuario ? 'Nueva contraseña' : 'Contraseña'}
              required={!editingUsuario}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Rol</label>
            <select
              className="form-select"
              value={formData.rol}
              onChange={e => setFormData({ ...formData, rol: e.target.value })}
            >
              <option value="colaborador">Colaborador</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Permisos de Módulos</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              padding: 12,
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)'
            }}>
              {modulosDisponibles.map(modulo => (
                <label
                  key={modulo.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: 8,
                    borderRadius: 'var(--radius-sm)',
                    background: formData.permisos.includes(modulo.id) ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.permisos.includes(modulo.id)}
                    onChange={() => togglePermiso(modulo.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 14 }}>{modulo.nombre}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={e => setFormData({ ...formData, activo: e.target.checked })}
              />
              <span>Usuario activo</span>
            </label>
          </div>
        </form>
      </Modal>
    </>
  );
}
