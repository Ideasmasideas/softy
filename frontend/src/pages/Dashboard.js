import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  Euro,
  Clock,
  ArrowUpRight,
  FileText,
  Brain,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../utils/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoLabels = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  pagada: 'Pagada',
  vencida: 'Vencida'
};

const estadoClasses = {
  borrador: 'badge-gray',
  enviada: 'badge-warning',
  pagada: 'badge-success',
  vencida: 'badge-danger'
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordatoriosSummary, setRecordatoriosSummary] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await api.getDashboard();
      setData(result);
      try {
        const summary = await api.getRecordatoriosSummary();
        setRecordatoriosSummary(summary);
      } catch { /* not critical */ }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>
      </div>
    );
  }

  const chartData = data?.facturacionMensual?.map(item => ({
    mes: format(new Date(item.mes + '-01'), 'MMM yy', { locale: es }),
    total: item.total
  })) || [];

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen de tu actividad</p>
        </div>
      </header>

      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon primary">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Clientes</div>
              <div className="stat-value">{data?.stats?.totalClientes || 0}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <FolderKanban size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Proyectos Activos</div>
              <div className="stat-value">{data?.stats?.proyectosActivos || 0}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <Euro size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Facturado Total</div>
              <div className="stat-value">{(data?.stats?.totalFacturado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon primary">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Horas Este Mes</div>
              <div className="stat-value">{data?.stats?.horasEsteMes || 0}h</div>
            </div>
          </div>
        </div>

        {/* Mi Dia Widget */}
        {recordatoriosSummary && (recordatoriosSummary.vencidos > 0 || recordatoriosSummary.urgentes > 0 || recordatoriosSummary.pendientes > 0) && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Brain size={18} /> Mi Dia
              </h3>
              <Link to="/mi-dia" className="btn btn-sm btn-secondary">
                Abrir <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 32 }}>
                {recordatoriosSummary.vencidos > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={20} color="#ef4444" />
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444', fontFamily: 'Space Grotesk' }}>
                        {recordatoriosSummary.vencidos}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Vencidos</div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Flame size={20} color="#f59e0b" />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', fontFamily: 'Space Grotesk' }}>
                      {recordatoriosSummary.urgentes || 0}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Urgentes</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Brain size={20} color="var(--gray-400)" />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                      {recordatoriosSummary.pendientes || 0}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Pendientes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Facturación Mensual</h3>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 12, fill: '#71717a' }}
                      axisLine={{ stroke: '#e4e4e7' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#71717a' }}
                      axisLine={{ stroke: '#e4e4e7' }}
                      tickFormatter={(value) => `${value}€`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value.toLocaleString('es-ES')} €`, 'Total']}
                      contentStyle={{ 
                        borderRadius: 10, 
                        border: '1px solid #e4e4e7',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#ff6b6b" 
                      strokeWidth={3}
                      dot={{ fill: '#ff6b6b', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Últimas Facturas</h3>
              <Link to="/facturas" className="btn btn-sm btn-secondary">
                Ver todas
                <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {data?.facturasRecientes?.length > 0 ? (
                <table className="table">
                  <tbody>
                    {data.facturasRecientes.map(factura => (
                      <tr key={factura.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{factura.numero}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                            {factura.cliente_nombre}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>
                            {factura.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                          </div>
                          <span className={`badge ${estadoClasses[factura.estado]}`}>
                            {estadoLabels[factura.estado]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state" style={{ padding: 40 }}>
                  <FileText size={32} style={{ color: 'var(--gray-400)', marginBottom: 12 }} />
                  <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>Sin facturas aún</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Resumen Financiero</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
                    Facturación este mes
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                    {(data?.stats?.facturasEsteMes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
                    Pendiente de cobro
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--warning)' }}>
                    {(data?.stats?.pendienteCobro || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 4 }}>
                    Total facturado
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--success)' }}>
                    {(data?.stats?.totalFacturado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
