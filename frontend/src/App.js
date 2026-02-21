import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Proyectos from './pages/Proyectos';
import ProyectoDetalle from './pages/ProyectoDetalle';
import Facturas from './pages/Facturas';
import NuevaFactura from './pages/NuevaFactura';
import FacturaDetalle from './pages/FacturaDetalle';
import Usuarios from './pages/Usuarios';
import Gantt from './pages/Gantt';
import Kanban from './pages/Kanban';
import Configuracion from './pages/Configuracion';
import FacturasRecurrentes from './pages/FacturasRecurrentes';
import NuevaFacturaRecurrente from './pages/NuevaFacturaRecurrente';
import Gastos from './pages/Gastos';
import NuevoGasto from './pages/NuevoGasto';
import DashboardFiscal from './pages/DashboardFiscal';
import AsistenteIA from './pages/AsistenteIA';
import MiDia from './pages/MiDia';
import BandejaEmail from './pages/BandejaEmail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="app">
                    <Sidebar />
                    <main className="main-content">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/mi-dia" element={<MiDia />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/proyectos" element={<Proyectos />} />
                        <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
                        <Route path="/facturas" element={<Facturas />} />
                        <Route path="/facturas/nueva" element={<NuevaFactura />} />
                        <Route path="/facturas/:id" element={<FacturaDetalle />} />
                        <Route path="/facturas/:id/editar" element={<NuevaFactura />} />
                        <Route path="/facturas-recurrentes" element={<FacturasRecurrentes />} />
                        <Route path="/facturas-recurrentes/nueva" element={<NuevaFacturaRecurrente />} />
                        <Route path="/facturas-recurrentes/:id/editar" element={<NuevaFacturaRecurrente />} />
                        <Route path="/usuarios" element={<Usuarios />} />
                        <Route path="/gantt" element={<Gantt />} />
                        <Route path="/kanban" element={<Kanban />} />
                        <Route path="/gastos" element={<Gastos />} />
                        <Route path="/gastos/nuevo" element={<NuevoGasto />} />
                        <Route path="/gastos/:id/editar" element={<NuevoGasto />} />
                        <Route path="/fiscal" element={<DashboardFiscal />} />
                        <Route path="/asistente" element={<AsistenteIA />} />
                        <Route path="/bandeja-email" element={<BandejaEmail />} />
                        <Route path="/configuracion" element={<Configuracion />} />
                      </Routes>
                    </main>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
