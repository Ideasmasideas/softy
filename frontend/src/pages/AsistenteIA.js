import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, CheckCircle, XCircle, FolderKanban, ListChecks, Receipt, Brain } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const suggestedQuestions = [
  '¿Cuánto he facturado este trimestre?',
  '¿Cuáles son mis principales clientes?',
  'Crea un proyecto para el cliente X con tareas...',
  '¿Cuántos proyectos tengo activos?'
];

const actionIcons = {
  create_proyecto: FolderKanban,
  create_tarea: ListChecks,
  create_gasto: Receipt,
  create_recordatorio: Brain
};

const actionLabels = {
  create_proyecto: 'Proyecto creado',
  create_tarea: 'Tarea creada',
  create_gasto: 'Gasto creado',
  create_recordatorio: 'Recordatorio creado'
};

export default function AsistenteIA() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { addToast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send last 10 pairs of messages as history
      const history = [...messages].slice(-20);
      const { respuesta, actions } = await api.aiChat({ message: msg, history });
      setMessages(prev => [...prev, { role: 'assistant', content: respuesta, actions }]);
    } catch (error) {
      addToast('Error al consultar el asistente IA', 'error');
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error al procesar tu consulta. Inténtalo de nuevo.' }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Asistente IA</h1>
          <p className="page-subtitle">Consulta datos de tu negocio en lenguaje natural</p>
        </div>
      </header>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages area */}
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <Sparkles size={32} color="white" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Asistente de Negocio</h3>
                <p style={{ color: 'var(--gray-500)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                  Pregúntame sobre tus facturas, clientes, proyectos, gastos o cualquier dato de tu negocio.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 20,
                        border: '1px solid var(--gray-200)',
                        background: 'white',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--gray-700)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.color = 'var(--primary)'; }}
                      onMouseLeave={e => { e.target.style.borderColor = 'var(--gray-200)'; e.target.style.color = 'var(--gray-700)'; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: 8
                    }}
                  >
                    {msg.role === 'assistant' && (
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Sparkles size={16} color="white" />
                      </div>
                    )}
                    <div style={{ maxWidth: '70%' }}>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: 16,
                        fontSize: 14,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        background: msg.role === 'user' ? 'var(--primary)' : 'var(--gray-100)',
                        color: msg.role === 'user' ? 'white' : 'var(--gray-800)',
                        borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                        borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 16
                      }}>
                        {msg.content}
                      </div>
                      {msg.actions && msg.actions.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {msg.actions.map((a, j) => {
                            const Icon = actionIcons[a.action] || CheckCircle;
                            return (
                              <span key={j} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 10px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 500,
                                background: a.success ? '#f0fdf4' : '#fef2f2',
                                color: a.success ? '#16a34a' : '#dc2626',
                                border: `1px solid ${a.success ? '#bbf7d0' : '#fecaca'}`
                              }}>
                                {a.success ? <Icon size={13} /> : <XCircle size={13} />}
                                {actionLabels[a.action] || a.action}: {a.nombre || a.titulo || a.descripcion || (a.error ? 'Error' : 'OK')}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--gray-200)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <User size={16} color="var(--gray-600)" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Sparkles size={16} color="white" />
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: 16,
                      borderBottomLeftRadius: 4,
                      background: 'var(--gray-100)',
                      color: 'var(--gray-500)',
                      fontSize: 14
                    }}>
                      Pensando...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{
            padding: 16,
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            gap: 8
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              rows={1}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--gray-200)',
                fontSize: 14,
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none'
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{ borderRadius: 12, padding: '10px 16px' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
