import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../api.js';
import Layout from '../../components/Layout.jsx';
import HostelCard from '../../components/HostelCard.jsx';

export default function Reports() {
  const [report, setReport] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/admin/reports/summary'), api.get('/hostels')])
      .then(([r, h]) => {
        setReport(r.data);
        setHostels(h.data.hostels);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <Layout><div className="alert error">{error}</div></Layout>;
  if (!report) return <Layout><p className="muted">Loading...</p></Layout>;

  const { beds, students, applications, byDepartment } = report;
  const pct = beds.total ? Math.round((beds.occupied / beds.total) * 100) : 0;

  return (
    <Layout>
      <div className="panel">
        <h2>Reports</h2>
        <p className="muted">Academic year {report.academicYear}</p>

        <div className="stats">
          <div><span>Total beds</span><strong>{beds.total}</strong></div>
          <div><span>Occupied</span><strong>{beds.occupied}</strong></div>
          <div><span>Free</span><strong>{beds.available}</strong></div>
          <div><span>Occupancy</span><strong>{pct}%</strong></div>
        </div>

        <div className="stats">
          <div><span>Registered students</span><strong>{students.total}</strong></div>
          <div><span>Housed</span><strong>{students.housed}</strong></div>
          <div><span>Without a bed</span><strong>{students.withoutBed}</strong></div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>Applications</h3>
          <table className="table">
            <tbody>
              {Object.entries(applications).map(([status, count]) => (
                <tr key={status}>
                  <td><span className={`status ${status}`}>{status}</span></td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>Housed students by department</h3>
          {byDepartment.length === 0 ? (
            <p className="muted">Nobody allocated yet.</p>
          ) : (
            <table className="table">
              <tbody>
                {byDepartment.map((d) => (
                  <tr key={d.department}><td>{d.department}</td><td>{d.count}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <h3 className="section-title">Occupancy by hostel</h3>
      <div className="cards">
        {hostels.map((h) => (
          <HostelCard key={h._id} hostel={h} />
        ))}
      </div>
    </Layout>
  );
}