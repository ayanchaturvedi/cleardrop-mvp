import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Package, Users, Share2, Copy, Check, Trash2, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { parcels, drivers, createParcel, assignDriver, deleteParcel } = useDatabase();
  const [copiedId, setCopiedId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    senderName: '',
    recipientPhone: '',
    packageDetails: '',
    destination: ''
  });

  const activeParcels = parcels.filter(p => p.status !== 'Delivered');
  const deliveredParcels = parcels.filter(p => p.status === 'Delivered');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateParcel = (e) => {
    e.preventDefault();
    if (!formData.senderName || !formData.destination) return;
    
    createParcel(formData);
    setFormData({
      senderName: '',
      recipientPhone: '',
      packageDetails: '',
      destination: ''
    });
  };

  const handleShare = async (parcelId, type) => {
    const url = `${window.location.origin}/${type}/${parcelId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ClearDrop ${type === 'track' ? 'Tracking' : 'Driver'} Link`,
          text: `Here is the ${type} link for parcel ${parcelId}`,
          url: url,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopiedId(`${parcelId}-${type}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const renderParcelCard = (parcel, isDelivered = false) => (
    <div key={parcel.id} style={{ 
      border: '1px solid var(--border-color)', 
      borderRadius: 'var(--border-radius-md)', 
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      backgroundColor: isDelivered ? 'var(--bg-color)' : 'var(--surface-color)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{parcel.trackingNumber}</h3>
            {isDelivered && <CheckCircle size={16} color="var(--success)" />}
          </div>
          <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            To: {parcel.destination}
          </p>
          <span style={{ 
            display: 'inline-block', 
            padding: '0.25rem 0.75rem', 
            backgroundColor: isDelivered ? 'var(--success)' : 'var(--primary-light)', 
            color: isDelivered ? 'white' : 'var(--primary-hover)',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            marginTop: '0.5rem'
          }}>
            {parcel.status}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
          {!isDelivered && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <select 
                className="input-field" 
                style={{ padding: '0.25rem 0.5rem', minHeight: 'auto', width: 'auto', fontSize: '0.875rem' }}
                value={parcel.currentDriverId || ''}
                onChange={(e) => assignDriver(parcel.id, e.target.value)}
              >
                <option value="" disabled>Assign Driver</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this parcel?')) {
                deleteParcel(parcel.id);
              }
            }} 
            className="btn" 
            style={{ padding: '0.25rem', minHeight: 'auto', color: 'var(--error)' }}
            title="Delete Parcel"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <button onClick={() => handleShare(parcel.id, 'driver')} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.875rem' }}>
          {copiedId === `${parcel.id}-driver` ? <Check size={16} color="var(--success)" /> : <Share2 size={16} />} 
          Driver Link
        </button>
        <button onClick={() => handleShare(parcel.id, 'track')} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.875rem' }}>
          {copiedId === `${parcel.id}-track` ? <Check size={16} color="var(--success)" /> : <Copy size={16} />} 
          Tracking Link
        </button>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Package size={32} color="var(--primary-color)" />
        <h1 style={{ color: 'var(--primary-color)' }}>ClearDrop Admin</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Create Parcel Form */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            New Parcel
          </h2>
          <form onSubmit={handleCreateParcel}>
            <div className="form-group">
              <label className="label">Sender Name</label>
              <input className="input-field" name="senderName" value={formData.senderName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label className="label">Recipient Phone</label>
              <input className="input-field" name="recipientPhone" value={formData.recipientPhone} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label className="label">Package Details</label>
              <input className="input-field" name="packageDetails" value={formData.packageDetails} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label className="label">Destination</label>
              <textarea className="input-field" name="destination" value={formData.destination} onChange={handleInputChange} rows="3" required style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Create Parcel
            </button>
          </form>
        </div>

        {/* Parcels Lists Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Active Parcels List */}
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={24} /> Active Parcels
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeParcels.map(p => renderParcelCard(p))}
              {activeParcels.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                  No active parcels.
                </p>
              )}
            </div>
          </div>

          {/* Delivered Parcels List */}
          {deliveredParcels.length > 0 && (
            <div className="card" style={{ opacity: 0.9 }}>
              <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
                <CheckCircle size={24} /> Delivered Parcels
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {deliveredParcels.map(p => renderParcelCard(p, true))}
              </div>
            </div>
          )}
          
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .card { padding: 1rem; }
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
