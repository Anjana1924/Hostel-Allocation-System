import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../api.js';
import Layout from '../../components/Layout.jsx';

export default function Rooms() {
  const [hostels, setHostels] = useState([]);
  const [hostelId, setHostelId] = useState('');
  const [floor, setFloor] = useState(1);
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null); // { roomNo, bed }
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    api.get('/hostels').then((res) => {
      setHostels(res.data.hostels);
      if (res.data.hostels.length) setHostelId(res.data.hostels[0]._id);
    });
  }, []);

  const loadRooms = async () => {
    if (!hostelId) return;
    try {
      const res = await api.get(`/admin/hostels/${hostelId}/rooms`, { params: { floor } });
      setData(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  useEffect(() => {
    setSelected(null);
    loadRooms();
  }, [hostelId, floor]);

  // When a free bed is picked, load students that could sleep there
  useEffect(() => {
    if (!selected || selected.bed.status !== 'available' || !data) return;
    setStudentId('');
    api
      .get('/admin/students/unallocated', { params: { gender: data.hostel.genderType } })
      .then((res) => setStudents(res.data.students))
      .catch((err) => setMessage({ type: 'error', text: errorMessage(err) }));
  }, [selected]);

  const allocate = async () => {
    try {
      await api.post('/admin/allocations/manual', { studentId, bedId: selected.bed._id });
      setMessage({ type: 'success', text: 'Student allocated.' });
      setSelected(null);
      await loadRooms();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  const vacate = async () => {
    if (!window.confirm(`Vacate ${selected.bed.student?.name}?`)) return;
    try {
      await api.delete(`/admin/allocations/${selected.bed.allocationId}`);
      setMessage({ type: 'success', text: 'Bed vacated.' });
      setSelected(null);
      await loadRooms();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  const floors = hostels.find((h) => h._id === hostelId)?.floorsCount || 4;

  return (
    <Layout>
      <div className="panel">
        <h2>Rooms</h2>
        <p className="muted">Click a bed to allocate a student or vacate it.</p>

        <div className="toolbar">
          <select value={hostelId} onChange={(e) => setHostelId(e.target.value)}>
            {hostels.map((h) => (
              <option key={h._id} value={h._id}>
                Hostel {h.name} ({h.genderType === 'female' ? 'girls' : 'boys'})
              </option>
            ))}
          </select>
          <select value={floor} onChange={(e) => setFloor(Number(e.target.value))}>
            {Array.from({ length: floors }, (_, i) => i + 1).map((f) => (
              <option key={f} value={f}>Floor {f}</option>
            ))}
          </select>
        </div>
        {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}
      </div>

      {selected && (
        <div className="panel">
          <h3>Room {selected.roomNo}, bed {selected.bed.bedNo}</h3>
          {selected.bed.status === 'available' ? (
            <div className="toolbar">
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.regNo}, year {s.year})
                  </option>
                ))}
              </select>
              <button onClick={allocate} disabled={!studentId}>Allocate</button>
            </div>
          ) : (
            <div className="toolbar">
              <span>
                Occupied by <strong>{selected.bed.student?.name}</strong> ({selected.bed.student?.regNo})
              </span>
              <button className="danger" onClick={vacate}>Vacate</button>
            </div>
          )}
        </div>
      )}

      <div className="rooms-grid">
        {data?.rooms.map((room) => (
          <div className="room" key={room.roomNo}>
            <div className="room-no">{room.roomNo}</div>
            <div className="beds">
              {room.beds.map((bed) => (
                <button
                  key={bed._id}
                  className={`bed ${bed.status} ${selected?.bed._id === bed._id ? 'sel' : ''}`}
                  title={bed.student ? `${bed.student.name} (${bed.student.regNo})` : 'Free'}
                  onClick={() => setSelected({ roomNo: room.roomNo, bed })}
                >
                  {bed.bedNo}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}