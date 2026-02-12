import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Trello, Plus, Clock, User } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const ESTADOS = {
  nueva: { label: 'Nueva', color: '#94a3b8' },
  devuelta: { label: 'Devuelta', color: '#f59e0b' },
  trabajando: { label: 'Trabajando', color: '#3b82f6' },
  completada: { label: 'Completada', color: '#10b981' }
};

export default function Kanban() {
  const [proyectos, setProyectos] = useState([]);
  const [selectedProyecto, setSelectedProyecto] = useState('todos');
  const [tareasPorEstado, setTareasPorEstado] = useState({
    nueva: [],
    devuelta: [],
    trabajando: [],
    completada: []
  });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    organizarTareasPorEstado();
  }, [proyectos, selectedProyecto]);

  async function loadData() {
    try {
      const proyectosData = await api.getProyectos();
      // Fetch all tasks for all projects
      const proyectosConTareas = await Promise.all(
        proyectosData.map(async (proyecto) => {
          const detalles = await api.getProyecto(proyecto.id);
          return {
            ...proyecto,
            tareas: detalles.tareas || []
          };
        })
      );
      setProyectos(proyectosConTareas);
    } catch (error) {
      addToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }

  function organizarTareasPorEstado() {
    const organizadas = {
      nueva: [],
      devuelta: [],
      trabajando: [],
      completada: []
    };

    const todasLasTareas = proyectos.flatMap(p =>
      (p.tareas || []).map(t => ({
        ...t,
        proyecto_nombre: p.nombre,
        proyecto_id: p.id
      }))
    );

    const tareasFiltradas = selectedProyecto === 'todos'
      ? todasLasTareas
      : todasLasTareas.filter(t => t.proyecto_id === selectedProyecto);

    tareasFiltradas.forEach(tarea => {
      // Map old status to new Kanban status
      let estadoKanban = 'nueva';

      if (tarea.estado === 'completada') {
        estadoKanban = 'completada';
      } else if (tarea.estado === 'en_progreso') {
        estadoKanban = 'trabajando';
      } else if (tarea.estado === 'bloqueada') {
        estadoKanban = 'devuelta';
      } else {
        estadoKanban = 'nueva';
      }

      if (organizadas[estadoKanban]) {
        organizadas[estadoKanban].push(tarea);
      }
    });

    setTareasPorEstado(organizadas);
  }

  async function handleDragEnd(result) {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const nuevoEstadoKanban = destination.droppableId;

    // Find the task being moved
    const tareaMovida = tareasPorEstado[source.droppableId][source.index];
    if (!tareaMovida) return;

    // Map Kanban status back to backend status
    const estadoMap = {
      completada: 'completada',
      trabajando: 'en_progreso',
      devuelta: 'bloqueada',
      nueva: 'pendiente'
    };
    const nuevoEstado = estadoMap[nuevoEstadoKanban] || 'pendiente';

    // Optimistic update: move task in local state immediately
    const prevState = { ...tareasPorEstado };
    const sourceColumn = [...tareasPorEstado[source.droppableId]];
    const destColumn = source.droppableId === destination.droppableId
      ? sourceColumn
      : [...tareasPorEstado[destination.droppableId]];

    const [moved] = sourceColumn.splice(source.index, 1);
    destColumn.splice(destination.index, 0, { ...moved, estado: nuevoEstado });

    setTareasPorEstado({
      ...tareasPorEstado,
      [source.droppableId]: sourceColumn,
      ...(source.droppableId !== destination.droppableId && { [destination.droppableId]: destColumn })
    });

    // Persist to backend - only send changed fields (partial update)
    try {
      await api.updateTarea(tareaMovida.id, {
        estado: nuevoEstado,
        completada: nuevoEstado === 'completada' ? 1 : 0
      });
      addToast('Tarea actualizada');
    } catch (error) {
      // Revert optimistic update on failure
      setTareasPorEstado(prevState);
      addToast(error.message, 'error');
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Tablero Kanban</h1>
          <p className="page-subtitle">Gestión visual de tareas</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            className="form-select"
            value={selectedProyecto}
            onChange={e => setSelectedProyecto(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="todos">Todos los proyectos</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="page-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
            height: 'calc(100vh - 200px)'
          }}>
            {Object.entries(ESTADOS).map(([estadoKey, estadoConfig]) => (
              <div
                key={estadoKey}
                style={{
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '2px solid var(--gray-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: estadoConfig.color
                    }}></div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
                      {estadoConfig.label}
                    </h3>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--gray-500)',
                    background: 'var(--gray-200)',
                    padding: '2px 8px',
                    borderRadius: 12
                  }}>
                    {tareasPorEstado[estadoKey].length}
                  </span>
                </div>

                <Droppable droppableId={estadoKey}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        background: snapshot.isDraggingOver ? 'var(--gray-100)' : 'transparent',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background 0.2s',
                        padding: 4
                      }}
                    >
                      {tareasPorEstado[estadoKey].map((tarea, index) => (
                        <Draggable
                          key={tarea.id}
                          draggableId={String(tarea.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/proyectos/${tarea.proyecto_id}`)}
                              style={{
                                ...provided.draggableProps.style,
                                background: 'white',
                                borderRadius: 'var(--radius-md)',
                                padding: 12,
                                marginBottom: 8,
                                cursor: 'pointer',
                                border: '1px solid var(--gray-200)',
                                boxShadow: snapshot.isDragging
                                  ? '0 5px 15px rgba(0,0,0,0.15)'
                                  : '0 1px 3px rgba(0,0,0,0.05)',
                                transition: 'box-shadow 0.2s'
                              }}
                            >
                              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                                {tarea.titulo}
                              </div>

                              {tarea.descripcion && (
                                <div style={{
                                  fontSize: 12,
                                  color: 'var(--gray-600)',
                                  marginBottom: 8,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}>
                                  {tarea.descripcion}
                                </div>
                              )}

                              <div style={{
                                fontSize: 11,
                                color: 'var(--gray-500)',
                                marginBottom: 6
                              }}>
                                {tarea.proyecto_nombre}
                              </div>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 11,
                                color: 'var(--gray-500)',
                                marginTop: 8,
                                paddingTop: 8,
                                borderTop: '1px solid var(--gray-100)'
                              }}>
                                {tarea.responsable && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <User size={12} />
                                    {tarea.responsable}
                                  </div>
                                )}
                                {tarea.horas > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={12} />
                                    {tarea.horas}h
                                  </div>
                                )}
                              </div>

                              {tarea.fecha_fin && (
                                <div style={{
                                  fontSize: 11,
                                  color: 'var(--gray-500)',
                                  marginTop: 4
                                }}>
                                  📅 {format(new Date(tarea.fecha_fin), 'dd/MM/yyyy')}
                                </div>
                              )}

                              {tarea.grupo && (
                                <div style={{
                                  marginTop: 6,
                                  fontSize: 10,
                                  fontWeight: 500,
                                  color: estadoConfig.color,
                                  background: `${estadoConfig.color}15`,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  display: 'inline-block'
                                }}>
                                  {tarea.grupo}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {tareasPorEstado[estadoKey].length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: 40,
                          color: 'var(--gray-400)',
                          fontSize: 13
                        }}>
                          No hay tareas
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </>
  );
}
