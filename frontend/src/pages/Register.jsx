import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errorMessage } from '../api.js';

const initial = {
  name: '',
  email: '',
  regNo: '',
  gender: '',
  year: '1',
  department: '',
  password: '',
  confirm: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState({ type: '', text: '' });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const hostelHint =
    form.gender === 'female'
      ? 'You will be placed in Hostel A (girls).'
      : form.gender === 'male'
      ? 'You will be placed in Hostel B, C or D (boys).'
      : '';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
    }
    if (form.password !== form.confirm) {
      return setMessage({ type: 'error', text: 'Passwords do not match.' });
    }
    setBusy(true);
    try {
      const { confirm, ...data } = form;
      await register({ ...data, year: Number(data.year) });
      navigate('/dashboard');
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card wide" onSubmit={onSubmit}>
        <h1>Student Registration</h1>
        <p className="muted">Create your account to apply for a hostel</p>

        <div className="grid">
          <div>
            <label>Full name</label>
            <input name="name" value={form.name} onChange={onChange} required />
          </div>
          <div>
            <label>Registration number</label>
            <input name="regNo" value={form.regNo} onChange={onChange} required />
          </div>
          <div>
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required />
          </div>
          <div>
            <label>Department</label>
            <input name="department" value={form.department} onChange={onChange} required />
          </div>
          <div>
            <label>Gender</label>
            <select name="gender" value={form.gender} onChange={onChange} required>
              <option value="">Select...</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>
          <div>
            <label>Academic year</label>
            <select name="year" value={form.year} onChange={onChange}>
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={onChange} required />
          </div>
          <div>
            <label>Confirm password</label>
            <input name="confirm" type="password" value={form.confirm} onChange={onChange} required />
          </div>
        </div>

        {hostelHint && <div className="alert info">{hostelHint}</div>}
        {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}

        <button type="submit" disabled={busy}>{busy ? 'Creating account...' : 'Register'}</button>
        <p className="muted center">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}