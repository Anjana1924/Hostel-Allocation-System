import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../api.js';
import Layout from '../../components/Layout.jsx';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [settings, setSettings] = useState(null);
  const [filter, setFilter] = useState('');
  const [strategy, setStrategy] = useState('fcfs');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [apps, st] = await Promise.all([
        api.get('/admin/applications', { params: filter ? { status: filter } : {} }),
        api.get('/admin/settings'),
      ]);
      setApplications(apps.data.applications);
      setAcademicYear(apps.data.academicYear);
      setSettings(st.data.settings);
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const runAllocation = async () => {
    if (!window.confirm('Allocate beds to all pending and waitlisted applications?')) return;
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await api.post('/admin/allocate', { strategy });
      setMessage({
        type: 'success',
        text: `Done: ${data.allocated} allocated, ${data.waitlisted} waitlisted, ${data.skipped} skipped (of ${data.total}).`,
      });
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const toggleWindow = async () => {
    try {
      const { data } = await api.put('/admin/settings', {
        applicationsOpen: !settings.applicationsOpen,
      });
      setSettings(data.settings);
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  return (
    <Layout>
      <div className="panel">
        <div className="row-between">
          <div>
            <h2>Applications</h2>
            <p className="muted">Academic year {academicYear}</p>
          </div>
          {settings && (
            <button className="link-btn" onClick={toggleWindow}>
              Applications are {settings.applicationsOpen ? 'OPEN (click to close)' : 'CLOSED (click to open)'}
            </button>
          )}
        </div>

        <div className="toolbar">
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="fcfs">First come, first served</option>
            <option value="year">Senior students first</option>
          </select>
          <button onClick={runAllocation} disabled={busy}>
            {busy ? 'Allocating...' : 'Run allocation'}
          </button>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}
      </div>

      <div className="panel scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th><th>Reg no</th><th>Gender</th><th>Year</th>
              <th>Preference</th><th>Submitted</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 && (
              <tr><td colSpan="7" className="muted">No applications.</td></tr>
            )}
            {applications.map((a) => (
              <tr key={a._id}>
                <td>{a.student?.name}</td>
                <td>{a.student?.regNo}</td>
                <td>{a.student?.gender}</td>
                <td>{a.student?.year}</td>
                <td>
                  {a.preferredHostel || 'Any'} / {a.preferredFloor ? `Floor ${a.preferredFloor}` : 'Any'}
                </td>
                <td>{new Date(a.submittedAt).toLocaleString()}</td>
                <td><span className={`status ${a.status}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}