import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errorMessage } from '../api.js';

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false); // false = student form, true = admin form
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Switch between the student form and the admin form (clears the fields and any error)
  const switchMode = (admin) => {
    setIsAdmin(admin);
    setForm({ email: '', password: '' });
    setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);

      // Keep the two logins separate
      if (isAdmin && user.role !== 'admin') {
        logout();
        setError('This account is not an admin account');
        return;
      }
      if (!isAdmin && user.role === 'admin') {
        logout();
        setError('Admins must use the Admin login button');
        return;
      }
      navigate(user.role === 'admin' ? '/admin/applications' : '/dashboard');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card" onSubmit={onSubmit}>
        <h1>Hostel Allocation</h1>
        <p className="muted">{isAdmin ? 'Admin sign in' : 'Student sign in'}</p>

        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={onChange} required />

        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={onChange} required />

        {error && <div className="alert error">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? 'Signing in...' : isAdmin ? 'Login as Admin' : 'Login'}
        </button>

        {isAdmin ? (
          <p className="center">
            <button type="button" className="link-btn" onClick={() => switchMode(false)}>
              ← Back to student login
            </button>
          </p>
        ) : (
          <>
            <p className="muted center">
              New student? <Link to="/register">Create an account</Link>
            </p>
            <p className="center">
              <button type="button" className="link-btn" onClick={() => switchMode(true)}>
                Admin login
              </button>
            </p>
          </>
        )}
      </form>
    </div>
  );
}