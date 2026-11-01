import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import api, { errorMessage } from '../api.js';
import Layout from '../components/Layout.jsx';
import HostelCard from '../components/HostelCard.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/hostels')
      .then((res) => setHostels(res.data.hostels))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  return (
    <Layout>
      <div className="panel">
        <h2>Welcome, {user.name}</h2>
        {user.role === 'student' ? (
          <p className="muted">
            Reg no: {user.regNo} · Year {user.year} · {user.department} ·{' '}
            {user.gender === 'female' ? 'Hostel A (girls)' : 'Hostel B, C or D (boys)'}
          </p>
        ) : (
          <p className="muted">Administrator account</p>
        )}
      </div>

      <h3 className="section-title">Bed availability</h3>
      {error && <div className="alert error">{error}</div>}
      {!error && hostels.length === 0 && (
        <p className="muted">No hostels found. Run <code>npm run seed</code> in the backend.</p>
      )}
      <div className="cards">
        {hostels.map((h) => (
          <HostelCard key={h._id} hostel={h} />
        ))}
      </div>
    </Layout>
  );
}