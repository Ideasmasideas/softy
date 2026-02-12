import React, { useState, useEffect } from 'react';
import { Gantt as GanttChart, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { Calendar, Filter } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export default function Gantt() {
  const [ganttData, setGanttData] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(ViewMode.Week);
  const [filterEstado, setFilterEstado] = useState('todos');
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadGanttData();
  }, []);

  useEffect(() => {
    if (ganttData.length > 0) {
      buildGanttTasks();
    }
  }, [ganttData, filterEstado]);

  async function loadGanttData() {
    try {
      const data = await api.getGanttData();
      setGanttData(data);
    } catch (error) {
      addToast('Error al cargar datos del Gantt', 'error');
    } finally {
      setLoading(false);
    }
  }

  function buildGanttTasks() {
    const ganttTasks = [];

    ganttData.forEach(proyecto => {
      if (filterEstado !== 'todos' && proyecto.estado !== filterEstado) {
        return;
      }

      // Add project as a parent task if it has tasks with dates
      const tareasConFechas = proyecto.tareas.filter(t => t.fecha_inicio && t.fecha_fin);

      if (tareasConFechas.length > 0) {
        // Find earliest start and latest end
        const fechasInicio = tareasConFechas.map(t => new Date(t.fecha_inicio));
        const fechasFin = tareasConFechas.map(t => new Date(t.fecha_fin));
        const minFecha = new Date(Math.min(...fechasInicio));
        const maxFecha = new Date(Math.max(...fechasFin));

        ganttTasks.push({
          id: `proyecto-${proyecto.id}`,
          name: `${proyecto.nombre} (${proyecto.cliente})`,
          start: minFecha,
          end: maxFecha,
          progress: 0,
          type: 'project',
          hideChildren: false,
          styles: {
            backgroundColor: '#ff6b6b',
            backgroundSelectedColor: '#ff5252'
          }
        });

        // Group tasks by grupo
        const grupos = {};
        const sinGrupo = [];

        tareasConFechas.forEach(tarea => {
          if (tarea.grupo) {
            if (!grupos[tarea.grupo]) {
              grupos[tarea.grupo] = [];
            }
            grupos[tarea.grupo].push(tarea);
          } else {
            sinGrupo.push(tarea);
          }
        });

        // Add ungrouped tasks
        sinGrupo.forEach(tarea => {
          ganttTasks.push(createGanttTask(tarea, proyecto.id));
        });

        // Add grouped tasks
        Object.entries(grupos).forEach(([grupoNombre, tareas]) => {
          tareas.forEach(tarea => {
            ganttTasks.push({
              ...createGanttTask(tarea, proyecto.id),
              name: `[${grupoNombre}] ${tarea.titulo}`
            });
          });
        });
      }
    });

    setTasks(ganttTasks);
  }

  function createGanttTask(tarea, projectId) {
    const estadoColors = {
      pendiente: '#94a3b8',
      en_progreso: '#3b82f6',
      completada: '#10b981',
      bloqueada: '#ef4444'
    };

    return {
      id: `tarea-${tarea.id}`,
      name: tarea.titulo + (tarea.responsable ? ` (${tarea.responsable})` : ''),
      start: new Date(tarea.fecha_inicio),
      end: new Date(tarea.fecha_fin),
      progress: tarea.estado === 'completada' ? 100 : tarea.estado === 'en_progreso' ? 50 : 0,
      type: 'task',
      project: `proyecto-${projectId}`,
      styles: {
        backgroundColor: estadoColors[tarea.estado || 'pendiente'],
        backgroundSelectedColor: estadoColors[tarea.estado || 'pendiente']
      }
    };
  }

  function handleTaskClick(task) {
    if (task.type === 'project') {
      const projectId = task.id.replace('proyecto-', '');
      navigate(`/proyectos/${projectId}`);
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Diagrama de Gantt</h1>
          <p className="page-subtitle">Vista temporal de proyectos y tareas</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            className="form-select"
            value={filterEstado}
            onChange={e => {
              setFilterEstado(e.target.value);
              e.target.blur();
            }}
            style={{ width: 'auto' }}
          >
            <option value="todos">Todos los proyectos</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_progreso">En Progreso</option>
          </select>
          <div className="tabs">
            <button
              className={`tab ${viewMode === ViewMode.Day ? 'active' : ''}`}
              onClick={() => setViewMode(ViewMode.Day)}
            >
              Día
            </button>
            <button
              className={`tab ${viewMode === ViewMode.Week ? 'active' : ''}`}
              onClick={() => setViewMode(ViewMode.Week)}
            >
              Semana
            </button>
            <button
              className={`tab ${viewMode === ViewMode.Month ? 'active' : ''}`}
              onClick={() => setViewMode(ViewMode.Month)}
            >
              Mes
            </button>
          </div>
        </div>
      </header>

      <div className="page-content">
        {tasks.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">
                <Calendar size={40} />
              </div>
              <h3 className="empty-state-title">No hay tareas con fechas</h3>
              <p className="empty-state-text">
                Las tareas deben tener fecha de inicio y fecha de fin para aparecer en el diagrama de Gantt
              </p>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 20 }}>
            <div style={{
              marginBottom: 20,
              padding: 12,
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13
            }}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>Leyenda de colores:</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 16, background: '#94a3b8', borderRadius: 3 }}></div>
                  <span>Pendiente</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 16, background: '#3b82f6', borderRadius: 3 }}></div>
                  <span>En Progreso</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 16, background: '#10b981', borderRadius: 3 }}></div>
                  <span>Completada</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 16, background: '#ef4444', borderRadius: 3 }}></div>
                  <span>Bloqueada</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 16, height: 16, background: '#ff6b6b', borderRadius: 3 }}></div>
                  <span>Proyecto</span>
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <GanttChart
                tasks={tasks}
                viewMode={viewMode}
                locale="es"
                listCellWidth="200px"
                columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 250 : 60}
                rowHeight={35}
                barCornerRadius={3}
                onClick={handleTaskClick}
                todayColor="rgba(255, 107, 107, 0.1)"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
