import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

function toDateInput(val) {
  if (!val) return '';
  const str = String(val);
  if (str.includes('T')) return str.split('T')[0];
  return str;
}

const categorias = [
  { value: 'hosting', label: 'Hosting' },
  { value: 'software', label: 'Software' },
  { value: 'subcontratacion', label: 'Subcontratación' },
  { value: 'dietas', label: 'Dietas' },
  { value: 'material', label: 'Material' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'telefonia', label: 'Telefonía' },
  { value: 'formacion', label: 'Formación' },
  { value: 'otros', label: 'Otros' }
];

export default function NuevoGasto() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = !!editId;
  const { addToast } = useToast();

  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivo, setArchivo] = useState(null);
  const [archivoExistente, setArchivoExistente] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const [formData, setFormData] = useState({
    descripcion: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    categoria: 'otros',
    proveedor: '',
    numero_factura: '',
    proyecto_id: '',
    cliente_id: '',
    notas: '',
    iva_soportado: 21,
    importe: '',
    deducible: true
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [proyectosData, clientesData] = await Promise.all([
        api.getProyectos(),
        api.getClientes()
      ]);
      setProyectos(proyectosData);
      setClientes(clientesData);

      if (isEditing) {
        const gasto = await api.getGasto(editId);
        setFormData({
          descripcion: gasto.descripcion || '',
          fecha: toDateInput(gasto.fecha),
          categoria: gasto.categoria || 'otros',
          proveedor: gasto.proveedor || '',
          numero_factura: gasto.numero_factura || '',
          proyecto_id: gasto.proyecto_id || '',
          cliente_id: gasto.cliente_id || '',
          notas: gasto.notas || '',
          iva_soportado: Number(gasto.iva_soportado) || 21,
          importe: gasto.importe || '',
          deducible: !!gasto.deducible
        });
        if (gasto.archivo) {
          setArchivoExistente(gasto.archivo);
        }
      }
    } catch (error) {
      addToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setArchivo(file);
    if (!file || isEditing) return;

    setExtracting(true);
    try {
      const data = await api.extractInvoice(file);
      setFormData(prev => ({
        ...prev,
        descripcion: data.descripcion || prev.descripcion,
        importe: data.importe || prev.importe,
        fecha: data.fecha || prev.fecha,
        proveedor: data.proveedor || prev.proveedor,
        numero_factura: data.numero_factura || prev.numero_factura,
        iva_soportado: data.iva_soportado != null ? data.iva_soportado : prev.iva_soportado,
        categoria: data.categoria || prev.categoria,
        notas: data.notas || prev.notas
      }));
      addToast('Datos extraidos del documento correctamente');
    } catch (error) {
      addToast('No se pudieron extraer datos automáticamente', 'error');
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.descripcion || !formData.importe) {
      addToast('Completa los campos obligatorios', 'error');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('descripcion', formData.descripcion);
      fd.append('fecha', formData.fecha);
      fd.append('categoria', formData.categoria);
      fd.append('proveedor', formData.proveedor);
      fd.append('numero_factura', formData.numero_factura);
      fd.append('proyecto_id', formData.proyecto_id);
      fd.append('cliente_id', formData.cliente_id);
      fd.append('notas', formData.notas);
      fd.append('iva_soportado', formData.iva_soportado);
      fd.append('importe', formData.importe);
      fd.append('deducible', formData.deducible ? '1' : '0');
      if (archivo) {
        fd.append('archivo', archivo);
      }

      if (isEditing) {
        await api.updateGasto(editId, fd);
        addToast('Gasto actualizado correctamente');
      } else {
        await api.createGasto(fd);
        addToast('Gasto creado correctamente');
      }
      navigate('/gastos');
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  const importe = parseFloat(formData.importe) || 0;
  const iva = parseFloat(formData.iva_soportado) || 0;
  const baseImponible = importe / (1 + iva / 100);
  const ivaAmount = importe - baseImponible;

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <>
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-icon btn-secondary" onClick={() => navigate('/gastos')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">{isEditing ? 'Editar Gasto' : 'Nuevo Gasto'}</h1>
            <p className="page-subtitle">{isEditing ? 'Modificar gasto existente' : 'Registrar un nuevo gasto'}</p>
          </div>
        </div>
      </header>

      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
            <div>
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h3 className="card-title">Datos del Gasto</h3>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Descripción *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.descripcion}
                      onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Ej: Hosting anual, Licencia Figma..."
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Fecha *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.fecha}
                        onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Categoría</label>
                      <select
                        className="form-select"
                        value={formData.categoria}
                        onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                      >
                        {categorias.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Proveedor</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.proveedor}
                        onChange={e => setFormData({ ...formData, proveedor: e.target.value })}
                        placeholder="Nombre del proveedor"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">N° Factura Proveedor</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.numero_factura}
                        onChange={e => setFormData({ ...formData, numero_factura: e.target.value })}
                        placeholder="Número de factura"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Proyecto (opcional)</label>
                      <select
                        className="form-select"
                        value={formData.proyecto_id}
                        onChange={e => setFormData({ ...formData, proyecto_id: e.target.value })}
                      >
                        <option value="">Sin proyecto</option>
                        {proyectos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cliente (opcional)</label>
                      <select
                        className="form-select"
                        value={formData.cliente_id}
                        onChange={e => setFormData({ ...formData, cliente_id: e.target.value })}
                      >
                        <option value="">Sin cliente</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre} {c.empresa && `(${c.empresa})`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notas</label>
                    <textarea
                      className="form-textarea"
                      value={formData.notas}
                      onChange={e => setFormData({ ...formData, notas: e.target.value })}
                      placeholder="Notas adicionales..."
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      Archivo adjunto (ticket/factura)
                      {!isEditing && (
                        <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={12} /> Auto-rellena con IA
                        </span>
                      )}
                    </label>
                    <input
                      type="file"
                      className="form-input"
                      accept=".jpg,.jpeg,.png,.pdf,.webp"
                      onChange={handleFileChange}
                      disabled={extracting}
                    />
                    {extracting && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--gray-50)' }}>
                        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} color="var(--primary)" />
                        <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Extrayendo datos del documento con IA...</span>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                      </div>
                    )}
                    {archivoExistente && !archivo && (
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
                        Archivo actual: <a href={api.getGastoArchivo(archivoExistente)} target="_blank" rel="noopener noreferrer">{archivoExistente}</a>
                      </div>
                    )}
                  </div>
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
                    <label className="form-label">Importe Total (con IVA) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.importe}
                      onChange={e => setFormData({ ...formData, importe: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                      style={{ fontSize: 18, fontWeight: 600, fontFamily: 'Space Grotesk' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">IVA (%)</label>
                    <select
                      className="form-select"
                      value={formData.iva_soportado}
                      onChange={e => setFormData({ ...formData, iva_soportado: parseInt(e.target.value) })}
                    >
                      <option value="21">21%</option>
                      <option value="10">10%</option>
                      <option value="4">4%</option>
                      <option value="0">0% (Exento)</option>
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 16, marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--gray-500)' }}>Base Imponible</span>
                      <span style={{ fontWeight: 500 }}>{baseImponible.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--gray-500)' }}>IVA ({formData.iva_soportado}%)</span>
                      <span style={{ fontWeight: 500 }}>{ivaAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '2px solid var(--gray-200)' }}>
                      <span style={{ fontSize: 18, fontWeight: 600 }}>Total</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', fontFamily: 'Space Grotesk' }}>
                        {importe.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={formData.deducible}
                        onChange={e => setFormData({ ...formData, deducible: e.target.checked })}
                      />
                      Gasto deducible
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>
                    {isEditing ? 'Guardar Cambios' : 'Registrar Gasto'}
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
