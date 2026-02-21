import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Mail, Search, RefreshCw, LogOut, Sparkles, CheckCircle, AlertCircle,
  ChevronRight, Clock, User, FolderKanban, Plus, Loader, X, ArrowLeft
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function BandejaEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Connection state
  const [gmailStatus, setGmailStatus] = useState({ connected: false, email: null });
  const [loading, setLoading] = useState(true);

  // Email list
  const [emails, setEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected email
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailDetail, setEmailDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // AI processing
  const [aiResult, setAiResult] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Task creation
  const [editableTareas, setEditableTareas] = useState([]);
  const [selectedProyecto, setSelectedProyecto] = useState('');
  const [proyectos, setProyectos] = useState([]);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [tasksCreated, setTasksCreated] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      addToast('Gmail conectado correctamente', 'success');
      checkStatus();
    } else if (searchParams.get('error')) {
      addToast('Error al conectar Gmail', 'error');
    }
  }, [searchParams]);

  async function checkStatus() {
    try {
      setLoading(true);
      const status = await api.getGmailStatus();
      setGmailStatus(status);
      if (status.connected) {
        loadEmails();
        loadProyectos();
      }
    } catch {
      setGmailStatus({ connected: false, email: null });
    } finally {
      setLoading(false);
    }
  }

  async function loadProyectos() {
    try {
      const data = await api.getProyectos();
      setProyectos(data.filter(p => p.estado !== 'completado'));
    } catch {}
  }

  async function connectGmail() {
    try {
      const { url } = await api.getGmailAuthUrl();
      window.location.href = url;
    } catch {
      addToast('Error al iniciar conexion con Gmail', 'error');
    }
  }

  async function disconnectGmail() {
    if (!window.confirm('¿Desconectar Gmail?')) return;
    try {
      await api.disconnectGmail();
      setGmailStatus({ connected: false, email: null });
      setEmails([]);
      setSelectedEmail(null);
      setEmailDetail(null);
      setAiResult(null);
      addToast('Gmail desconectado', 'success');
    } catch {
      addToast('Error al desconectar', 'error');
    }
  }

  const loadEmails = useCallback(async (query) => {
    try {
      setLoadingEmails(true);
      const data = await api.getGmailEmails(20, query || '');
      setEmails(data);
    } catch (err) {
      if (err.message?.includes('no conectado')) {
        setGmailStatus({ connected: false, email: null });
      } else {
        addToast('Error al cargar emails', 'error');
      }
    } finally {
      setLoadingEmails(false);
    }
  }, [addToast]);

  function handleSearch(e) {
    e.preventDefault();
    loadEmails(searchQuery);
  }

  async function selectEmail(email) {
    setSelectedEmail(email);
    setAiResult(null);
    setTasksCreated(null);
    setEditableTareas([]);
    setSelectedProyecto('');

    try {
      setLoadingDetail(true);
      const detail = await api.getGmailEmail(email.id);
      setEmailDetail(detail);
    } catch {
      addToast('Error al cargar email', 'error');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function processWithAI() {
    if (!selectedEmail) return;
    try {
      setLoadingAI(true);
      const result = await api.procesarEmail(selectedEmail.id);
      setAiResult(result);
      setEditableTareas(result.tareas || []);
      if (result.proyecto_sugerido?.id) {
        setSelectedProyecto(result.proyecto_sugerido.id);
      }
    } catch {
      addToast('Error al procesar con IA', 'error');
    } finally {
      setLoadingAI(false);
    }
  }

  function updateTarea(index, field, value) {
    setEditableTareas(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeTarea(index) {
    setEditableTareas(prev => prev.filter((_, i) => i !== index));
  }

  async function createTasks() {
    if (!selectedProyecto || editableTareas.length === 0) {
      addToast('Selecciona un proyecto y al menos una tarea', 'error');
      return;
    }
    try {
      setCreatingTasks(true);
      const result = await api.crearTareasDesdeEmail(selectedEmail.id, {
        proyecto_id: selectedProyecto,
        tareas: editableTareas
      });
      setTasksCreated(result);
      addToast(`${result.tareas_creadas} tareas creadas en ${result.proyecto_nombre}`, 'success');
    } catch {
      addToast('Error al crear tareas', 'error');
    } finally {
      setCreatingTasks(false);
    }
  }

  function resetPanel() {
    setSelectedEmail(null);
    setEmailDetail(null);
    setAiResult(null);
    setTasksCreated(null);
    setEditableTareas([]);
    setSelectedProyecto('');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }

  function extractName(from) {
    if (!from) return '';
    const match = from.match(/^"?([^"<]*)"?\s*</);
    return match ? match[1].trim() : from.split('@')[0];
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Loader className="spin" size={32} />
      </div>
    );
  }

  // Not connected
  if (!gmailStatus.connected) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Bandeja de Email</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: 4 }}>Conecta tu cuenta de Gmail para ver emails y convertirlos en tareas</p>
        </div>

        <div style={{
          maxWidth: 480, margin: '80px auto', textAlign: 'center',
          background: 'white', borderRadius: 'var(--radius-lg)', padding: 48,
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <Mail size={28} style={{ color: 'var(--primary-600)' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Conecta tu Gmail</h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: 24, lineHeight: 1.6 }}>
            Accede a tus emails directamente desde la app. La IA analizara los mensajes
            de tus clientes y te sugerira tareas para tus proyectos.
          </p>
          <button onClick={connectGmail} className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
            <Mail size={18} />
            Conectar Gmail
          </button>
        </div>
      </div>
    );
  }

  // Connected - main view
  return (
    <div style={{ padding: 32, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>Bandeja de Email</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            {gmailStatus.email}
          </p>
        </div>
        <button onClick={disconnectGmail} className="btn" style={{ color: 'var(--gray-500)', gap: 6 }}>
          <LogOut size={16} />
          Desconectar
        </button>
      </div>

      {/* Two column layout */}
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
        {/* Left - Email list */}
        <div style={{
          width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', overflow: 'hidden'
        }}>
          {/* Search bar */}
          <div style={{ padding: 12, borderBottom: '1px solid var(--gray-100)' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar emails..."
                  style={{
                    width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-md)', fontSize: 13, background: 'var(--gray-50)'
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => loadEmails(searchQuery)}
                className="btn"
                style={{ padding: '8px 10px' }}
                title="Refrescar"
              >
                <RefreshCw size={16} className={loadingEmails ? 'spin' : ''} />
              </button>
            </form>
          </div>

          {/* Email list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingEmails && emails.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>
                <Loader className="spin" size={24} />
                <p style={{ marginTop: 8, fontSize: 13 }}>Cargando emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--gray-400)' }}>
                <Mail size={24} />
                <p style={{ marginTop: 8, fontSize: 13 }}>No se encontraron emails</p>
              </div>
            ) : (
              emails.map(email => (
                <div
                  key={email.id}
                  onClick={() => selectEmail(email)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--gray-50)',
                    background: selectedEmail?.id === email.id ? 'var(--primary-50)' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => { if (selectedEmail?.id !== email.id) e.currentTarget.style.background = 'var(--gray-50)'; }}
                  onMouseLeave={e => { if (selectedEmail?.id !== email.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-900)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {extractName(email.from)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--gray-400)', flexShrink: 0, marginLeft: 8 }}>
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.subject || '(Sin asunto)'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.snippet}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right - Detail panel */}
        <div style={{
          flex: 1, background: 'white', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-200)', overflow: 'auto', display: 'flex', flexDirection: 'column'
        }}>
          {!selectedEmail ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
              <div style={{ textAlign: 'center' }}>
                <Mail size={40} />
                <p style={{ marginTop: 12, fontSize: 14 }}>Selecciona un email para ver su contenido</p>
              </div>
            </div>
          ) : tasksCreated ? (
            /* Tasks created confirmation */
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '40px auto 20px'
              }}>
                <CheckCircle size={32} style={{ color: '#16a34a' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Tareas creadas</h3>
              <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
                Se han creado {tasksCreated.tareas_creadas} tareas en el proyecto <strong>{tasksCreated.proyecto_nombre}</strong>
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => navigate(`/proyectos/${tasksCreated.proyecto_id}`)}
                  className="btn btn-primary"
                >
                  <FolderKanban size={16} />
                  Ver proyecto
                </button>
                <button onClick={resetPanel} className="btn">
                  <ArrowLeft size={16} />
                  Volver
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
              {/* Email header */}
              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                  <Loader className="spin" size={24} />
                  <p style={{ marginTop: 8, fontSize: 13 }}>Cargando email...</p>
                </div>
              ) : emailDetail && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--gray-900)', marginBottom: 12 }}>
                      {emailDetail.subject || '(Sin asunto)'}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--gray-500)', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={14} />
                        <strong>{emailDetail.fromName}</strong> &lt;{emailDetail.fromEmail}&gt;
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} />
                        {formatDate(emailDetail.date)}
                      </div>
                    </div>
                  </div>

                  {/* Email body */}
                  <div style={{
                    padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)',
                    fontSize: 13, lineHeight: 1.7, color: 'var(--gray-700)', marginBottom: 20,
                    maxHeight: aiResult ? 200 : 400, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                  }}>
                    {emailDetail.body || emailDetail.snippet}
                  </div>

                  {/* AI Process button */}
                  {!aiResult && !loadingAI && (
                    <button onClick={processWithAI} className="btn btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
                      <Sparkles size={18} />
                      Procesar con IA
                    </button>
                  )}

                  {loadingAI && (
                    <div style={{
                      padding: 24, textAlign: 'center', background: 'var(--primary-50)',
                      borderRadius: 'var(--radius-md)', color: 'var(--primary-700)'
                    }}>
                      <Loader className="spin" size={24} />
                      <p style={{ marginTop: 8, fontSize: 13 }}>Analizando email con IA...</p>
                    </div>
                  )}

                  {/* AI Results */}
                  {aiResult && (
                    <div>
                      {/* Client match */}
                      <div style={{
                        padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 16,
                        background: aiResult.cliente_match?.confianza === 'alta' ? '#dcfce7' :
                                   aiResult.cliente_match?.confianza === 'media' ? '#fef9c3' : 'var(--gray-50)',
                        border: `1px solid ${aiResult.cliente_match?.confianza === 'alta' ? '#bbf7d0' :
                                             aiResult.cliente_match?.confianza === 'media' ? '#fde68a' : 'var(--gray-200)'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {aiResult.cliente_match?.id ? (
                            <CheckCircle size={16} style={{ color: '#16a34a' }} />
                          ) : (
                            <AlertCircle size={16} style={{ color: '#d97706' }} />
                          )}
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            Cliente: {aiResult.cliente_match?.nombre || 'No identificado'}
                          </span>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 12,
                            background: aiResult.cliente_match?.confianza === 'alta' ? '#16a34a' :
                                        aiResult.cliente_match?.confianza === 'media' ? '#d97706' : 'var(--gray-400)',
                            color: 'white'
                          }}>
                            {aiResult.cliente_match?.confianza || 'ninguna'}
                          </span>
                        </div>
                      </div>

                      {/* Summary */}
                      <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 13, lineHeight: 1.6, color: 'var(--gray-700)' }}>
                        <strong>Resumen:</strong> {aiResult.resumen}
                      </div>

                      {/* Suggested tasks - editable */}
                      <div style={{ marginBottom: 16 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={16} style={{ color: 'var(--primary-600)' }} />
                          Tareas sugeridas ({editableTareas.length})
                        </h4>

                        {editableTareas.map((tarea, i) => (
                          <div key={i} style={{
                            padding: 12, border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)',
                            marginBottom: 8, background: 'white'
                          }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                              <input
                                type="text"
                                value={tarea.titulo}
                                onChange={e => updateTarea(i, 'titulo', e.target.value)}
                                style={{
                                  flex: 1, padding: '6px 10px', border: '1px solid var(--gray-200)',
                                  borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500
                                }}
                              />
                              <button onClick={() => removeTarea(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: 4 }}>
                                <X size={16} />
                              </button>
                            </div>
                            <textarea
                              value={tarea.descripcion}
                              onChange={e => updateTarea(i, 'descripcion', e.target.value)}
                              rows={2}
                              style={{
                                width: '100%', padding: '6px 10px', border: '1px solid var(--gray-200)',
                                borderRadius: 'var(--radius-sm)', fontSize: 12, resize: 'vertical', marginBottom: 8
                              }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>Horas</label>
                                <input
                                  type="number"
                                  value={tarea.horas_estimadas}
                                  onChange={e => updateTarea(i, 'horas_estimadas', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.5"
                                  style={{
                                    width: '100%', padding: '4px 8px', border: '1px solid var(--gray-200)',
                                    borderRadius: 'var(--radius-sm)', fontSize: 12
                                  }}
                                />
                              </div>
                              <div style={{ flex: 2 }}>
                                <label style={{ fontSize: 11, color: 'var(--gray-500)' }}>Grupo/Fase</label>
                                <input
                                  type="text"
                                  value={tarea.grupo}
                                  onChange={e => updateTarea(i, 'grupo', e.target.value)}
                                  style={{
                                    width: '100%', padding: '4px 8px', border: '1px solid var(--gray-200)',
                                    borderRadius: 'var(--radius-sm)', fontSize: 12
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Project selector + create */}
                      <div style={{
                        padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--gray-200)'
                      }}>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                          <FolderKanban size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                          Proyecto destino
                        </label>
                        <select
                          value={selectedProyecto}
                          onChange={e => setSelectedProyecto(e.target.value)}
                          style={{
                            width: '100%', padding: '8px 12px', border: '1px solid var(--gray-200)',
                            borderRadius: 'var(--radius-md)', fontSize: 13, background: 'white', marginBottom: 12
                          }}
                        >
                          <option value="">Seleccionar proyecto...</option>
                          {proyectos.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} {p.cliente_nombre ? `(${p.cliente_nombre})` : ''}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={createTasks}
                          disabled={!selectedProyecto || editableTareas.length === 0 || creatingTasks}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '10px', justifyContent: 'center', fontSize: 14 }}
                        >
                          {creatingTasks ? (
                            <>
                              <Loader className="spin" size={16} />
                              Creando...
                            </>
                          ) : (
                            <>
                              <Plus size={16} />
                              Crear {editableTareas.length} tarea{editableTareas.length !== 1 ? 's' : ''} en proyecto
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
