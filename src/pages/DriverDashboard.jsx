import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { supabase } from '../supabaseClient';
import { Package, MapPin, CheckCircle, Search, Filter, ExternalLink } from 'lucide-react';

const DriverDashboard = () => {
  const { driverId } = useParams();
  const { 
    parcels: contextParcels, 
    drivers: contextDrivers, 
    branding,
    isOffline,
    isLoading
  } = useDatabase();

  const [parcels, setParcels] = useState([]);
  const [driver, setDriver] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    // Find driver
    const d = contextDrivers.find(d => d.id === driverId);
    if (d) setDriver(d);

    const fetchParcels = async () => {
      if (!supabase || isOffline) {
        setParcels(contextParcels.filter(p => p.currentDriverId === driverId));
        return;
      }
      try {
        const { data } = await supabase
          .from('parcels')
          .select('*')
          .eq('current_driver_id', driverId);
        if (data) {
          setParcels(data.map(p => ({
            id: p.id,
            trackingNumber: p.tracking_number,
            senderName: p.sender_name,
            recipientPhone: p.recipient_phone,
            packageDetails: p.package_details,
            destination: p.destination,
            currentDriverId: p.current_driver_id,
            status: p.status,
            delayReason: p.delay_reason
          })));
        }
      } catch (err) {
        console.error('Failed to fetch parcels directly:', err);
      }
    };

    fetchParcels();
  }, [driverId, contextParcels, contextDrivers, isOffline]);

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!driver) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Driver not found</div>;
  }

  const filteredParcels = parcels.filter(p => {
    // Search
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (p.senderName || '').toLowerCase().includes(query) ||
      (p.trackingNumber || '').toLowerCase().includes(query) ||
      (p.recipientPhone || '').toLowerCase().includes(query);
    
    // Filter
    let matchesFilter = true;
    if (statusFilter === 'Delivered') matchesFilter = p.status === 'Delivered';
    if (statusFilter === 'In Transit') matchesFilter = p.status !== 'Delivered' && p.status !== 'Ready for Pickup' && !p.status.includes('Delay');
    if (statusFilter === 'Delayed') matchesFilter = p.status.includes('Delay');
    if (statusFilter === 'Pending Pickup') matchesFilter = p.status === 'Ready for Pickup';

    return matchesSearch && matchesFilter;
  });

  const activeParcels = filteredParcels.filter(p => p.status !== 'Delivered');
  const deliveredParcels = filteredParcels.filter(p => p.status === 'Delivered');

  const renderParcelCard = (parcel, isDelivered = false) => (
    <div key={parcel.id} style={{ 
      border: '1px solid var(--border-color)', 
      borderRadius: 'var(--border-radius-md)', 
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      backgroundColor: isDelivered ? '#f8fafc' : 'var(--surface-color)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700' }}>
              {parcel.trackingNumber}
            </h3>
            {isDelivered && <CheckCircle size={16} color="var(--success)" />}
          </div>
          <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Sender: {parcel.senderName} | {parcel.recipientPhone}
          </p>
          <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={14} style={{ flexShrink: 0 }} /> {parcel.destination}
          </p>
          <span style={{ 
            display: 'inline-block', 
            padding: '0.25rem 0.75rem', 
            backgroundColor: isDelivered ? 'var(--success)' : (parcel.status.includes('Delay') ? '#fef3c7' : 'var(--primary-light)'), 
            color: isDelivered ? 'white' : (parcel.status.includes('Delay') ? '#b45309' : 'var(--primary-hover)'),
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: '700',
            marginTop: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {parcel.status}
          </span>
        </div>
        
        <Link 
          to={`/driver/${parcel.id}`} 
          className="btn btn-primary" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
        >
          <ExternalLink size={16} /> Update Status
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.5rem', borderRadius: 'var(--border-radius-md)' }}>
            {branding.logoUrl ? <img src={branding.logoUrl} style={{ height: '24px' }} alt="Logo" /> : <Package size={24} color="var(--primary-color)" />}
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-color)' }}>
            {branding.companyName || 'ClearDrop'}
          </span>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
            Driver Dashboard
          </span>
        </div>
        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
          Welcome, {driver.name}
        </div>
      </nav>

      <div className="container" style={{ padding: '2rem 1rem', flex: 1, maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>My Assigned Parcels</h1>

        {/* Search and Filter */}
        <div className="card" style={{ boxShadow: 'var(--shadow-md)', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flex: 2, alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '0 0.75rem' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Search by Tracking ID, Sender, Phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0.75rem', width: '100%', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '0 0.75rem' }}>
            <Filter size={18} color="var(--text-secondary)" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '0.75rem', width: '100%', outline: 'none', cursor: 'pointer' }}
            >
              <option value="All">All Statuses</option>
              <option value="Delivered">Delivered</option>
              <option value="In Transit">In Transit</option>
              <option value="Delayed">Delayed</option>
              <option value="Pending Pickup">Pending Pickup</option>
            </select>
          </div>
        </div>

        {/* Parcels Lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Active Parcels
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {activeParcels.map(p => renderParcelCard(p))}
              {activeParcels.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                  No active parcels match your search.
                </p>
              )}
            </div>
          </div>

          {deliveredParcels.length > 0 && (
            <div className="card" style={{ opacity: 0.95, boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)' }}>
                Delivered Parcels
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {deliveredParcels.map(p => renderParcelCard(p, true))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
