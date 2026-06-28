import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { Package, Users, Share2, Copy, Check, Trash2, CheckCircle, User, Phone, MapPin, ClipboardList, LogOut } from 'lucide-react';

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
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      backgroundColor: isDelivered ? '#f8fafc' : 'var(--surface-color)',
      transition: 'transform 0.2s, box-shadow 0.2s',
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
          <p style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MapPin size={14} style={{ flexShrink: 0 }} /> {parcel.destination}
          </p>
          <span style={{ 
            display: 'inline-block', 
            padding: '0.25rem 0.75rem', 
            backgroundColor: isDelivered ? 'var(--success)' : 'var(--primary-light)', 
            color: isDelivered ? 'white' : 'var(--primary-hover)',
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
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!isDelivered && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <select 
                className="input-field" 
                style={{ padding: '0.25rem 0.5rem', minHeight: '36px', width: 'auto', fontSize: '0.875rem', borderRadius: 'var(--border-radius-sm)' }}
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
            style={{ 
              padding: '0.5rem', 
              minHeight: 'auto', 
              color: 'var(--text-secondary)', 
              borderRadius: 'var(--border-radius-sm)',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="Delete Parcel"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <button onClick={() => handleShare(parcel.id, 'driver')} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.875rem', minHeight: '40px' }}>
          {copiedId === `${parcel.id}-driver` ? <Check size={16} color="var(--success)" /> : <Share2 size={16} />} 
          Driver Link
        </button>
        <button onClick={() => handleShare(parcel.id, 'track')} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.875rem', minHeight: '40px' }}>
          {copiedId === `${parcel.id}-track` ? <Check size={16} color="var(--success)" /> : <Copy size={16} />} 
          Tracking Link
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      {/* Top Navigation Bar */}
      <nav style={{ 
        backgroundColor: 'var(--surface-color)', 
        borderBottom: '1px solid var(--border-color)', 
        padding: '0.75rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            backgroundColor: 'var(--primary-light)', 
            padding: '0.5rem', 
            borderRadius: 'var(--border-radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={24} color="var(--primary-color)" />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '-0.02em' }}>
            ClearDrop
          </span>
          <span style={{ 
            fontSize: '0.75rem', 
            backgroundColor: 'var(--bg-color)', 
            color: 'var(--text-secondary)', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            Admin Dashboard
          </span>
        </div>

        {/* Profile Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Ayan Chaturvedi</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ayanchaturvedi09@gmail.com</span>
          </div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '1rem',
            border: '2px solid var(--primary-light)'
          }}>
            AC
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Create Parcel Form */}
          <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={20} color="var(--primary-color)" /> New Parcel
            </h2>
            <form onSubmit={handleCreateParcel} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <User size={14} style={{ color: 'var(--text-secondary)' }} />
                  Sender Name
                </label>
                <input className="input-field" name="senderName" value={formData.senderName} onChange={handleInputChange} placeholder="e.g. Rohan Gupta" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Phone size={14} style={{ color: 'var(--text-secondary)' }} />
                  Recipient Phone
                </label>
                <input className="input-field" name="recipientPhone" value={formData.recipientPhone} onChange={handleInputChange} placeholder="e.g. +91 91234 56789" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Package size={14} style={{ color: 'var(--text-secondary)' }} />
                  Package Details
                </label>
                <input className="input-field" name="packageDetails" value={formData.packageDetails} onChange={handleInputChange} placeholder="e.g. Electronics (Laptop)" required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <MapPin size={14} style={{ color: 'var(--text-secondary)' }} />
                  Destination
                </label>
                <textarea className="input-field" name="destination" value={formData.destination} onChange={handleInputChange} rows="3" placeholder="e.g. 45, 12th Main Rd, Koramangala, Bengaluru" required style={{ resize: 'vertical' }} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', fontWeight: '700' }}>
                Create Parcel
              </button>
            </form>
          </div>

          {/* Parcels Lists Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Active Parcels List */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="var(--primary-color)" /> Active Parcels
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeParcels.map(p => renderParcelCard(p))}
                {activeParcels.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0', fontSize: '0.95rem' }}>
                    No active parcels. Create one on the left to get started!
                  </p>
                )}
              </div>
            </div>

            {/* Delivered Parcels List */}
            {deliveredParcels.length > 0 && (
              <div className="card" style={{ opacity: 0.95, boxShadow: 'var(--shadow-md)' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={20} color="var(--success)" /> Delivered Parcels
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {deliveredParcels.map(p => renderParcelCard(p, true))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 992px) {
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
        }
        @media (max-width: 600px) {
          nav { padding: 0.75rem 1rem !important; }
          nav span:not([style*="font-size: 1.25rem"]) { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
