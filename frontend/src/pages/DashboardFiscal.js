import React, { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

const trimestreLabels = ['', 'T1 - Enero a Marzo', 'T2 - Abril a Junio', 'T3 - Julio a Septiembre', 'T4 - Octubre a Diciembre'];

function formatMoney(val) {
  return Number(val || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 });
}

export default function DashboardFiscal() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, [year]);

  async function loadData() {
    setLoading(true);
    try {
      const fiscalData = await api.getDashboardFiscal(year);
      setData(fiscalData);
    } catch (error) {
      addToast('Error al cargar datos fiscales', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando datos fiscales...</div>;
  }

  if (!data) return null;

  const { trimestres, totales, alertas } = data;

  // Find max value for chart bars
  const maxVal = Math.max(
    ...trimestres.map(t => Math.max(t.base_imponible, t.gastos_deducibles)),
    1
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard Fiscal</h1>
          <p className="page-subtitle">Resumen fiscal {year} - Modelos 303 y 130</p>
        </div>
        <select
          className="form-select"
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          style={{ width: 120 }}
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </header>

      <div className="page-content">
        {/* Alertas */}
        {alertas.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {alertas.map((alerta, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 8,
                background: alerta.estado === 'vencido' ? '#fef2f2' :
                  alerta.estado === 'urgente' ? '#fef2f2' :
                    alerta.estado === 'proximo' ? '#fffbeb' : '#f0fdf4',
                border: `1px solid ${alerta.estado === 'vencido' ? '#fca5a5' :
                  alerta.estado === 'urgente' ? '#fca5a5' :
                    alerta.estado === 'proximo' ? '#fcd34d' : '#86efac'}`
              }}>
                <AlertTriangle size={18} color={
                  alerta.estado === 'vencido' || alerta.estado === 'urgente' ? '#ef4444' :
                    alerta.estado === 'proximo' ? '#f59e0b' : '#22c55e'
                } />
                <div>
                  <strong>{alerta.modelo}</strong> ({alerta.trimestre}) -
                  {alerta.dias_restantes < 0
                    ? ` Vencido hace ${Math.abs(alerta.dias_restantes)} días`
                    : alerta.dias_restantes === 0
                      ? ' Vence HOY'
                      : ` Vence en ${alerta.dias_restantes} días (${alerta.fecha})`
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats anuales */}
        <div className="stats-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Ingresos Brutos</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {formatMoney(totales.ingresos_brutos)} €
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Gastos Deducibles</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>
                {formatMoney(totales.gastos_deducibles)} €
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Rendimiento Neto</div>
              <div className="stat-value">
                {formatMoney(totales.rendimiento_neto)} €
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">IVA a Ingresar</div>
              <div className="stat-value" style={{ color: totales.iva_a_ingresar > 0 ? 'var(--danger)' : 'var(--success)' }}>
                {formatMoney(totales.iva_a_ingresar)} €
              </div>
            </div>
          </div>
        </div>

        {/* Chart - Ingresos vs Gastos */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">Ingresos vs Gastos por Trimestre</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', height: 200, padding: '0 20px' }}>
              {trimestres.map((t, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 160, width: '100%', justifyContent: 'center' }}>
                    <div style={{
                      width: '35%',
                      height: `${Math.max((t.base_imponible / maxVal) * 160, 2)}px`,
                      background: 'var(--primary)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s'
                    }} title={`Ingresos: ${formatMoney(t.base_imponible)} €`} />
                    <div style={{
                      width: '35%',
                      height: `${Math.max((t.gastos_deducibles / maxVal) * 160, 2)}px`,
                      background: '#ef4444',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s'
                    }} title={`Gastos: ${formatMoney(t.gastos_deducibles)} €`} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>T{t.trimestre}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--primary)' }} />
                Ingresos
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#ef4444' }} />
                Gastos
              </div>
            </div>
          </div>
        </div>

        {/* Detalle por trimestre */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {trimestres.map((t, i) => (
            <div key={i} className="card">
              <div className="card-header">
                <h3 className="card-title">{trimestreLabels[t.trimestre]}</h3>
              </div>
              <div className="card-body">
                <div style={{ fontSize: 14 }}>
                  {/* Ingresos */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)' }}>
                      <TrendingUp size={16} /> Ingresos
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--gray-500)' }}>Base Imponible</span>
                      <span style={{ fontWeight: 500 }}>{formatMoney(t.base_imponible)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--gray-500)' }}>IVA Repercutido</span>
                      <span style={{ fontWeight: 500 }}>{formatMoney(t.iva_repercutido)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-500)' }}>IRPF Retenido</span>
                      <span style={{ fontWeight: 500 }}>{formatMoney(t.irpf_retenido)} €</span>
                    </div>
                  </div>

                  {/* Gastos */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)' }}>
                      <TrendingDown size={16} /> Gastos
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--gray-500)' }}>Gastos Deducibles</span>
                      <span style={{ fontWeight: 500 }}>{formatMoney(t.gastos_deducibles)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-500)' }}>IVA Soportado</span>
                      <span style={{ fontWeight: 500 }}>{formatMoney(t.iva_soportado)} €</span>
                    </div>
                  </div>

                  {/* Resultados */}
                  <div style={{ borderTop: '2px solid var(--gray-200)', paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>IVA a pagar</span>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 16,
                        fontFamily: 'Space Grotesk',
                        color: t.iva_a_pagar > 0 ? 'var(--danger)' : 'var(--success)'
                      }}>
                        {formatMoney(t.iva_a_pagar)} €
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--gray-500)' }}>Rendimiento Neto</span>
                      <span style={{ fontWeight: 500 }}>{formatMoney(t.rendimiento_neto)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-500)' }}>IRPF Estimado (20%)</span>
                      <span style={{ fontWeight: 500 }}>{formatMoney(t.irpf_estimado)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
