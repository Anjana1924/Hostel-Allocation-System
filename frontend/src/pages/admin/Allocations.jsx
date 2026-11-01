import { useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../../api.js';
import Layout from '../../components/Layout.jsx';

export default function Allocations() {
  const [rows, setRows] = useState([]);
  const [academicYear, setAcademicYear] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const load = () =>
    api
      .get('/admin/allocations')
      .then((res) => {
        setRows(res.data.allocations);
        setAcademicYear(res.data.academicYear);
      })
      .catch((err) => setMessage({ type: 'error', text: errorMessage(err) }));

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.student?.name.toLowerCase().includes(q) ||
        r.student?.regNo.toLowerCase().includes(q) ||
        r.bed?.roomNo.includes(q)
    );
  }, [rows, search]);

  const vacate = async (row) => {
    if (!window.confirm(`Vacate ${row.student?.name}?`)) return;
    try {
      await api.delete(`/admin/allocations/${row._id}`);
      await load();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };


  const downloadCsv = async () => {
    try {
      const res = await api.get('/admin/allocations/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `allocations-${academicYear.replace('/', '-')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  return (
    <Layout>
      <div className="panel">
        <div className="row-between">
          <div>
            <h2>Allocations</h2>
            <p className="muted">
              Academic year {academicYear} · {rows.length} students housed
            </p>
          </div>
          <button className="link-btn" onClick={downloadCsv}>Download CSV</button>
        </div>
        <div className="toolbar">
          <input
            placeholder="Search by name, reg no or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}
      </div>

      <div className="panel scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th><th>Reg no</th><th>Year</th><th>Hostel</th>
              <th>Floor</th><th>Room</th><th>Bed</th><th></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan="8" className="muted">No allocations.</td></tr>
            )}
            {visible.map((r) => (
              <tr key={r._id}>
                <td>{r.student?.name}</td>
                <td>{r.student?.regNo}</td>
                <td>{r.student?.year}</td>
                <td>{r.hostel?.name}</td>
                <td>{r.bed?.floor}</td>
                <td>{r.bed?.roomNo}</td>
                <td>{r.bed?.bedNo}</td>
                <td><button className="link-btn" onClick={() => vacate(r)}>Vacate</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}