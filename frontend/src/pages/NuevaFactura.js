import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { format, addDays } from 'date-fns';

function toDateInput(val) {
  if (!val) return '';
  const str = String(val);
  if (str.includes('T')) return str.split('T')[0];
  return str;
}

export default function NuevaFactura() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = !!editId;
  const [searchParams] = useSearchParams();
  const proyectoId = searchParams.get('proyecto');
  const { addToast } = useToast();

  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    numero: '',
    cliente_id: '',
    proyecto_id: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    fecha_vencimiento: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    iva: 21,
    irpf: 15,
    notas: 'Terms of payment: Bank transfer\nIBAN: ES22 1465 01 20351742959555\nBIC: INGDESMMXXX',
    lineas: [{ concepto: '', cantidad: 1, precio_unitario: 0 }]
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [clientesData, proyectosData] = await Promise.all([
        api.getClientes(),
        api.getProyectos()
      ]);
      setClientes(clientesData);
      setProyectos(proyectosData);

      if (isEditing) {
        const factura = await api.getFactura(editId);
        setFormData({
          numero: factura.numero || '',
          cliente_id: factura.cliente_id || '',
          proyecto_id: factura.proyecto_id || '',
          fecha: toDateInput(factura.fecha),
          fecha_vencimiento: toDateInput(factura.fecha_vencimiento),
          iva: Number(factura.iva) || 21,
          irpf: Number(factura.irpf) || 0,
          notas: factura.notas || '',
          lineas: (factura.lineas || []).map(l => ({
            concepto: l.concepto,
            cantidad: Number(l.cantidad),
            precio_unitario: Number(l.precio_unitario)
          }))
        });
      } else {
        const { numero } = await api.getNextFacturaNumber();
        setFormData(prev => ({ ...prev, numero }));
      }

      if (!isEditing && proyectoId) {
        const proyecto = proyectosData.find(p => p.id === proyectoId);
        if (proyecto) {
          const lineas = [];
          if (proyecto.tipo === 'proyecto' && proyecto.presupuesto > 0) {
            lineas.push({
              concepto: `Desarrollo: ${proyecto.nombre}`,
              cantidad: 1,
              precio_unitario: proyecto.presupuesto
            });
          } else if (proyecto.tipo === 'horas') {
            const horasData = await api.getProyecto(proyectoId);
            const totalHoras = horasData.tareas?.reduce((sum, t) => sum + (t.horas || 0), 0) || 0;
            lineas.push({
              concepto: `Horas de desarrollo: ${proyecto.nombre} (${totalHoras}h)`,
              cantidad: totalHoras,
              precio_unitario: proyecto.precio_hora || 0
            });
          }
          setFormData(prev => ({
            ...prev,
            cliente_id: proyecto.cliente_id,
            proyecto_id: proyectoId,
            lineas: lineas.length > 0 ? lineas : prev.lineas
          }));
        }
      }
    } catch (error) {
      addToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }

  function addLinea() {
    setFormData(prev => ({
      ...prev,
      lineas: [...prev.lineas, { concepto: '', cantidad: 1, precio_unitario: 0 }]
    }));
  }

  function removeLinea(index) {
    setFormData(prev => ({
      ...prev,
      lineas: prev.lineas.filter((_, i) => i !== index)
    }));
  }

  function updateLinea(index, field, value) {
    setFormData(prev => ({
      ...prev,
      lineas: prev.lineas.map((linea, i) => 
        i === index ? { ...linea, [field]: value } : linea
      )
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (formData.lineas.some(l => !l.concepto || l.precio_unitario <= 0)) {
      addToast('Completa todos los conceptos y precios', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        lineas: formData.lineas.map(l => ({
          ...l,
          cantidad: parseFloat(l.cantidad) || 1,
          precio_unitario: parseFloat(l.precio_unitario) || 0
        }))
      };

      if (isEditing) {
        await api.updateFactura(editId, payload);
        addToast('Factura actualizada correctamente');
        navigate(`/facturas/${editId}`);
      } else {
        const factura = await api.createFactura(payload);
        addToast('Factura creada correctamente');
        navigate(`/facturas/${factura.id}`);
      }
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  const subtotal = formData.lineas.reduce((sum, l) => sum + (l.cantidad * l.precio_unitario), 0);
  const irpfAmount = subtotal * (formData.irpf / 100);
  const ivaAmount = subtotal * (formData.iva / 100);
  const total = subtotal - irpfAmount + ivaAmount;

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-icon btn-secondary" onClick={() => navigate(isEditing ? `/facturas/${editId}` : '/facturas')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{isEditing ? 'Editar Factura' : 'Nueva Factura'}</h1>
            <p className="page-subtitle">{isEditing ? 'Modificar factura existente' : 'Crear una nueva factura'}</p>
          </div>
        </div>
      </header>

      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
            <div>
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h3 className="card-title">Datos de la Factura</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">N° Factura *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.numero}
                        onChange={e => setFormData({ ...formData, numero: e.target.value })}
                        required
                        style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Cliente *</label>
                      <select
                        className="form-select"
                        value={formData.cliente_id}
                        onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
                        required
                      >
                        <option value="">Seleccionar cliente</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre} {c.empresa && `(${c.empresa})`}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Proyecto (opcional)</label>
                      <select 
                        className="form-select"
                        value={formData.proyecto_id}
                        onChange={e => setFormData({ ...formData, proyecto_id: e.target.value })}
                      >
                        <option value="">Sin proyecto</option>
                        {proyectos.filter(p => !formData.cliente_id || p.cliente_id === formData.cliente_id).map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Fecha de Emisión</label>
                      <input 
                        type="date" 
                        className="form-input"
                        value={formData.fecha}
                        onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha de Vencimiento</label>
                      <input 
                        type="date" 
                        className="form-input"
                        value={formData.fecha_vencimiento}
                        onChange={e => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Conceptos</h3>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addLinea}>
                    <Plus size={16} />
                    Añadir Línea
                  </button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '50%' }}>Concepto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lineas.map((linea, index) => (
                        <tr key={index}>
                          <td>
                            <input 
                              type="text"
                              className="form-input"
                              placeholder="Descripción del servicio"
                              value={linea.concepto}
                              onChange={e => updateLinea(index, 'concepto', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input 
                              type="number"
                              className="form-input"
                              value={linea.cantidad}
                              onChange={e => updateLinea(index, 'cantidad', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.5"
                              style={{ width: 80 }}
                            />
                          </td>
                          <td>
                            <input 
                              type="number"
                              className="form-input"
                              value={linea.precio_unitario}
                              onChange={e => updateLinea(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              style={{ width: 100 }}
                            />
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {(linea.cantidad * linea.precio_unitario).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                          </td>
                          <td>
                            {formData.lineas.length > 1 && (
                              <button 
                                type="button"
                                className="btn btn-icon btn-sm btn-secondary"
                                onClick={() => removeLinea(index)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div className="card" style={{ position: 'sticky', top: 100 }}>
                <div className="card-header">
                  <h3 className="card-title">Resumen</h3>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">IVA (%)</label>
                    <select
                      className="form-select"
                      value={formData.iva}
                      onChange={e => setFormData({ ...formData, iva: parseInt(e.target.value) })}
                    >
                      <option value="21">21%</option>
                      <option value="10">10%</option>
                      <option value="4">4%</option>
                      <option value="0">0% (Exento)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Retención IRPF (%)</label>
                    <select
                      className="form-select"
                      value={formData.irpf}
                      onChange={e => setFormData({ ...formData, irpf: parseInt(e.target.value) })}
                    >
                      <option value="15">15%</option>
                      <option value="7">7%</option>
                      <option value="0">0% (Sin retención)</option>
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 16, marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--gray-500)' }}>Subtotal</span>
                      <span style={{ fontWeight: 500 }}>{subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--gray-500)' }}>Retención IRPF ({formData.irpf}%)</span>
                      <span style={{ fontWeight: 500, color: 'var(--red)' }}>-{irpfAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--gray-500)' }}>IVA ({formData.iva}%)</span>
                      <span style={{ fontWeight: 500 }}>{ivaAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '2px solid var(--gray-200)' }}>
                      <span style={{ fontSize: 18, fontWeight: 600 }}>Total</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', fontFamily: 'Space Grotesk' }}>
                        {total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 24 }}>
                    <label className="form-label">Notas</label>
                    <textarea 
                      className="form-textarea"
                      value={formData.notas}
                      onChange={e => setFormData({ ...formData, notas: e.target.value })}
                      placeholder="Condiciones de pago, notas adicionales..."
                      rows={3}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }}>
                    {isEditing ? 'Guardar Cambios' : 'Crear Factura'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
