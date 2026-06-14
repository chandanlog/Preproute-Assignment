import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, FilePlus, FileText, LogOut, Bell, ChevronDown,
  Clock, FolderOpen, Users, Building2, CircleUser, Trash2, DollarSign, Trophy, MessageSquare, Settings
} from 'lucide-react';
import { PrepRouteLogo } from './PrepRouteLogo';
import './Layout.css';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine if we should collapse the sidebar (when editing questions or previewing publish)
  const isCollapsed = location.pathname.includes('/questions') || location.pathname.includes('/preview');

  // Determine breadcrumbs based on path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') {
      return ['Dashboard'];
    }
    if (path.includes('/tests/new')) {
      return ['Test Creation', 'Create Test', 'Chapter Wise'];
    }
    if (path.includes('/edit')) {
      return ['Test Creation', 'Edit Test', 'Chapter Wise'];
    }
    if (path.includes('/questions')) {
      return ['Test Creation', 'Create Test', 'Chapter Wise'];
    }
    if (path.includes('/preview')) {
      return ['Test creation'];
    }
    return ['PrepRoute Admin'];
  };

  const breadcrumbs = getBreadcrumbs();

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tests/new', label: 'Test Creation', icon: FilePlus },
    { to: '/tests/tracking', label: 'Test Tracking', icon: FileText },
    // Decorative mockup menu items to match sidebar height in screenshot
    { to: '/clock', label: 'Schedule', icon: Clock, isMock: true },
    { to: '/folder', label: 'Repository', icon: FolderOpen, isMock: true },
    { to: '/users', label: 'Users', icon: Users, isMock: true },
    { to: '/building', label: 'Organization', icon: Building2, isMock: true },
    { to: '/profile', label: 'Profile', icon: CircleUser, isMock: true },
    { to: '/trash', label: 'Trash', icon: Trash2, isMock: true },
    { to: '/finance', label: 'Billing', icon: DollarSign, isMock: true },
    { to: '/trophy', label: 'Rewards', icon: Trophy, isMock: true },
    { to: '/chat', label: 'Messages', icon: MessageSquare, isMock: true },
    { to: '/settings', label: 'Settings', icon: Settings, isMock: true },
  ];
  const visibleMenuItems = isCollapsed 
    ? menuItems 
    : menuItems.filter(item => !item.isMock);

  return (
    <div className="app-layout">
      {/* Sidebar (Collapsed or Expanded) */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <PrepRouteLogo height={34} width={isCollapsed ? 40 : 150} className={isCollapsed ? 'logo-collapsed' : ''} />
        </div>
        
        <ul className="sidebar-menu">
          {visibleMenuItems.map((item, idx) => {
            const Icon = item.icon;
            if (item.isMock) {
              return (
                <li key={idx} className="sidebar-menu-item mock-item">
                  <span className="sidebar-link">
                    <Icon size={18} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </span>
                </li>
              );
            }
            return (
              <li key={idx} className="sidebar-menu-item">
                <NavLink 
                  to={item.to} 
                  className={({ isActive }) => {
                    // Test Creation active matches /tests/new and /tests/:id/edit
                    const isTestCreationActive = item.label === 'Test Creation' && (isActive || location.pathname.includes('/tests/'));
                    return `sidebar-link ${isActive || isTestCreationActive ? 'active' : ''}`;
                  }} 
                  end={item.to === '/'}
                >
                  <Icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          {/* Sidebar footer remains clean per screenshots */}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`main-content ${isCollapsed ? 'collapsed-sidebar' : ''}`}>
        <header className="app-header">
          <div className="header-left">
            {/* Empty space, breadcrumbs are in the page-content area per screenshot */}
          </div>

          <div className="header-actions">
            {/* Notification Bell with red notification badge */}
            <button className="header-bell-btn">
              <Bell size={20} />
              <span className="bell-badge"></span>
            </button>
            
            {/* Profile Dropdown Container */}
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <div 
                className="header-profile" 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {/* Avatar SVG of Alex Wando */}
                <div className="avatar-circle">
                  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="18" r="18" fill="#fed7aa" />
                    {/* Hair */}
                    <path d="M 9 16 C 9 8, 27 8, 27 16 C 27 12, 9 12, 9 16" fill="#7c2d12" />
                    {/* Eyes */}
                    <circle cx="14" cy="17" r="1.5" fill="#431407" />
                    <circle cx="22" cy="17" r="1.5" fill="#431407" />
                    {/* Mustache */}
                    <path d="M 12 22 Q 18 24 24 22 Q 18 20 12 22" fill="#7c2d12" />
                    {/* Shirt */}
                    <path d="M 10 32 C 10 26, 26 26, 26 32 Z" fill="#ea580c" />
                  </svg>
                </div>
                
                <div className="profile-info">
                  <span className="profile-name">{user?.username === 'admin' || !user?.username ? 'Alex Wando' : user.username}</span>
                  <span className="profile-role">{user?.role || 'Admin'}</span>
                </div>
                
                <ChevronDown size={14} className={`profile-chevron ${showDropdown ? 'rotate' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="profile-menu">
                  <button onClick={handleLogout} className="profile-menu-item">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-container">
          {/* Breadcrumbs inside the content area */}
          <div className="content-breadcrumbs">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <span className="breadcrumb-separator">/</span>}
                <span className={`breadcrumb-item ${idx === breadcrumbs.length - 1 ? 'active' : ''}`}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
