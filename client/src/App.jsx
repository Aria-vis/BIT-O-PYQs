import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import UploadText from './pages/UploadText';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect the root URL straight to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Protected Route */}
        <Route
          path="/upload-text"
          element={
            <ProtectedRoute>
              <UploadText />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;