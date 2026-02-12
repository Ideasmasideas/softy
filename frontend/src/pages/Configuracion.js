import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function Configuracion() {
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
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Datos de tu empresa</p>
        </div>
      </header>

      <div className="page-content">
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

          <div className="card" style={{ maxWidth: 640, marginTop: 24 }}>
            <div className="card-header">
              <h3 className="card-title">Configuración de Email (SendGrid)</h3>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>
                Para enviar facturas por email, configura SendGrid en el archivo .env del backend:
              </p>
              <pre style={{
                background: 'var(--gray-100)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                overflow: 'auto'
              }}>
{`SENDGRID_API_KEY=tu-sendgrid-api-key
SENDGRID_FROM_EMAIL=info@ideasmasideas.com`}
              </pre>
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 12 }}>
                Obtén tu API key de SendGrid en: <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>app.sendgrid.com/settings/api_keys</a>
              </p>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 24 }} disabled={saving}>
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </form>
      </div>
    </>
  );
}
