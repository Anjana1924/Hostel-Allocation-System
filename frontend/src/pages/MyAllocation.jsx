import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api.js';
import Layout from '../components/Layout.jsx';

export default function MyAllocation() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/allocations/me')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <Layout><div className="alert error">{error}</div></Layout>;
  if (!data) return <Layout><p className="muted">Loading...</p></Layout>;

  const { allocation, roommates } = data;

  if (!allocation) {
    return (
      <Layout>
        <div className="panel">
          <h2>My room</h2>
          <p className="muted">
            You have not been allocated a bed yet. If you have not applied, go to{' '}
            <Link to="/apply">Apply</Link>. Otherwise wait for the warden to run allocation.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="panel">
        <h2>My room</h2>
        <p className="muted">Academic year {allocation.academicYear}</p>

        <div className="stats">
          <div><span>Hostel</span><strong>{allocation.hostel}</strong></div>
          <div><span>Floor</span><strong>{allocation.floor}</strong></div>
          <div><span>Room</span><strong>{allocation.roomNo}</strong></div>
          <div><span>Bed</span><strong>{allocation.bedNo}</strong></div>
        </div>

        <p className="muted">
          Allocated on {new Date(allocation.allocatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="panel">
        <h3>Roommates</h3>
        {roommates.length === 0 ? (
          <p className="muted">No roommates allocated yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Bed</th><th>Name</th><th>Department</th><th>Year</th></tr>
            </thead>
            <tbody>
              {roommates.map((r) => (
                <tr key={r.bedNo}>
                  <td>{r.bedNo}</td>
                  <td>{r.name}</td>
                  <td>{r.department}</td>
                  <td>{r.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}