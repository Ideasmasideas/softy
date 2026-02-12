import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  ArrowLeft,
  Plus,
  Clock,
  Euro,
  Check,
  Trash2,
  Pencil,
  FileText,
  ChevronDown,
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { format } from 'date-fns';

const estadoLabels = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completado: 'Completado',
  facturado: 'Facturado'
};

const tareaEstadoLabels = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completada: 'Completada',
  bloqueada: 'Bloqueada'
};

const tareaEstadoColors = {
  pendiente: '#94a3b8',
  en_progreso: '#3b82f6',
  completada: '#10b981',
  bloqueada: '#ef4444'
};

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [localGroups, setLocalGroups] = useState([]);
  const [editingTarea, setEditingTarea] = useState(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const [tareaForm, setTareaForm] = useState({
    titulo: '',
    descripcion: '',
    horas: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    grupo: '',
    responsable: '',
    estado: 'pendiente',
    fecha_fin: ''
  });

  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadProyecto();
    loadUsuarios();
  }, [id]);

  // Clean up localGroups once they have tasks from the server
  useEffect(() => {
    if (proyecto?.tareas) {
      const serverGroups = new Set(proyecto.tareas.map(t => t.grupo).filter(Boolean));
      setLocalGroups(prev => prev.filter(g => !serverGroups.has(g)));
    }
  }, [proyecto]);

  async function loadProyecto() {
    try {
      const data = await api.getProyecto(id);
      setProyecto(data);
      setEditForm({
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        tipo: data.tipo,
        precio_hora: data.precio_hora || '',
        presupuesto: data.presupuesto || '',
        horas_estimadas: data.horas_estimadas || '',
        estado: data.estado
      });
    } catch (error) {
      addToast('Error al cargar el proyecto', 'error');
      navigate('/proyectos');
    } finally {
      setLoading(false);
    }
  }

  async function loadUsuarios() {
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function handleAddTarea(e) {
    e.preventDefault();
    try {
      await api.createTarea({
        proyecto_id: id,
        ...tareaForm,
        horas: parseFloat(tareaForm.horas) || 0
      });
      addToast('Tarea añadida correctamente');
      setShowTareaModal(false);
      setTareaForm({
        titulo: '',
        descripcion: '',
        horas: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        grupo: '',
        responsable: '',
        estado: 'pendiente',
        fecha_fin: ''
      });
      loadProyecto();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function updateTareaField(tarea, field, value) {
    try {
      const updateData = { [field]: value };
      // Only set completada when explicitly changing estado
      if (field === 'estado') {
        updateData.completada = value === 'completada' ? 1 : 0;
      }
      await api.updateTarea(tarea.id, updateData);
      loadProyecto();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function deleteTarea(tareaId) {
    if (!window.confirm('¿Eliminar esta tarea?')) return;
    try {
      await api.deleteTarea(tareaId);
      addToast('Tarea eliminada');
      loadProyecto();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function handleUpdateProyecto(e) {
    e.preventDefault();
    try {
      await api.updateProyecto(id, {
        ...editForm,
        precio_hora: parseFloat(editForm.precio_hora) || 0,
        presupuesto: parseFloat(editForm.presupuesto) || 0,
        horas_estimadas: parseFloat(editForm.horas_estimadas) || 0
      });
      addToast('Proyecto actualizado');
      setShowEditModal(false);
      loadProyecto();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function deleteProyecto() {
    if (!window.confirm('¿Eliminar este proyecto y todas sus tareas?')) return;
    try {
      await api.deleteProyecto(id);
      addToast('Proyecto eliminado');
      navigate('/proyectos');
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  function toggleGroup(groupName) {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }

  async function handleDragEnd(result) {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const tareaId = draggableId;
    const sourceGroup = source.droppableId;
    const destGroup = destination.droppableId;

    // Find the task
    const tarea = proyecto.tareas.find(t => t.id === tareaId);
    if (!tarea) return;

    // Update task group
    const newGroup = destGroup === 'ungrouped' ? '' : destGroup;

    try {
      await api.updateTarea(tareaId, { grupo: newGroup });
      loadProyecto();
      addToast('Tarea movida correctamente');
    } catch (error) {
      addToast(error.message, 'error');
      loadProyecto();
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  if (!proyecto) return null;

  const totalHoras = proyecto.tareas?.reduce((sum, t) => sum + (t.horas || 0), 0) || 0;
  const importeHoras = proyecto.tipo === 'horas' ? totalHoras * (proyecto.precio_hora || 0) : 0;

  // Group tasks
  const groups = {};
  const ungroupedTasks = [];

  proyecto.tareas?.forEach(tarea => {
    if (tarea.grupo) {
      if (!groups[tarea.grupo]) {
        groups[tarea.grupo] = [];
      }
      groups[tarea.grupo].push(tarea);
    } else {
      ungroupedTasks.push(tarea);
    }
  });

  // Add localGroups that don't have tasks yet
  localGroups.forEach(groupName => {
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
  });

  const allGroups = Object.keys(groups).sort();
  const existingGroups = [...new Set([
    ...(proyecto.tareas?.map(t => t.grupo).filter(Boolean) || []),
    ...localGroups
  ])];

  return (
    <>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-icon btn-secondary" onClick={() => navigate('/proyectos')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{proyecto.nombre}</h1>
            <p className="page-subtitle">{proyecto.cliente_empresa || proyecto.cliente_nombre}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
            <Pencil size={16} />
            Editar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/facturas/nueva?proyecto=${id}`)}
          >
            <FileText size={16} />
            Crear Factura
          </button>
        </div>
      </header>

      <div className="page-content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <h3 className="card-title">Tareas</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowGroupModal(true)}>
                    <Plus size={16} />
                    Nuevo Grupo
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => setShowTareaModal(true)}>
                    <Plus size={16} />
                    Nueva Tarea
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {proyecto.tareas?.length > 0 ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--gray-200)', background: 'var(--gray-50)' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, width: '40px' }}></th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, width: '35%' }}>Tarea</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, width: '15%' }}>Responsable</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, width: '15%' }}>Estado</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, width: '12%' }}>Fecha Fin</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, width: '10%' }}>Horas</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, width: '8%' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Ungrouped tasks */}
                          <Droppable droppableId="ungrouped" type="TASK">
                            {(provided) => (
                              <React.Fragment>
                                <tr ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'none' }} />
                                {ungroupedTasks.map((tarea, index) => (
                                  <Draggable key={tarea.id} draggableId={String(tarea.id)} index={index}>
                                    {(provided, snapshot) => (
                                      <tr
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        style={{
                                          ...provided.draggableProps.style,
                                          borderBottom: '1px solid var(--gray-100)',
                                          background: snapshot.isDragging ? 'var(--gray-50)' : 'white'
                                        }}
                                      >
                                        <td style={{ padding: '12px 16px', cursor: 'grab' }} {...provided.dragHandleProps}>
                                          <GripVertical size={16} color="var(--gray-400)" />
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                          <div style={{ fontWeight: 500 }}>{tarea.titulo}</div>
                                          {tarea.descripcion && (
                                            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{tarea.descripcion}</div>
                                          )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                          <select
                                            className="form-select"
                                            value={tarea.responsable || ''}
                                            onChange={(e) => updateTareaField(tarea, 'responsable', e.target.value)}
                                            style={{ fontSize: 13, padding: '6px 10px' }}
                                          >
                                            <option value="">Sin asignar</option>
                                            {usuarios.map(u => (
                                              <option key={u.id} value={u.nombre}>{u.nombre}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                          <select
                                            className="form-select"
                                            value={tarea.estado || 'pendiente'}
                                            onChange={(e) => updateTareaField(tarea, 'estado', e.target.value)}
                                            style={{
                                              fontSize: 13,
                                              padding: '6px 10px',
                                              background: tareaEstadoColors[tarea.estado || 'pendiente'],
                                              color: 'white',
                                              border: 'none',
                                              fontWeight: 500
                                            }}
                                          >
                                            {Object.entries(tareaEstadoLabels).map(([value, label]) => (
                                              <option key={value} value={value}>{label}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                          <input
                                            type="date"
                                            className="form-input"
                                            value={tarea.fecha_fin || ''}
                                            onChange={(e) => updateTareaField(tarea, 'fecha_fin', e.target.value)}
                                            style={{ fontSize: 13, padding: '6px 10px' }}
                                          />
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>
                                          {tarea.horas > 0 ? `${tarea.horas}h` : '-'}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                          <button
                                            className="btn btn-icon btn-sm btn-secondary"
                                            onClick={() => deleteTarea(tarea.id)}
                                            style={{ opacity: 0.6 }}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </td>
                                      </tr>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </React.Fragment>
                            )}
                          </Droppable>

                          {/* Grouped tasks */}
                          {allGroups.map(groupName => (
                            <React.Fragment key={groupName}>
                              <tr style={{ background: 'var(--gray-50)', borderTop: '2px solid var(--gray-200)' }}>
                                <td colSpan="7" style={{ padding: '10px 16px' }}>
                                  <button
                                    onClick={() => toggleGroup(groupName)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                      fontSize: 14,
                                      color: 'var(--gray-700)'
                                    }}
                                  >
                                    {collapsedGroups[groupName] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                    {groupName}
                                    <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 400 }}>
                                      ({groups[groupName].length} tareas)
                                    </span>
                                  </button>
                                </td>
                              </tr>
                              {!collapsedGroups[groupName] && (
                                <Droppable droppableId={groupName} type="TASK">
                                  {(provided) => (
                                    <React.Fragment>
                                      <tr ref={provided.innerRef} {...provided.droppableProps} style={{ display: 'none' }} />
                                      {groups[groupName].length === 0 && (
                                        <tr>
                                          <td colSpan="7" style={{ padding: '20px 40px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13, fontStyle: 'italic' }}>
                                            Arrastra tareas aqui para añadirlas al grupo
                                          </td>
                                        </tr>
                                      )}
                                      {groups[groupName].map((tarea, index) => (
                                        <Draggable key={tarea.id} draggableId={String(tarea.id)} index={index}>
                                          {(provided, snapshot) => (
                                            <tr
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              style={{
                                                ...provided.draggableProps.style,
                                                borderBottom: '1px solid var(--gray-100)',
                                                background: snapshot.isDragging ? 'var(--gray-50)' : 'white'
                                              }}
                                            >
                                              <td style={{ padding: '12px 16px', cursor: 'grab' }} {...provided.dragHandleProps}>
                                                <GripVertical size={16} color="var(--gray-400)" />
                                              </td>
                                              <td style={{ padding: '12px 16px', paddingLeft: 40 }}>
                                                <div style={{ fontWeight: 500 }}>{tarea.titulo}</div>
                                                {tarea.descripcion && (
                                                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{tarea.descripcion}</div>
                                                )}
                                              </td>
                                              <td style={{ padding: '12px 16px' }}>
                                                <select
                                                  className="form-select"
                                                  value={tarea.responsable || ''}
                                                  onChange={(e) => updateTareaField(tarea, 'responsable', e.target.value)}
                                                  style={{ fontSize: 13, padding: '6px 10px' }}
                                                >
                                                  <option value="">Sin asignar</option>
                                                  {usuarios.map(u => (
                                                    <option key={u.id} value={u.nombre}>{u.nombre}</option>
                                                  ))}
                                                </select>
                                              </td>
                                              <td style={{ padding: '12px 16px' }}>
                                                <select
                                                  className="form-select"
                                                  value={tarea.estado || 'pendiente'}
                                                  onChange={(e) => updateTareaField(tarea, 'estado', e.target.value)}
                                                  style={{
                                                    fontSize: 13,
                                                    padding: '6px 10px',
                                                    background: tareaEstadoColors[tarea.estado || 'pendiente'],
                                                    color: 'white',
                                                    border: 'none',
                                                    fontWeight: 500
                                                  }}
                                                >
                                                  {Object.entries(tareaEstadoLabels).map(([value, label]) => (
                                                    <option key={value} value={value}>{label}</option>
                                                  ))}
                                                </select>
                                              </td>
                                              <td style={{ padding: '12px 16px' }}>
                                                <input
                                                  type="date"
                                                  className="form-input"
                                                  value={tarea.fecha_fin || ''}
                                                  onChange={(e) => updateTareaField(tarea, 'fecha_fin', e.target.value)}
                                                  style={{ fontSize: 13, padding: '6px 10px' }}
                                                />
                                              </td>
                                              <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>
                                                {tarea.horas > 0 ? `${tarea.horas}h` : '-'}
                                              </td>
                                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <button
                                                  className="btn btn-icon btn-sm btn-secondary"
                                                  onClick={() => deleteTarea(tarea.id)}
                                                  style={{ opacity: 0.6 }}
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              </td>
                                            </tr>
                                          )}
                                        </Draggable>
                                      ))}
                                      {provided.placeholder}
                                    </React.Fragment>
                                  )}
                                </Droppable>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DragDropContext>
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
                    No hay tareas registradas
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Estado</div>
                  <select
                    className="form-select"
                    value={proyecto.estado}
                    onChange={async (e) => {
                      await api.updateProyecto(id, { ...editForm, estado: e.target.value });
                      loadProyecto();
                    }}
                  >
                    {Object.entries(estadoLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Tipo</div>
                  <div style={{ fontWeight: 500 }}>
                    {proyecto.tipo === 'proyecto' ? 'Proyecto Cerrado' : 'Bolsa de Horas'}
                  </div>
                </div>

                {proyecto.descripcion && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>Descripción</div>
                    <div style={{ fontSize: 14 }}>{proyecto.descripcion}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: user?.rol === 'admin' ? '1fr 1fr' : '1fr', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
                      <Clock size={14} />
                      Horas Registradas
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                      {totalHoras}h
                    </div>
                    {proyecto.horas_estimadas > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        de {proyecto.horas_estimadas}h estimadas
                      </div>
                    )}
                  </div>

                  {user?.rol === 'admin' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
                        <Euro size={14} />
                        {proyecto.tipo === 'proyecto' ? 'Presupuesto' : 'Importe'}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>
                        {proyecto.tipo === 'proyecto'
                          ? `${(proyecto.presupuesto || 0).toLocaleString('es-ES')} €`
                          : `${importeHoras.toLocaleString('es-ES')} €`
                        }
                      </div>
                      {proyecto.tipo === 'horas' && proyecto.precio_hora > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                          {proyecto.precio_hora} €/hora
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              className="btn btn-outline"
              style={{ width: '100%', marginTop: 16, color: 'var(--danger)' }}
              onClick={deleteProyecto}
            >
              <Trash2 size={16} />
              Eliminar Proyecto
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nueva Tarea */}
      <Modal
        isOpen={showTareaModal}
        onClose={() => setShowTareaModal(false)}
        title="Nueva Tarea"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowTareaModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleAddTarea}>Añadir Tarea</button>
          </>
        }
      >
        <form onSubmit={handleAddTarea}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              type="text"
              className="form-input"
              value={tareaForm.titulo}
              onChange={e => setTareaForm({ ...tareaForm, titulo: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              value={tareaForm.descripcion}
              onChange={e => setTareaForm({ ...tareaForm, descripcion: e.target.value })}
              rows={2}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Grupo</label>
            <select
              className="form-select"
              value={tareaForm.grupo}
              onChange={e => setTareaForm({ ...tareaForm, grupo: e.target.value })}
            >
              <option value="">Sin grupo</option>
              {existingGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Responsable</label>
            <select
              className="form-select"
              value={tareaForm.responsable}
              onChange={e => setTareaForm({ ...tareaForm, responsable: e.target.value })}
            >
              <option value="">Sin asignar</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.nombre}>{u.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={tareaForm.estado}
                onChange={e => setTareaForm({ ...tareaForm, estado: e.target.value })}
              >
                {Object.entries(tareaEstadoLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Horas</label>
              <input
                type="number"
                className="form-input"
                value={tareaForm.horas}
                onChange={e => setTareaForm({ ...tareaForm, horas: e.target.value })}
                min="0"
                step="0.5"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-input"
                value={tareaForm.fecha}
                onChange={e => setTareaForm({ ...tareaForm, fecha: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-input"
                value={tareaForm.fecha_fin}
                onChange={e => setTareaForm({ ...tareaForm, fecha_fin: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Nuevo Grupo */}
      <Modal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Nuevo Grupo"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowGroupModal(false)}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (newGroupName.trim()) {
                  const trimmedName = newGroupName.trim();
                  setLocalGroups(prev => {
                    if (prev.includes(trimmedName) || existingGroups.includes(trimmedName)) return prev;
                    return [...prev, trimmedName];
                  });
                  setShowGroupModal(false);
                  setNewGroupName('');
                  addToast(`Grupo "${trimmedName}" creado`);
                }
              }}
            >
              Crear Grupo
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Nombre del Grupo</label>
          <input
            type="text"
            className="form-input"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Ej: Diseño, Desarrollo, Testing..."
            autoFocus
          />
        </div>
      </Modal>

      {/* Modal Editar Proyecto */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Proyecto"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleUpdateProyecto}>Guardar Cambios</button>
          </>
        }
      >
        <form onSubmit={handleUpdateProyecto}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input
              type="text"
              className="form-input"
              value={editForm.nombre}
              onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              value={editForm.descripcion}
              onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })}
              rows={3}
            />
          </div>
          {user?.rol === 'admin' && (
            editForm.tipo === 'proyecto' ? (
              <div className="form-group">
                <label className="form-label">Presupuesto (€)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.presupuesto}
                  onChange={e => setEditForm({ ...editForm, presupuesto: e.target.value })}
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
                    value={editForm.precio_hora}
                    onChange={e => setEditForm({ ...editForm, precio_hora: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Horas Estimadas</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editForm.horas_estimadas}
                    onChange={e => setEditForm({ ...editForm, horas_estimadas: e.target.value })}
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
