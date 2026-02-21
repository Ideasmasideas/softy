import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  RefreshCw,
  UserCog,
  Calendar,
  Settings,
  LogOut,
  Zap,
  Trello,
  Receipt,
  Calculator,
  Sparkles,
  Brain,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    if (window.confirm('¿Cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <a href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} />
          </div>
          ideasmasideas
        </a>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Principal</div>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/mi-dia" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Brain size={20} />
            Mi Dia
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Gestión</div>
          {hasPermission('proyectos') && (
            <NavLink to="/proyectos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FolderKanban size={20} />
              Proyectos
            </NavLink>
          )}
          {hasPermission('gantt') && (
            <NavLink to="/gantt" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calendar size={20} />
              Diagrama de Gantt
            </NavLink>
          )}
          {hasPermission('proyectos') && (
            <NavLink to="/kanban" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Trello size={20} />
              Tablero Kanban
            </NavLink>
          )}
          {hasPermission('clientes') && (
            <NavLink to="/clientes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              Clientes
            </NavLink>
          )}
          {hasPermission('facturas') && (
            <NavLink to="/facturas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              Facturas
            </NavLink>
          )}
          {hasPermission('facturas') && (
            <NavLink to="/facturas-recurrentes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <RefreshCw size={20} />
              Recurrentes
            </NavLink>
          )}
          {hasPermission('gastos') && (
            <NavLink to="/gastos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Receipt size={20} />
              Gastos
            </NavLink>
          )}
          {hasPermission('fiscal') && (
            <NavLink to="/fiscal" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Calculator size={20} />
              Fiscal
            </NavLink>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">IA</div>
          <NavLink to="/asistente" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Sparkles size={20} />
            Asistente IA
          </NavLink>
          <NavLink to="/bandeja-email" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Mail size={20} />
            Bandeja Email
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Sistema</div>
          {hasPermission('usuarios') && (
            <NavLink to="/usuarios" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserCog size={20} />
              Usuarios
            </NavLink>
          )}
          {hasPermission('configuracion') && (
            <NavLink to="/configuracion" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              Configuración
            </NavLink>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.nombre || 'Usuario'}</div>
            <div className="user-email">{user?.email || ''}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '10px 16px',
            background: 'var(--gray-100)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--gray-700)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.target.style.background = 'var(--gray-200)';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'var(--gray-100)';
          }}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
