import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import api, { errorMessage } from '../api.js';
import Layout from '../components/Layout.jsx';

const statusText = {
  pending: 'Pending: waiting for the warden to run allocation',
  approved: 'Approved: a bed has been allocated to you',
  waitlisted: 'Waitlisted: no bed was free, you will be allocated when one opens up',
  cancelled: 'Cancelled',
};

export default function Apply() {
  const { user } = useAuth();
  const hostelOptions = user.gender === 'female' ? ['A'] : ['B', 'C', 'D'];

  const [info, setInfo] = useState(null); 
  const [form, setForm] = useState({ preferredHostel: '', preferredFloor: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = () =>
    api
      .get('/applications/me')
      .then((res) => setInfo(res.data))
      .catch((err) => setMessage({ type: 'error', text: errorMessage(err) }));

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/applications', {
        preferredHostel: form.preferredHostel || undefined,
        preferredFloor: form.preferredFloor ? Number(form.preferredFloor) : undefined,
      });
      setMessage({ type: 'success', text: 'Application submitted.' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };


  const startEdit = () => {
    const a = info.application;
    setForm({ preferredHostel: a.preferredHostel || '', preferredFloor: a.preferredFloor ? String(a.preferredFloor) : '' });
    setMessage({ type: '', text: '' });
    setEditing(true);
  };


  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/applications/me', {
        preferredHostel: form.preferredHostel || undefined,
        preferredFloor: form.preferredFloor ? Number(form.preferredFloor) : undefined,
      });
      setMessage({ type: 'success', text: 'Preferences updated.' });
      setEditing(false);
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Withdraw your application?')) return;
    try {
      await api.delete('/applications/me');
      setMessage({ type: 'success', text: 'Application cancelled.' });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  if (!info) return <Layout><p className="muted">Loading...</p></Layout>;

  const app = info.application;
  const hasActive = app && app.status !== 'cancelled';

  return (
    <Layout>
      <div className="panel">
        <h2>Hostel application</h2>
        <p className="muted">Academic year {info.academicYear}</p>

        {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}

        {hasActive && !editing ? (
          <>
            <div className="alert info">{statusText[app.status]}</div>
            <p>
              Hostel preference: <strong>{app.preferredHostel || 'Any'}</strong> · Floor preference:{' '}
              <strong>{app.preferredFloor || 'Any'}</strong>
            </p>
            <p className="muted">Submitted {new Date(app.submittedAt).toLocaleString()}</p>
            {app.status !== 'approved' && (
              <div className="toolbar">
                <button onClick={startEdit}>Edit preferences</button>
                <button className="danger" onClick={cancel}>Withdraw application</button>
              </div>
            )}
          </>
        ) : !editing && !info.applicationsOpen ? (
          <div className="alert error">Applications are currently closed.</div>
        ) : (
          <form onSubmit={editing ? saveEdit : submit}>
            <p className="muted">
              {user.gender === 'female'
                ? 'Girls are placed in Hostel A.'
                : 'Boys are placed in Hostel B, C or D.'}{' '}
              Preferences are optional and are honoured when beds are available.
            </p>

            <label>Preferred hostel</label>
            <select name="preferredHostel" value={form.preferredHostel} onChange={onChange}>
              <option value="">No preference</option>
              {hostelOptions.map((h) => (
                <option key={h} value={h}>Hostel {h}</option>
              ))}
            </select>

            <label>Preferred floor</label>
            <select name="preferredFloor" value={form.preferredFloor} onChange={onChange}>
              <option value="">No preference</option>
              {[1, 2, 3, 4].map((f) => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>

            <button type="submit" disabled={busy}>
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Submit application'}
            </button>
            {editing && (
              <button type="button" className="link-btn" onClick={() => setEditing(false)}>Cancel</button>
            )}
          </form>
        )}
      </div>
    </Layout>
  );
}