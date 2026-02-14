import React, { useState, useEffect } from 'react';
import { Save, Mail, Settings, CheckCircle, XCircle, FileEdit } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

function EmpresaTab() {
  const [config, setConfig] = useState({
    empresa_nombre: '',
    empresa_email: '',
    empresa_direccion: '',
    empresa_nif: '',
    contador_factura: '',
    empresa_iban: '',
    empresa_bic: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const data = await api.getConfig();
      setConfig(prev => ({ ...prev, ...data }));
    } catch (error) {
      addToast('Error al cargar configuración', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateConfig(config);
      addToast('Configuración guardada correctamente');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-header">
          <h3 className="card-title">Datos de la Empresa</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Nombre de la Empresa</label>
            <input
              type="text"
              className="form-input"
              value={config.empresa_nombre}
              onChange={e => setConfig({ ...config, empresa_nombre: e.target.value })}
              placeholder="Tu empresa S.L."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={config.empresa_email}
                onChange={e => setConfig({ ...config, empresa_email: e.target.value })}
                placeholder="contacto@tuempresa.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">NIF/CIF</label>
              <input
                type="text"
                className="form-input"
                value={config.empresa_nif}
                onChange={e => setConfig({ ...config, empresa_nif: e.target.value })}
                placeholder="B12345678"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dirección</label>
            <textarea
              className="form-textarea"
              value={config.empresa_direccion}
              onChange={e => setConfig({ ...config, empresa_direccion: e.target.value })}
              placeholder="Calle, número, CP, Ciudad"
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">IBAN</label>
              <input
                type="text"
                className="form-input"
                value={config.empresa_iban}
                onChange={e => setConfig({ ...config, empresa_iban: e.target.value })}
                placeholder="ES22 1465 01 20351742959555"
              />
            </div>
            <div className="form-group">
              <label className="form-label">BIC</label>
              <input
                type="text"
                className="form-input"
                value={config.empresa_bic}
                onChange={e => setConfig({ ...config, empresa_bic: e.target.value })}
                placeholder="INGDESMMXXX"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contador de Facturas</label>
            <input
              type="text"
              className="form-input"
              value={config.contador_factura}
              onChange={e => setConfig({ ...config, contador_factura: e.target.value })}
              placeholder="260007"
              style={{ width: 160 }}
            />
            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
              La próxima factura usará este número. Se incrementa automáticamente.
            </p>
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary" style={{ marginTop: 24 }} disabled={saving}>
        <Save size={16} />
        {saving ? 'Guardando...' : 'Guardar Configuración'}
      </button>
    </form>
  );
}

function EmailLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const data = await api.getEmailLog();
      setLogs(data);
    } catch (error) {
      addToast('Error al cargar log de emails', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Historial de Emails Enviados</h3>
        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{logs.length} registros</span>
      </div>
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-500)' }}>
          <Mail size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No hay emails enviados todavía</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Factura</th>
              <th>Destinatario</th>
              <th>Asunto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>
                  <div style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleDateString('es-ES')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                    {new Date(log.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600, fontFamily: 'Space Grotesk' }}>
                    {log.factura_numero || '-'}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>{log.destinatario}</td>
                <td style={{ fontSize: 13, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.asunto}
                </td>
                <td>
                  {log.estado === 'enviado' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>
                      <CheckCircle size={14} /> Enviado
                    </span>
                  ) : (
                    <span title={log.error_mensaje} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'help' }}>
                      <XCircle size={14} /> Error
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const VARIABLES_HELP = [
  { var: '{cliente}', desc: 'Nombre del cliente' },
  { var: '{empresa_cliente}', desc: 'Empresa del cliente' },
  { var: '{numero}', desc: 'Número de factura' },
  { var: '{total}', desc: 'Total con IVA' },
  { var: '{subtotal}', desc: 'Subtotal sin IVA' },
  { var: '{fecha}', desc: 'Fecha de emisión' },
  { var: '{vencimiento}', desc: 'Fecha de vencimiento' },
  { var: '{empresa}', desc: 'Nombre de tu empresa' },
];

function previewReplace(text) {
  const sample = {
    '{cliente}': 'Juan Pérez',
    '{empresa_cliente}': 'Acme S.L.',
    '{numero}': '260015',
    '{total}': '1.210,00 €',
    '{subtotal}': '1.000,00 €',
    '{fecha}': '15/02/2026',
    '{vencimiento}': '17/03/2026',
    '{empresa}': 'ideasmasideas',
  };
  let result = text || '';
  for (const [key, value] of Object.entries(sample)) {
    result = result.split(key).join(value);
  }
  return result;
}

function EmailTemplateTab() {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadTemplate();
  }, []);

  async function loadTemplate() {
    try {
      const data = await api.getConfig();
      setAsunto(data.email_asunto || 'Factura {numero} - {empresa}');
      setMensaje(data.email_mensaje || 'Estimado/a {cliente},\n\nAdjunto encontrará la factura {numero} por un importe de {total}.\n\nFecha de vencimiento: {vencimiento}\n\nGracias por su confianza.\n\nSaludos,\n{empresa}');
    } catch (error) {
      addToast('Error al cargar plantilla', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateConfig({ email_asunto: asunto, email_mensaje: mensaje });
      addToast('Plantilla guardada correctamente');
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <form onSubmit={handleSave}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Plantilla del Email</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Asunto</label>
                <input
                  type="text"
                  className="form-input"
                  value={asunto}
                  onChange={e => setAsunto(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mensaje</label>
                <textarea
                  className="form-textarea"
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  rows={12}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <h3 className="card-title">Variables disponibles</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="table">
                <tbody>
                  {VARIABLES_HELP.map(v => (
                    <tr key={v.var}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>{v.var}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{v.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar Plantilla'}
          </button>
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: 100 }}>
            <div className="card-header">
              <h3 className="card-title">Preview</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 4, fontWeight: 600 }}>Asunto</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{previewReplace(asunto)}</div>
              </div>
              <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 16 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 8, fontWeight: 600 }}>Mensaje</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--gray-700)' }}>
                  {previewReplace(mensaje).split('\n').map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--gray-500)' }}>
                + Factura adjunta en PDF
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('empresa');

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Ajustes de la aplicación</p>
        </div>
      </header>

      <div className="page-content">
        <div className="tabs" style={{ marginBottom: 24 }}>
          <button
            className={`tab ${activeTab === 'empresa' ? 'active' : ''}`}
            onClick={() => setActiveTab('empresa')}
          >
            <Settings size={16} />
            Empresa
          </button>
          <button
            className={`tab ${activeTab === 'email-template' ? 'active' : ''}`}
            onClick={() => setActiveTab('email-template')}
          >
            <FileEdit size={16} />
            Plantilla Email
          </button>
          <button
            className={`tab ${activeTab === 'email-log' ? 'active' : ''}`}
            onClick={() => setActiveTab('email-log')}
          >
            <Mail size={16} />
            Log de Emails
          </button>
        </div>

        {activeTab === 'empresa' && <EmpresaTab />}
        {activeTab === 'email-template' && <EmailTemplateTab />}
        {activeTab === 'email-log' && <EmailLogTab />}
      </div>
    </>
  );
}
