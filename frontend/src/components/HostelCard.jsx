export default function HostelCard({ hostel }) {
  const pct = hostel.total ? Math.round((hostel.occupied / hostel.total) * 100) : 0;

  return (
    <div className="panel hostel-card">
      <div className="row-between">
        <h3>Hostel {hostel.name}</h3>
        <span className={`tag ${hostel.genderType}`}>
          {hostel.genderType === 'female' ? 'Girls' : 'Boys'}
        </span>
      </div>

      <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
      <p className="muted">
        {hostel.available} of {hostel.total} beds free ({pct}% full)
      </p>

      <table className="mini">
        <thead>
          <tr><th>Floor</th><th>Free</th><th>Total</th></tr>
        </thead>
        <tbody>
          {hostel.floors.map((f) => (
            <tr key={f.floor}>
              <td>{f.floor}</td>
              <td>{f.available}</td>
              <td>{f.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}