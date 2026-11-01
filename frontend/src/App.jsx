import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Apply from './pages/Apply.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import MyAllocation from './pages/MyAllocation.jsx';
import Applications from './pages/admin/Applications.jsx';
import Rooms from './pages/admin/Rooms.jsx';
import Profile from './pages/Profile.jsx';
import Reports from './pages/admin/Reports.jsx';
import Allocations from './pages/admin/Allocations.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/apply"
        element={
          <ProtectedRoute role="student">
            <Apply />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-allocation"
        element={
          <ProtectedRoute role="student">
            <MyAllocation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute role="admin">
            <Applications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/hostels"
        element={
          <ProtectedRoute role="admin">
            <Rooms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
  }
/>

      <Route
        path="/admin/allocations"
        element={
          <ProtectedRoute role="admin">
            <Allocations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}