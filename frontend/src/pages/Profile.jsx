import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import api, { errorMessage } from '../api.js';
import Layout from '../components/Layout.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();

  
  const [name, setName] = useState(user.name);
  const [nameMsg, setNameMsg] = useState({ type: '', text: '' });
  const [nameBusy, setNameBusy] = useState(false);

 
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [pw, setPw] = useState(empty);
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [pwBusy, setPwBusy] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    setNameBusy(true);
    setNameMsg({ type: '', text: '' });
    try {
      const res = await api.put('/auth/me', { name });
      setUser(res.data.user); // updates the name in the header too
      setNameMsg({ type: 'success', text: 'Name updated.' });
    } catch (err) {
      setNameMsg({ type: 'error', text: errorMessage(err) });
    } finally {
      setNameBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pw.newPassword !== pw.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPwBusy(true);
    try {
      await api.put('/auth/password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw(empty);
      setPwMsg({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      setPwMsg({ type: 'error', text: errorMessage(err) });
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <Layout>
      <div className="panel">
        <h2>My profile</h2>
        <p className="muted">
          {user.email}
          {user.regNo ? ` · ${user.regNo}` : ''}
        </p>

        <form onSubmit={saveName}>
          <label>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          {nameMsg.text && <div className={`alert ${nameMsg.type}`}>{nameMsg.text}</div>}
          <button type="submit" disabled={nameBusy}>{nameBusy ? 'Saving...' : 'Save name'}</button>
        </form>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Change password</h2>
        <form onSubmit={savePassword}>
          <label>Current password</label>
          <input
            type="password"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
          />

          <label>New password</label>
          <input
            type="password"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            minLength={6}
            required
          />

          <label>Confirm new password</label>
          <input
            type="password"
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            required
          />

          {pwMsg.text && <div className={`alert ${pwMsg.type}`}>{pwMsg.text}</div>}
          <button type="submit" disabled={pwBusy}>{pwBusy ? 'Updating...' : 'Update password'}</button>
        </form>
      </div>
    </Layout>
  );
}