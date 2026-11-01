import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/apply', label: 'Apply' },
  { to: '/my-allocation', label: 'My Room' },
];

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/admin/applications', label: 'Applications' },
  { to: '/admin/hostels', label: 'Rooms' },
  { to: '/admin/allocations', label: 'Allocations' },
  { to: '/admin/reports', label: 'Reports' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user.role === 'admin' ? adminLinks : studentLinks;

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <strong>Hostel Allocation</strong>
          <nav>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div>
          <NavLink to="/profile" className="muted">{user.name}</NavLink>
          <button className="link-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <main className="container">{children}</main>
    </div>
  );
}