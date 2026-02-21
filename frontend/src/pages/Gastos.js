import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Receipt,
  Edit3,
  Trash2,
  Download,
  Check,
  X
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

const categoriaLabels = {
  hosting: 'Hosting',
  software: 'Software',
  subcontratacion: 'Subcontratación',
  dietas: 'Dietas',
  material: 'Material',
  transporte: 'Transporte',
  telefonia: 'Telefonía',
  formacion: 'Formación',
  otros: 'Otros'
};

const categoriaColors = {
  hosting: '#3b82f6',
  software: '#8b5cf6',
  subcontratacion: '#f59e0b',
  dietas: '#10b981',
  material: '#ef4444',
  transporte: '#6366f1',
  telefonia: '#ec4899',
  formacion: '#14b8a6',
  otros: '#94a3b8'
};

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('todas');
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadGastos();
  }, []);

  async function loadGastos() {
    try {
      const data = await api.getGastos();
      setGastos(data);
    } catch (error) {
      addToast('Error al cargar gastos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(gasto) {
    if (!window.confirm(`¿Eliminar el gasto "${gasto.descripcion}"?`)) return;
    try {
      await api.deleteGasto(gasto.id);
      addToast('Gasto eliminado');
      loadGastos();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  const filteredGastos = gastos.filter(g => {
    const matchesSearch = g.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.proyecto_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'todas' || g.categoria === filter;
    return matchesSearch && matchesFilter;
  });

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  const gastosMes = gastos.filter(g => {
    const f = new Date(g.fecha);
    return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}` === currentMonth;
  });
  const gastosTrimestre = gastos.filter(g => {
    const f = new Date(g.fecha);
    return f.getFullYear() === now.getFullYear() && Math.floor(f.getMonth() / 3) + 1 === currentQuarter;
  });

  const totalMes = gastosMes.reduce((s, g) => s + Number(g.importe), 0);
  const totalTrimestre = gastosTrimestre.reduce((s, g) => s + Number(g.importe), 0);
  const ivaTrimestre = gastosTrimestre
    .filter(g => g.deducible)
    .reduce((s, g) => s + (Number(g.base_imponible) * Number(g.iva_soportado) / 100), 0);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Gastos</h1>
          <p className="page-subtitle">{gastos.length} gastos registrados</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/gastos/nuevo')}>
          <Plus size={18} />
          Nuevo Gasto
        </button>
      </header>

      <div className="page-content">
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Total Gastos (Mes)</div>
              <div className="stat-value">{totalMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Total Gastos (Trimestre)</div>
              <div className="stat-value">{totalTrimestre.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">IVA Soportado (Trimestre)</div>
              <div className="stat-value" style={{ color: 'var(--primary)' }}>
                {ivaTrimestre.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-input">
                <Search />
                <input
                  type="text"
                  placeholder="Buscar gastos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="tabs">
                <button className={`tab ${filter === 'todas' ? 'active' : ''}`} onClick={() => setFilter('todas')}>
                  Todas
                </button>
                {Object.entries(categoriaLabels).slice(0, 4).map(([key, label]) => (
                  <button key={key} className={`tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>
          ) : filteredGastos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Receipt size={40} />
              </div>
              <h3 className="empty-state-title">No hay gastos</h3>
              <p className="empty-state-text">Registra tu primer gasto para empezar</p>
              <button className="btn btn-primary" onClick={() => navigate('/gastos/nuevo')}>
                <Plus size={18} />
                Nuevo Gasto
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Importe</th>
                  <th>IVA</th>
                  <th>Proyecto</th>
                  <th>Proveedor</th>
                  <th style={{ textAlign: 'center' }}>Ded.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredGastos.map(gasto => (
                  <tr key={gasto.id}>
                    <td>{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{gasto.descripcion}</div>
                      {gasto.numero_factura && (
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Fact: {gasto.numero_factura}</div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        background: categoriaColors[gasto.categoria] + '20',
                        color: categoriaColors[gasto.categoria]
                      }}>
                        {categoriaLabels[gasto.categoria] || gasto.categoria}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontFamily: 'Space Grotesk' }}>
                      {Number(gasto.importe).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      {gasto.iva_soportado}%
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {gasto.proyecto_nombre || '-'}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {gasto.proveedor || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {gasto.deducible ? (
                        <Check size={16} color="var(--success)" />
                      ) : (
                        <X size={16} color="var(--gray-400)" />
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-icon btn-sm btn-secondary"
                          onClick={() => navigate(`/gastos/${gasto.id}/editar`)}
                          title="Editar"
                        >
                          <Edit3 size={16} />
                        </button>
                        {gasto.archivo && (
                          <a
                            href={api.getGastoArchivo(gasto.archivo)}
                            className="btn btn-icon btn-sm btn-secondary"
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Descargar archivo"
                          >
                            <Download size={16} />
                          </a>
                        )}
                        <button
                          className="btn btn-icon btn-sm btn-secondary"
                          onClick={() => handleDelete(gasto)}
                          title="Eliminar"
                          style={{ opacity: 0.6 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
