import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Download,
  Send,
  Eye,
  Edit3,
  MoreVertical,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

const estadoLabels = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  pagada: 'Pagada',
  vencida: 'Vencida'
};

function getQuarterKey(fecha) {
  const date = new Date(fecha);
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const year = date.getFullYear();
  return `${year}-Q${quarter}`;
}

function getQuarterLabel(key) {
  const [year, q] = key.split('-Q');
  const labels = {
    '1': `T1 ${year} - Enero a Marzo`,
    '2': `T2 ${year} - Abril a Junio`,
    '3': `T3 ${year} - Julio a Septiembre`,
    '4': `T4 ${year} - Octubre a Diciembre`
  };
  return labels[q];
}

function groupByQuarter(facturas) {
  const groups = {};
  facturas.forEach(f => {
    const key = getQuarterKey(f.fecha);
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  });

  return Object.keys(groups).sort().reverse().map(key => ({
    key,
    label: getQuarterLabel(key),
    facturas: groups[key],
    totalFacturado: groups[key].reduce((sum, f) => sum + Number(f.subtotal), 0),
    totalIVA: groups[key].reduce((sum, f) => sum + (Number(f.subtotal) * Number(f.iva) / 100), 0)
  }));
}

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('todas');
  const [showMenu, setShowMenu] = useState(null);
  const [collapsedQuarters, setCollapsedQuarters] = useState({});
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFacturas();
  }, []);

  async function loadFacturas() {
    try {
      const data = await api.getFacturas();
      setFacturas(data);
    } catch (error) {
      addToast('Error al cargar facturas', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(factura) {
    try {
      await api.sendFactura(factura.id);
      addToast('Factura enviada correctamente');
      loadFacturas();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setShowMenu(null);
  }

  async function handleDelete(factura) {
    if (!window.confirm(`¿Eliminar la factura ${factura.numero}?`)) return;
    try {
      await api.deleteFactura(factura.id);
      addToast('Factura eliminada');
      loadFacturas();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setShowMenu(null);
  }

  async function handleStatusChange(factura, estado) {
    try {
      await api.updateFactura(factura.id, { estado });
      loadFacturas();
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  const filteredFacturas = facturas.filter(f => {
    const matchesSearch = f.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'todas' || f.estado === filter;
    return matchesSearch && matchesFilter;
  });

  const totales = {
    total: facturas.reduce((sum, f) => sum + Number(f.total), 0),
    pagadas: facturas.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + Number(f.total), 0),
    pendientes: facturas.filter(f => ['enviada', 'borrador'].includes(f.estado)).reduce((sum, f) => sum + Number(f.total), 0)
  };

  const quarters = groupByQuarter(filteredFacturas);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Facturas</h1>
          <p className="page-subtitle">{facturas.length} facturas en total</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/facturas/nueva')}>
          <Plus size={18} />
          Nueva Factura
        </button>
      </header>

      <div className="page-content">
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Total Facturado</div>
              <div className="stat-value">{totales.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Cobrado</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                {totales.pagadas.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Pendiente</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>
                {totales.pendientes.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="search-input">
                <Search />
                <input
                  type="text"
                  placeholder="Buscar facturas..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="tabs">
                <button className={`tab ${filter === 'todas' ? 'active' : ''}`} onClick={() => setFilter('todas')}>
                  Todas
                </button>
                <button className={`tab ${filter === 'borrador' ? 'active' : ''}`} onClick={() => setFilter('borrador')}>
                  Borrador
                </button>
                <button className={`tab ${filter === 'enviada' ? 'active' : ''}`} onClick={() => setFilter('enviada')}>
                  Enviadas
                </button>
                <button className={`tab ${filter === 'pagada' ? 'active' : ''}`} onClick={() => setFilter('pagada')}>
                  Pagadas
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>Cargando...</div>
          ) : filteredFacturas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileText size={40} />
              </div>
              <h3 className="empty-state-title">No hay facturas</h3>
              <p className="empty-state-text">Crea tu primera factura para empezar</p>
              <button className="btn btn-primary" onClick={() => navigate('/facturas/nueva')}>
                <Plus size={18} />
                Nueva Factura
              </button>
            </div>
          ) : (
            <div>
              {quarters.map(quarter => (
                <div key={quarter.key}>
                  <div
                    onClick={() => setCollapsedQuarters(prev => ({ ...prev, [quarter.key]: !prev[quarter.key] }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'var(--gray-50)',
                      borderBottom: '2px solid var(--gray-200)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {collapsedQuarters[quarter.key] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{quarter.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        ({quarter.facturas.length} {quarter.facturas.length === 1 ? 'factura' : 'facturas'})
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                      <span>
                        Base imponible: <strong style={{ fontFamily: 'Space Grotesk' }}>{quarter.totalFacturado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong>
                      </span>
                      <span>
                        IVA: <strong style={{ fontFamily: 'Space Grotesk', color: 'var(--primary)' }}>{quarter.totalIVA.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong>
                      </span>
                    </div>
                  </div>

                  {!collapsedQuarters[quarter.key] && (
                    <table className="table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th>Factura</th>
                          <th>Cliente</th>
                          <th>Fecha</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {quarter.facturas.map(factura => (
                          <tr key={factura.id}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{factura.numero}</div>
                              {factura.proyecto_nombre && (
                                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{factura.proyecto_nombre}</div>
                              )}
                            </td>
                            <td>
                              <div>{factura.cliente_nombre}</div>
                              {factura.cliente_empresa && (
                                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{factura.cliente_empresa}</div>
                              )}
                            </td>
                            <td>
                              <div>{format(new Date(factura.fecha), 'dd/MM/yyyy')}</div>
                              {factura.fecha_vencimiento && (
                                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                                  Vence: {format(new Date(factura.fecha_vencimiento), 'dd/MM/yyyy')}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, fontFamily: 'Space Grotesk' }}>
                                {Number(factura.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                              </div>
                              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                                IVA {factura.iva}%
                              </div>
                            </td>
                            <td>
                              <select
                                className="form-select"
                                value={factura.estado}
                                onChange={(e) => handleStatusChange(factura, e.target.value)}
                                style={{
                                  width: 'auto',
                                  padding: '4px 8px',
                                  fontSize: 12,
                                  background: factura.estado === 'pagada' ? 'var(--success-light)' :
                                             factura.estado === 'enviada' ? 'var(--warning-light)' : 'var(--gray-100)'
                                }}
                              >
                                {Object.entries(estadoLabels).map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  className="btn btn-icon btn-sm btn-secondary"
                                  onClick={() => navigate(`/facturas/${factura.id}`)}
                                  title="Ver factura"
                                >
                                  <Eye size={16} />
                                </button>
                                <a
                                  href={api.getFacturaPDF(factura.id)}
                                  className="btn btn-icon btn-sm btn-secondary"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Descargar PDF"
                                >
                                  <Download size={16} />
                                </a>
                                <div className="dropdown">
                                  <button
                                    className="btn btn-icon btn-sm btn-secondary"
                                    onClick={() => setShowMenu(showMenu === factura.id ? null : factura.id)}
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  {showMenu === factura.id && (
                                    <div className="dropdown-menu">
                                      <button className="dropdown-item" onClick={() => { setShowMenu(null); navigate(`/facturas/${factura.id}/editar`); }}>
                                        <Edit3 size={16} />
                                        Editar
                                      </button>
                                      <button className="dropdown-item" onClick={() => handleSend(factura)}>
                                        <Send size={16} />
                                        Enviar por Email
                                      </button>
                                      <button className="dropdown-item danger" onClick={() => handleDelete(factura)}>
                                        <Trash2 size={16} />
                                        Eliminar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
