import { Routes, Route } from 'react-router-dom'
import './App.css'
import AdminDashboard from './pages/AdminDashboard'
import DriverInterface from './pages/DriverInterface'
import CustomerTracking from './pages/CustomerTracking'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/driver/:parcelId" element={<DriverInterface />} />
      <Route path="/track/:parcelId" element={<CustomerTracking />} />
    </Routes>
  )
}

export default App
