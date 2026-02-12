import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Pencil, 
  Trash2,
  Users,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [showMenu, setShowMenu] = useState(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    direccion: '',
    nif: ''
  });

  useEffect(() => {
    loadClientes();
  }, []);

  async function loadClientes() {
    try {
      const data = await api.getClientes();
      setClientes(data);
    } catch (error) {
      addToast('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openNewModal() {
    setEditingCliente(null);
    setFormData({ nombre: '', email: '', telefono: '', empresa: '', direccion: '', nif: '' });
    setShowModal(true);
  }

  function openEditModal(cliente) {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      empresa: cliente.empresa || '',
      direccion: cliente.direccion || '',
      nif: cliente.nif || ''
    });
    setShowModal(true);
    setShowMenu(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingCliente) {
        await api.updateCliente(editingCliente.id, formData);
        addToast('Cliente actualizado correctamente');
      } else {
        await api.createCliente(formData);
        addToast('Cliente creado correctamente');
      }
      setShowModal(false);
      loadClientes();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function handleDelete(cliente) {
    if (!window.confirm(`¿Eliminar a ${cliente.nombre}?`)) return;
    try {
      await api.deleteCliente(cliente.id);
      addToast('Cliente eliminado correctamente');
      loadClientes();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setShowMenu(null);
  }

  const filteredClientes = clientes.filter(c => 
    c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} clientes registrados</p>
        </div>
        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </header>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div className="search-input">
              <Search />
              <input 
                type="text" 
                placeholder="Buscar clientes..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>
          ) : filteredClientes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={40} />
              </div>
              <h3 className="empty-state-title">No hay clientes</h3>
              <p className="empty-state-text">Añade tu primer cliente para empezar</p>
              <button className="btn btn-primary" onClick={openNewModal}>
                <Plus size={18} />
                Nuevo Cliente
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Proyectos</th>
                    <th>Facturado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map(cliente => (
                    <tr key={cliente.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ 
                            width: 40, 
                            height: 40, 
                            background: 'var(--primary-light)', 
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            fontWeight: 600
                          }}>
                            {cliente.nombre?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{cliente.nombre}</div>
                            {cliente.empresa && (
                              <div style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Building2 size={12} />
                                {cliente.empresa}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={14} style={{ color: 'var(--gray-400)' }} />
                            {cliente.email}
                          </div>
                          {cliente.telefono && (
                            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Phone size={14} style={{ color: 'var(--gray-400)' }} />
                              {cliente.telefono}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray">{cliente.total_proyectos} proyectos</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {(cliente.facturado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </span>
                      </td>
                      <td>
                        <div className="dropdown">
                          <button 
                            className="btn btn-icon btn-secondary btn-sm"
                            onClick={() => setShowMenu(showMenu === cliente.id ? null : cliente.id)}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {showMenu === cliente.id && (
                            <div className="dropdown-menu">
                              <button className="dropdown-item" onClick={() => openEditModal(cliente)}>
                                <Pencil size={16} />
                                Editar
                              </button>
                              <button className="dropdown-item danger" onClick={() => handleDelete(cliente)}>
                                <Trash2 size={16} />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingCliente ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
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
              <label className="form-label">Empresa</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.empresa}
                onChange={e => setFormData({ ...formData, empresa: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
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
              <label className="form-label">Teléfono</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">NIF/CIF</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.nif}
              onChange={e => setFormData({ ...formData, nif: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <textarea 
              className="form-textarea"
              value={formData.direccion}
              onChange={e => setFormData({ ...formData, direccion: e.target.value })}
              rows={2}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
