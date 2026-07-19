import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import AdminDashboard from './pages/AdminDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import DriverInterface from './pages/DriverInterface'
import CustomerTracking from './pages/CustomerTracking'
import Login from './pages/Login'
import CustomerDashboard from './pages/CustomerDashboard'
import DriverDashboard from './pages/DriverDashboard'
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
  const { currentUser } = useDatabase();

  const RootDashboard = () => {
    if (currentUser?.role === 'super_admin') {
      return <SuperAdminDashboard />;
    }
    if (currentUser?.role === 'customer') {
      return <CustomerDashboard />;
    }
    // Default to business_owner dashboard
    return <AdminDashboard />;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <RootDashboard />
          </ProtectedRoute>
        } 
      />
      {/* Driver Interface & Driver Dashboard */}
      <Route path="/driver/:parcelId" element={<DriverInterface />} />
      <Route path="/driver-portal/:driverId" element={<DriverDashboard />} />
      
      {/* Customer Public Tracking */}
      <Route path="/track/:parcelId" element={<CustomerTracking />} />
    </Routes>
  )
}

export default App
