import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Send, Edit3 } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

const estadoLabels = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  pagada: 'Pagada',
  vencida: 'Vencida'
};

export default function FacturaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadFactura();
  }, [id]);

  async function loadFactura() {
    try {
      const data = await api.getFactura(id);
      setFactura(data);
    } catch (error) {
      addToast('Error al cargar la factura', 'error');
      navigate('/facturas');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    setSending(true);
    try {
      await api.sendFactura(id);
      addToast('Factura enviada correctamente');
      loadFactura();
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(estado) {
    try {
      await api.updateFactura(id, { estado });
      loadFactura();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  if (!factura) return null;

  const irpfAmount = Number(factura.subtotal) * ((Number(factura.irpf) || 0) / 100);
  const ivaAmount = Number(factura.subtotal) * (Number(factura.iva) / 100);

  return (
    <>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-icon btn-secondary" onClick={() => navigate('/facturas')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Factura {factura.numero}</h1>
            <p className="page-subtitle">{factura.cliente_empresa || factura.cliente_nombre}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select 
            className="form-select"
            value={factura.estado}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{ width: 'auto' }}
          >
            {Object.entries(estadoLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/facturas/${id}/editar`)}
          >
            <Edit3 size={16} />
            Editar
          </button>
          <a
            href={api.getFacturaPDF(id)}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download size={16} />
            Descargar PDF
          </a>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={sending}
          >
            <Send size={16} />
            {sending ? 'Enviando...' : 'Enviar por Email'}
          </button>
        </div>
      </header>

      <div className="page-content">
        <div className="invoice-preview">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <img
              src={api.getLogo()}
              alt="Logo"
              style={{ maxWidth: 160, maxHeight: 80 }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 24 }}>
            www.ideasmasideas.com
          </div>

          <div className="invoice-header">
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{factura.config?.empresa_nombre}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                {factura.config?.empresa_nif && <>NIF: {factura.config.empresa_nif}<br /></>}
                {factura.config?.empresa_direccion}<br />
                {factura.config?.empresa_email}
              </div>
            </div>
            <div className="invoice-number">
              <h2 style={{ fontSize: 22, fontWeight: 700 }}>FACTURA</h2>
              <div style={{ color: 'var(--gray-500)', marginTop: 8, fontSize: 13 }}>
                <strong>N°</strong> {factura.numero}
              </div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                <strong>Fecha:</strong> {format(new Date(factura.fecha), 'dd/MM/yyyy')}
              </div>
              {factura.fecha_vencimiento && (
                <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                  <strong>Vencimiento:</strong> {format(new Date(factura.fecha_vencimiento), 'dd/MM/yyyy')}
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>
                {Number(factura.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 32, padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
            <div className="invoice-party-label">Facturar a</div>
            <div className="invoice-party-name">{factura.cliente_empresa || factura.cliente_nombre}</div>
            <div className="invoice-party-detail">
              {factura.cliente_nombre}<br />
              {factura.cliente_direccion && <>{factura.cliente_direccion}<br /></>}
              {factura.cliente_nif && `NIF: ${factura.cliente_nif}`}
            </div>
          </div>

          <div className="invoice-items">
            <table className="table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th style={{ textAlign: 'right' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Precio</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {factura.lineas?.map((linea, index) => (
                  <tr key={index}>
                    <td>{linea.concepto}</td>
                    <td style={{ textAlign: 'right' }}>{linea.cantidad}</td>
                    <td style={{ textAlign: 'right' }}>{Number(linea.precio_unitario).toFixed(2)} €</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{Number(linea.total).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-totals">
            <div className="invoice-total-row">
              <span>Subtotal</span>
              <span>{Number(factura.subtotal).toFixed(2)} €</span>
            </div>
            {factura.irpf > 0 && (
              <div className="invoice-total-row">
                <span>Retención IRPF ({factura.irpf}%)</span>
                <span style={{ color: 'var(--red)' }}>-{irpfAmount.toFixed(2)} €</span>
              </div>
            )}
            <div className="invoice-total-row">
              <span>IVA ({factura.iva}%)</span>
              <span>{ivaAmount.toFixed(2)} €</span>
            </div>
            <div className="invoice-total-row final">
              <span>Total</span>
              <span>{Number(factura.total).toFixed(2)} €</span>
            </div>
          </div>

          {factura.notas && (
            <div style={{ marginTop: 40, padding: 20, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 8 }}>Notas</div>
              <div style={{ fontSize: 14, color: 'var(--gray-700)' }}>{factura.notas}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
