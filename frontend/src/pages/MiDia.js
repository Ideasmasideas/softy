import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Brain, Plus, Check, Calendar, Pin, AlertTriangle, Sparkles,
  ChevronDown, ChevronUp, Trash2, Edit3, RotateCcw, X,
  Flame, Clock, Zap, Archive, Search, Tag
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CUADRANTES = {
  hacer_ahora: { label: 'Hacer Ahora', color: '#ef4444', icon: Flame, desc: 'Urgente e importante' },
  programar:   { label: 'Programar',   color: '#3b82f6', icon: Clock, desc: 'Importante, no urgente' },
  rapido:      { label: 'Rapido',      color: '#f59e0b', icon: Zap,   desc: 'Urgente, rapido' },
  algun_dia:   { label: 'Algun Dia',   color: '#6b7280', icon: Archive, desc: 'Algun dia/quizas' }
};

const CATEGORIAS = {
  negocio:  { label: 'Negocio',  color: '#3b82f6' },
  fiscal:   { label: 'Fiscal',   color: '#ef4444' },
  cliente:  { label: 'Cliente',  color: '#10b981' },
  personal: { label: 'Personal', color: '#8b5cf6' }
};

const RECURRENCIAS = {
  ninguna: 'Sin recurrencia',
  diario: 'Diario',
  semanal: 'Semanal',
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual'
};

export default function MiDia() {
  const [activeTab, setActiveTab] = useState('hoy');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [quickCuadrante, setQuickCuadrante] = useState('hacer_ahora');
  const [briefing, setBriefing] = useState(null);
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCuadrante, setFilterCuadrante] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [proyectos, setProyectos] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    api.getProyectos().then(setProyectos).catch(() => {});
  }, []);

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      let data;
      if (activeTab === 'hoy') {
        data = await api.getRecordatoriosHoy();
        if (!briefing) {
          try {
            const { briefing: text } = await api.getBriefing();
            setBriefing(text);
          } catch { /* AI not critical */ }
        }
      } else if (activeTab === 'matriz') {
        data = await api.getRecordatoriosMatriz();
      } else {
        data = await api.getRecordatorios();
      }
      setItems(data);
    } catch (error) {
      addToast('Error al cargar recordatorios', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickCapture(e) {
    if (e.key !== 'Enter' || !quickInput.trim()) return;
    try {
      await api.createRecordatorio({
        titulo: quickInput.trim(),
        cuadrante: quickCuadrante,
        fecha_vencimiento: new Date().toISOString().split('T')[0],
        categoria: 'negocio'
      });
      setQuickInput('');
      addToast('Recordatorio creado');
      loadData(false);
    } catch (error) {
      addToast('Error al crear recordatorio', 'error');
    }
  }

  async function handleToggle(id) {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completada: item.completada ? 0 : 1 } : item
    ));
    try {
      await api.toggleRecordatorio(id);
      addToast('Actualizado');
      setTimeout(() => loadData(false), 500);
    } catch (error) {
      loadData(false);
      addToast('Error al actualizar', 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Eliminar este recordatorio?')) return;
    try {
      await api.deleteRecordatorio(id);
      addToast('Eliminado');
      loadData(false);
    } catch (error) {
      addToast('Error al eliminar', 'error');
    }
  }

  async function handleSaveEdit() {
    if (!editingItem) return;
    try {
      await api.updateRecordatorio(editingItem.id, {
        titulo: editingItem.titulo,
        descripcion: editingItem.descripcion,
        cuadrante: editingItem.cuadrante,
        fecha_vencimiento: editingItem.fecha_vencimiento || null,
        categoria: editingItem.categoria,
        recurrente: editingItem.recurrente,
        fijado: editingItem.fijado,
        proyecto_id: editingItem.proyecto_id,
        notas: editingItem.notas
      });
      setEditingItem(null);
      addToast('Recordatorio actualizado');
      loadData(false);
    } catch (error) {
      addToast('Error al guardar', 'error');
    }
  }

  async function handleMatrizDragEnd(result) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newCuadrante = destination.droppableId;
    const sourceItems = items.filter(i => i.cuadrante === source.droppableId);
    const movedItem = sourceItems[source.index];
    if (!movedItem) return;

    const prevItems = [...items];
    setItems(prev => prev.map(i =>
      i.id === movedItem.id ? { ...i, cuadrante: newCuadrante } : i
    ));

    try {
      await api.updateRecordatorioCuadrante(movedItem.id, newCuadrante);
      addToast(`Movido a ${CUADRANTES[newCuadrante].label}`);
    } catch (error) {
      setItems(prevItems);
      addToast('Error al mover', 'error');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return format(d, 'dd MMM', { locale: es });
    } catch {
      return dateStr;
    }
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  }

  // Filter items for "Todos" tab
  const filteredItems = activeTab === 'todos'
    ? items.filter(item => {
        if (searchTerm && !item.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterCuadrante && item.cuadrante !== filterCuadrante) return false;
        if (filterCategoria && item.categoria !== filterCategoria) return false;
        return true;
      })
    : items;

  const pendingItems = filteredItems.filter(i => !i.completada);
  const completedItems = filteredItems.filter(i => i.completada);

  // Render a single recordatorio item
  function renderItem(item, opts = {}) {
    const { showSection = false, compact = false } = opts;
    const cuadranteConfig = CUADRANTES[item.cuadrante] || CUADRANTES.hacer_ahora;
    const categoriaConfig = CATEGORIAS[item.categoria] || CATEGORIAS.negocio;
    const CuadranteIcon = cuadranteConfig.icon;
    const overdue = isOverdue(item.fecha_vencimiento) && !item.completada;

    return (
      <div
        key={item.id}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: compact ? '8px 10px' : '12px 16px',
          background: item.completada ? 'var(--gray-50)' : 'white',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${overdue ? '#fecaca' : 'var(--gray-200)'}`,
          borderLeft: `3px solid ${overdue ? '#ef4444' : cuadranteConfig.color}`,
          marginBottom: 6,
          opacity: item.completada ? 0.6 : 1,
          transition: 'all 0.2s'
        }}
      >
        {/* Checkbox */}
        <button
          onClick={() => handleToggle(item.id)}
          style={{
            width: 22, height: 22, borderRadius: '50%',
            border: `2px solid ${item.completada ? '#10b981' : cuadranteConfig.color}`,
            background: item.completada ? '#10b981' : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: 1, transition: 'all 0.2s'
          }}
        >
          {item.completada && <Check size={14} color="white" />}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 500,
            textDecoration: item.completada ? 'line-through' : 'none',
            color: item.completada ? 'var(--gray-400)' : 'var(--gray-800)',
            marginBottom: 4
          }}>
            {item.titulo}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
              background: `${categoriaConfig.color}15`, color: categoriaConfig.color
            }}>
              {categoriaConfig.label}
            </span>
            <span style={{
              fontSize: 10, display: 'flex', alignItems: 'center', gap: 2,
              color: cuadranteConfig.color
            }}>
              <CuadranteIcon size={10} /> {cuadranteConfig.label}
            </span>
            {item.fecha_vencimiento && (
              <span style={{
                fontSize: 10, display: 'flex', alignItems: 'center', gap: 2,
                color: overdue ? '#ef4444' : 'var(--gray-500)',
                fontWeight: overdue ? 600 : 400
              }}>
                <Calendar size={10} /> {formatDate(item.fecha_vencimiento)}
              </span>
            )}
            {item.fijado ? <Pin size={10} color="#f59e0b" /> : null}
            {item.recurrente && item.recurrente !== 'ninguna' && (
              <RotateCcw size={10} color="var(--gray-400)" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => setEditingItem({ ...item })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)' }}>
            <Edit3 size={14} />
          </button>
          <button onClick={() => handleDelete(item.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-400)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Mi Dia</h1>
          <p className="page-subtitle">Tu cerebro externo - captura, organiza y actua</p>
        </div>
      </header>

      <div className="page-content">
        {/* Quick Capture Bar */}
        <div style={{
          display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Plus size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--gray-400)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Captura rapida: escribe y pulsa Enter..."
              value={quickInput}
              onChange={e => setQuickInput(e.target.value)}
              onKeyDown={handleQuickCapture}
              style={{ paddingLeft: 38, fontSize: 15 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(CUADRANTES).map(([key, q]) => {
              const Icon = q.icon;
              return (
                <button key={key}
                  onClick={() => setQuickCuadrante(key)}
                  title={q.label}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: quickCuadrante === key ? q.color : 'var(--gray-100)',
                    color: quickCuadrante === key ? 'white' : 'var(--gray-500)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}>
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--gray-200)' }}>
          {[
            { key: 'hoy', label: 'Hoy', icon: Flame },
            { key: 'matriz', label: 'Matriz', icon: Brain },
            { key: 'todos', label: 'Todos', icon: Tag }
          ].map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primary)' : 'var(--gray-500)',
                  background: 'transparent',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -2,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s'
                }}>
                <TabIcon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB: Hoy */}
        {activeTab === 'hoy' && (
          <>
            {/* AI Briefing */}
            {briefing && (
              <div className="card" style={{
                marginBottom: 20, border: '1px solid #e0e7ff', background: '#f5f3ff'
              }}>
                <div style={{ padding: 16 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: briefingOpen ? 8 : 0
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={18} color="#8b5cf6" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#6d28d9' }}>Briefing IA</span>
                    </div>
                    <button onClick={() => setBriefingOpen(!briefingOpen)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d28d9' }}>
                      {briefingOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  {briefingOpen && (
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', paddingLeft: 26 }}>
                      {briefing}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sections */}
            {['vencido', 'hoy', 'fijado'].map(seccion => {
              const seccionItems = items.filter(i => i.seccion === seccion && !i.completada);
              if (seccionItems.length === 0) return null;

              const config = {
                vencido: { label: 'Vencidos', color: '#ef4444', icon: AlertTriangle },
                hoy: { label: 'Hoy', color: '#3b82f6', icon: Calendar },
                fijado: { label: 'Fijados', color: '#f59e0b', icon: Pin }
              }[seccion];

              const SIcon = config.icon;
              return (
                <div key={seccion} style={{ marginBottom: 20 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10
                  }}>
                    <SIcon size={16} color={config.color} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: config.color }}>
                      {config.label}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--gray-500)',
                      background: 'var(--gray-200)', padding: '1px 8px', borderRadius: 10
                    }}>
                      {seccionItems.length}
                    </span>
                  </div>
                  {seccionItems.map(item => renderItem(item))}
                </div>
              );
            })}

            {items.filter(i => !i.completada).length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
                <Brain size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Tu mente esta clara</div>
                <div style={{ fontSize: 13 }}>No hay pendientes para hoy. Usa la barra de captura para anadir.</div>
              </div>
            )}
          </>
        )}

        {/* TAB: Matriz (Eisenhower) */}
        {activeTab === 'matriz' && (
          <DragDropContext onDragEnd={handleMatrizDragEnd}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: 16,
              height: 'calc(100vh - 320px)'
            }}>
              {Object.entries(CUADRANTES).map(([key, config]) => {
                const quadrantItems = items.filter(i => i.cuadrante === key);
                const QIcon = config.icon;
                return (
                  <div key={key} style={{
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: `3px solid ${config.color}`
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                      paddingBottom: 8, borderBottom: '1px solid var(--gray-200)'
                    }}>
                      <QIcon size={16} style={{ color: config.color }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{config.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>{config.desc}</div>
                      </div>
                      <span style={{
                        marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                        color: 'var(--gray-500)', background: 'var(--gray-200)',
                        padding: '1px 8px', borderRadius: 10
                      }}>
                        {quadrantItems.length}
                      </span>
                    </div>

                    <Droppable droppableId={key}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            flex: 1, overflowY: 'auto',
                            background: snapshot.isDraggingOver ? `${config.color}10` : 'transparent',
                            borderRadius: 'var(--radius-md)',
                            padding: 4, transition: 'background 0.2s'
                          }}
                        >
                          {quadrantItems.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    background: 'white',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    marginBottom: 6,
                                    border: '1px solid var(--gray-200)',
                                    boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.15)' : 'none'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                    <button
                                      onClick={() => handleToggle(item.id)}
                                      style={{
                                        width: 18, height: 18, borderRadius: '50%',
                                        border: `2px solid ${config.color}`,
                                        background: 'transparent',
                                        cursor: 'pointer', flexShrink: 0, marginTop: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                      }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                                        {item.titulo}
                                      </div>
                                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={{
                                          fontSize: 9, fontWeight: 600, padding: '0px 5px', borderRadius: 3,
                                          background: `${CATEGORIAS[item.categoria]?.color || '#6b7280'}15`,
                                          color: CATEGORIAS[item.categoria]?.color || '#6b7280'
                                        }}>
                                          {CATEGORIAS[item.categoria]?.label || item.categoria}
                                        </span>
                                        {item.fecha_vencimiento && (
                                          <span style={{
                                            fontSize: 10,
                                            color: isOverdue(item.fecha_vencimiento) ? '#ef4444' : 'var(--gray-500)'
                                          }}>
                                            {formatDate(item.fecha_vencimiento)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button onClick={() => setEditingItem({ ...item })}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--gray-400)' }}>
                                      <Edit3 size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {quadrantItems.length === 0 && (
                            <div style={{
                              textAlign: 'center', padding: 30,
                              color: 'var(--gray-400)', fontSize: 12
                            }}>
                              Arrastra aqui
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {/* TAB: Todos */}
        {activeTab === 'todos' && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--gray-400)' }} />
                <input className="form-input" placeholder="Buscar..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 36 }} />
              </div>
              <select className="form-select" value={filterCuadrante}
                onChange={e => setFilterCuadrante(e.target.value)} style={{ width: 'auto' }}>
                <option value="">Todos los cuadrantes</option>
                {Object.entries(CUADRANTES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="form-select" value={filterCategoria}
                onChange={e => setFilterCategoria(e.target.value)} style={{ width: 'auto' }}>
                <option value="">Todas las categorias</option>
                {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            {/* Pending items */}
            {pendingItems.map(item => renderItem(item))}

            {pendingItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)', fontSize: 13 }}>
                No hay recordatorios pendientes
              </div>
            )}

            {/* Completed items (collapsible) */}
            {completedItems.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <button onClick={() => setShowCompleted(!showCompleted)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, color: 'var(--gray-500)',
                    padding: '8px 0'
                  }}>
                  {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Completados ({completedItems.length})
                </button>
                {showCompleted && completedItems.map(item => renderItem(item, { compact: true }))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar Recordatorio"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setEditingItem(null)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveEdit}>Guardar</button>
          </div>
        }
      >
        {editingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Titulo *</label>
              <input type="text" className="form-input"
                value={editingItem.titulo}
                onChange={e => setEditingItem({ ...editingItem, titulo: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Descripcion</label>
              <textarea className="form-textarea" rows={2}
                value={editingItem.descripcion || ''}
                onChange={e => setEditingItem({ ...editingItem, descripcion: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cuadrante</label>
                <select className="form-select" value={editingItem.cuadrante}
                  onChange={e => setEditingItem({ ...editingItem, cuadrante: e.target.value })}>
                  {Object.entries(CUADRANTES).map(([k, v]) =>
                    <option key={k} value={k}>{v.label}</option>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select className="form-select" value={editingItem.categoria}
                  onChange={e => setEditingItem({ ...editingItem, categoria: e.target.value })}>
                  {Object.entries(CATEGORIAS).map(([k, v]) =>
                    <option key={k} value={k}>{v.label}</option>
                  )}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha vencimiento</label>
                <input type="date" className="form-input"
                  value={editingItem.fecha_vencimiento ? editingItem.fecha_vencimiento.split('T')[0] : ''}
                  onChange={e => setEditingItem({ ...editingItem, fecha_vencimiento: e.target.value || null })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Recurrencia</label>
                <select className="form-select" value={editingItem.recurrente}
                  onChange={e => setEditingItem({ ...editingItem, recurrente: e.target.value })}>
                  {Object.entries(RECURRENCIAS).map(([k, v]) =>
                    <option key={k} value={k}>{v}</option>
                  )}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Proyecto (opcional)</label>
              <select className="form-select" value={editingItem.proyecto_id || ''}
                onChange={e => setEditingItem({ ...editingItem, proyecto_id: e.target.value || null })}>
                <option value="">Sin proyecto</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notas</label>
              <textarea className="form-textarea" rows={2}
                value={editingItem.notas || ''}
                onChange={e => setEditingItem({ ...editingItem, notas: e.target.value })}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox"
                checked={!!editingItem.fijado}
                onChange={e => setEditingItem({ ...editingItem, fijado: e.target.checked ? 1 : 0 })}
              />
              Fijar (siempre visible en "Hoy")
            </label>
          </div>
        )}
      </Modal>
    </>
  );
}
