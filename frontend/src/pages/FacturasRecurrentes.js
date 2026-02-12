import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function FacturasRecurrentes() {
  const [recurrentes, setRecurrentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api.getFacturasRecurrentes();
      setRecurrentes(data);
    } catch (error) {
      addToast('Error al cargar facturas recurrentes', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(rec) {
    try {
      await api.toggleFacturaRecurrente(rec.id);
      loadData();
      addToast(rec.activa ? 'Recurrente desactivada' : 'Recurrente activada');
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function handleDelete(rec) {
    if (!window.confirm('¿Eliminar esta factura recurrente?')) return;
    try {
      await api.deleteFacturaRecurrente(rec.id);
      addToast('Factura recurrente eliminada');
      loadData();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Facturas Recurrentes</h1>
          <p className="page-subtitle">{recurrentes.length} facturas programadas</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/facturas-recurrentes/nueva')}>
          <Plus size={18} />
          Nueva Recurrente
        </button>
      </header>

      <div className="page-content">
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>
          ) : recurrentes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <RefreshCw size={40} />
              </div>
              <h3 className="empty-state-title">No hay facturas recurrentes</h3>
              <p className="empty-state-text">Crea una factura recurrente para enviarla automáticamente cada mes</p>
              <button className="btn btn-primary" onClick={() => navigate('/facturas-recurrentes/nueva')}>
                <Plus size={18} />
                Nueva Recurrente
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Concepto</th>
                  <th>Importe</th>
                  <th>Día del mes</th>
                  <th>Estado</th>
                  <th>Última generación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recurrentes.map(rec => {
                  const subtotal = Number(rec.subtotal) || 0;
                  const iva = Number(rec.iva) || 21;
                  const irpf = Number(rec.irpf) || 0;
                  const total = subtotal - (subtotal * irpf / 100) + (subtotal * iva / 100);

                  return (
                    <tr key={rec.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rec.cliente_nombre}</div>
                        {rec.cliente_empresa && (
                          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{rec.cliente_empresa}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{rec.concepto_resumen}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontFamily: 'Space Grotesk' }}>
                          {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                          IVA {iva}% / IRPF {irpf}%
                        </div>
                      </td>
                      <td>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 600
                        }}>
                          Día {rec.dia_mes}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleToggle(rec)}
                          style={{
                            background: rec.activa ? 'var(--success-light)' : 'var(--gray-100)',
                            color: rec.activa ? 'var(--success)' : 'var(--gray-500)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {rec.activa ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {rec.activa ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                          {rec.ultima_generacion
                            ? new Date(rec.ultima_generacion).toLocaleDateString('es-ES')
                            : 'Nunca'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-icon btn-sm btn-secondary"
                            onClick={() => navigate(`/facturas-recurrentes/${rec.id}/editar`)}
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            className="btn btn-icon btn-sm btn-secondary"
                            onClick={() => handleDelete(rec)}
                            title="Eliminar"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
