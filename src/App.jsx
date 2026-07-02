import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import AdminDashboard from './pages/AdminDashboard'
import DriverInterface from './pages/DriverInterface'
import CustomerTracking from './pages/CustomerTracking'
import Login from './pages/Login'
import { useDatabase } from './context/DatabaseContext'

// Simple Router Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useDatabase();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/driver/:parcelId" element={<DriverInterface />} />
      <Route path="/track/:parcelId" element={<CustomerTracking />} />
    </Routes>
  )
}

export default App
