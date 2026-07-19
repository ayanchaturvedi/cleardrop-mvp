import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { supabase } from '../supabaseClient';
import { Package, Users, Share2, Copy, Check, Trash2, CheckCircle, User, Phone, MapPin, ClipboardList, LogOut, Settings, ArrowUp, ArrowDown, Plus, Upload, Building } from 'lucide-react';

const AdminDashboard = () => {
  const { 
    parcels: contextParcels, 
    drivers: contextDrivers, 
    milestoneSequence, 
    createParcel, 
    assignDriver, 
    deleteParcel,
    approveParcel,
    addDriver,
    removeDriver,
    addMilestoneStep,
    removeMilestoneStep,
    moveMilestoneStepUp,
    moveMilestoneStepDown,
    currentUser,
    branding,
    updateBranding,
    logout,
    isOffline
  } = useDatabase();

  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('parcels'); // 'parcels' | 'drivers' | 'milestones' | 'settings'

  // Local state for parcels and drivers to fetch persistent data from cloud
  const [drivers, setDrivers] = useState([]);
  const [parcels, setParcels] = useState([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      if (!supabase || isOffline) {
        setDrivers(contextDrivers);
        return;
      }
      try {
        const orgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';
        const { data, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('organization_id', orgId);
        if (data) {
          setDrivers(data.map(d => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
            vehicleNumber: d.vehicle_number,
            organizationId: d.organization_id
          })));
        }
      } catch (err) {
        console.error('Failed to fetch drivers directly:', err);
      }
    };

    const fetchParcels = async () => {
      if (!supabase || isOffline) {
        setParcels(contextParcels);
        return;
      }
      try {
        const orgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';
        const { data, error } = await supabase
          .from('parcels')
          .select('*')
          .eq('organization_id', orgId);
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
            delayReason: p.delay_reason,
            organizationId: p.organization_id
          })));
        }
      } catch (err) {
        console.error('Failed to fetch parcels directly:', err);
      }
    };

    fetchDrivers();
    fetchParcels();
  }, [currentUser, isOffline, contextDrivers, contextParcels]);

  // Forms State
  const [parcelForm, setParcelForm] = useState({
    senderName: '',
    recipientPhone: '',
    packageDetails: '',
    destination: ''
  });

  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    vehicleNumber: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    companyName: branding.companyName || '',
    supportPhone: branding.supportPhone || '',
    logoUrl: branding.logoUrl || '',
    serviceableCities: (branding.serviceableCities || []).join(', '),
    pricePerKm: branding.pricePerKm || 0,
    advancePercent: branding.advancePercent || 0
  });

  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [milestoneError, setMilestoneError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync settings form state when database branding updates
  useEffect(() => {
    setSettingsForm({
      companyName: branding.companyName || '',
      supportPhone: branding.supportPhone || '',
      logoUrl: branding.logoUrl || '',
      serviceableCities: (branding.serviceableCities || []).join(', '),
      pricePerKm: branding.pricePerKm || 0,
      advancePercent: branding.advancePercent || 0
    });
  }, [branding]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const newRequests = parcels.filter(p => p.status === 'Awaiting Org Approval');

  const filteredParcels = parcels.filter(p => {
    if (p.status === 'Awaiting Org Approval') return false;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || 
      (p.senderName || '').toLowerCase().includes(query) ||
      (p.trackingNumber || '').toLowerCase().includes(query) ||
      (p.recipientPhone || '').toLowerCase().includes(query);
    
    let matchesFilter = true;
    if (statusFilter === 'Delivered') matchesFilter = p.status === 'Delivered';
    if (statusFilter === 'In Transit') matchesFilter = p.status !== 'Delivered' && p.status !== 'Ready for Pickup' && p.status !== 'Awaiting Customer Payment' && !p.status.includes('Delay');
    if (statusFilter === 'Delayed') matchesFilter = p.status.includes('Delay');
    if (statusFilter === 'Pending Pickup') matchesFilter = p.status === 'Ready for Pickup';

    return matchesSearch && matchesFilter;
  });

  const activeParcels = filteredParcels.filter(p => p.status !== 'Delivered');
  const deliveredParcels = filteredParcels.filter(p => p.status === 'Delivered');

  // Helpers
  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Handlers
  const handleParcelChange = (e) => {
    setParcelForm({ ...parcelForm, [e.target.name]: e.target.value });
  };

  const handleCreateParcel = async (e) => {
    e.preventDefault();
    if (!branding.isVerified) {
      alert('Your organization must be verified to accept parcels.');
      return;
    }
    if (!parcelForm.senderName || !parcelForm.destination) return;
    
    const newParcelId = `p${Date.now()}`;
    const trackingNumber = `CD-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const orgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';
    
    const newParcel = {
      id: newParcelId,
      trackingNumber,
      senderName: parcelForm.senderName,
      recipientPhone: parcelForm.recipientPhone,
      packageDetails: parcelForm.packageDetails,
      destination: parcelForm.destination,
      status: 'Pending Pickup',
      organizationId: orgId
    };

    // Optimistically update local UI list
    setParcels(prev => [newParcel, ...prev]);

    setParcelForm({
      senderName: '',
      recipientPhone: '',
      packageDetails: '',
      destination: ''
    });

    if (supabase && !isOffline) {
      try {
        const { error } = await supabase.from('parcels').insert([{
          id: newParcelId,
          tracking_number: trackingNumber,
          sender_name: newParcel.senderName,
          recipient_phone: newParcel.recipientPhone,
          package_details: newParcel.packageDetails,
          destination: newParcel.destination,
          status: newParcel.status,
          organization_id: orgId
        }]);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase parcel insert failed:', err);
      }
    } else {
      createParcel(parcelForm);
    }
  };

  const handleDriverChange = (e) => {
    setDriverForm({ ...driverForm, [e.target.name]: e.target.value });
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    if (!driverForm.name || !driverForm.phone || !driverForm.vehicleNumber) return;

    const newDriverId = `d${Date.now()}`;
    const orgId = currentUser?.organizationId || '00000000-0000-0000-0000-000000000000';
    const newDriver = {
      id: newDriverId,
      name: driverForm.name,
      phone: driverForm.phone,
      vehicleNumber: driverForm.vehicleNumber,
      organizationId: orgId
    };

    // Optimistically update local UI list
    setDrivers(prev => [...prev, newDriver]);

    setDriverForm({
      name: '',
      phone: '',
      vehicleNumber: ''
    });

    if (supabase && !isOffline) {
      try {
        const { error } = await supabase.from('drivers').insert([{
          id: newDriverId,
          name: newDriver.name,
          phone: newDriver.phone,
          vehicle_number: newDriver.vehicleNumber,
          organization_id: orgId
        }]);
        if (error) throw error;
      } catch (err) {
        console.error('Supabase driver insert failed:', err);
      }
    } else {
      addDriver(driverForm);
    }
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    setMilestoneError('');
    if (!newMilestoneName.trim()) return;

    const success = addMilestoneStep(newMilestoneName.trim());
    if (success) {
      setNewMilestoneName('');
    } else {
      setMilestoneError('Milestone name already exists.');
    }
  };

  const handleSettingsChange = (e) => {
    setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm(prev => ({ ...prev, logoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updated = {
      ...settingsForm,
      serviceableCities: settingsForm.serviceableCities.split(',').map(s => s.trim()).filter(Boolean),
      pricePerKm: Number(settingsForm.pricePerKm),
      advancePercent: Number(settingsForm.advancePercent)
    };
    updateBranding(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleShare = async (parcelId, type) => {
    const url = `${window.location.origin}/${type}/${parcelId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${branding.companyName} ${type === 'track' ? 'Tracking' : 'Driver'} Link`,
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
          {parcel.status === 'Awaiting Org Approval' && (
             <button onClick={() => approveParcel(parcel.id)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
               Approve Request
             </button>
          )}
          {!isDelivered && parcel.status !== 'Awaiting Org Approval' && parcel.status !== 'Awaiting Customer Payment' && (
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
            {branding.logoUrl ? (
              <img src={branding.logoUrl} style={{ height: '24px', width: 'auto', maxHeight: '24px', objectFit: 'contain', borderRadius: '4px' }} alt="Brand Logo" />
            ) : (
              <Package size={24} color="var(--primary-color)" />
            )}
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '-0.02em' }}>
            {branding.companyName}
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

        {/* Profile Section & Log Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {currentUser?.name || 'Admin User'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {currentUser?.email || 'admin@cleardrop.com'}
              </span>
            </div>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: '2px solid var(--primary-light)'
            }}>
              {getInitials(currentUser?.name)}
            </div>
          </div>

          <button 
            onClick={logout} 
            className="btn btn-secondary" 
            style={{ 
              minHeight: '36px', 
              padding: '0 0.75rem', 
              fontSize: '0.85rem', 
              gap: '0.4rem',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-color)'
            }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </nav>

      {isOffline && (
        <div style={{ 
          backgroundColor: '#fef3c7', 
          borderBottom: '1px solid #fde68a', 
          color: '#b45309', 
          padding: '0.75rem 2rem', 
          fontSize: '0.875rem', 
          fontWeight: '600', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem' 
        }}>
          <span>⚠️ Connection Error: Unable to sync with live cloud database. Operating in local offline fallback mode.</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="container" style={{ padding: '2rem 1rem', flex: 1 }}>
        
        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          borderBottom: '1px solid var(--border-color)', 
          marginBottom: '2rem' 
        }}>
          <button 
            onClick={() => setActiveTab('requests')} 
            style={{ 
              padding: '0.75rem 1.25rem', 
              borderBottom: activeTab === 'requests' ? '3px solid var(--primary-color)' : '3px solid transparent', 
              fontWeight: '700', 
              fontSize: '0.95rem',
              color: activeTab === 'requests' ? 'var(--primary-color)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            New Requests
            {newRequests.length > 0 && (
              <span style={{ backgroundColor: 'var(--error)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                {newRequests.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('parcels')} 
            style={{ 
              padding: '0.75rem 1.25rem', 
              borderBottom: activeTab === 'parcels' ? '3px solid var(--primary-color)' : '3px solid transparent', 
              fontWeight: '700', 
              fontSize: '0.95rem',
              color: activeTab === 'parcels' ? 'var(--primary-color)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Parcels
          </button>
          <button 
            onClick={() => setActiveTab('drivers')} 
            style={{ 
              padding: '0.75rem 1.25rem', 
              borderBottom: activeTab === 'drivers' ? '3px solid var(--primary-color)' : '3px solid transparent', 
              fontWeight: '700', 
              fontSize: '0.95rem',
              color: activeTab === 'drivers' ? 'var(--primary-color)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Manage Drivers
          </button>
          <button 
            onClick={() => setActiveTab('milestones')} 
            style={{ 
              padding: '0.75rem 1.25rem', 
              borderBottom: activeTab === 'milestones' ? '3px solid var(--primary-color)' : '3px solid transparent', 
              fontWeight: '700', 
              fontSize: '0.95rem',
              color: activeTab === 'milestones' ? 'var(--primary-color)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Milestone Settings
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            style={{ 
              padding: '0.75rem 1.25rem', 
              borderBottom: activeTab === 'settings' ? '3px solid var(--primary-color)' : '3px solid transparent', 
              fontWeight: '700', 
              fontSize: '0.95rem',
              color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Organization Settings
          </button>
        </div>

        {/* Tab 1: Parcels */}
        {activeTab === 'parcels' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
            {/* Create Parcel Form */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={20} color="var(--primary-color)" /> New Parcel
              </h2>
              {!branding.isVerified && (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  Your organization is currently unverified. You cannot create new parcels until a Super Admin approves your account.
                </div>
              )}
              <form onSubmit={handleCreateParcel} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', opacity: branding.isVerified ? 1 : 0.6, pointerEvents: branding.isVerified ? 'auto' : 'none' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <User size={14} style={{ color: 'var(--text-secondary)' }} />
                    Sender Name
                  </label>
                  <input className="input-field" name="senderName" value={parcelForm.senderName} onChange={handleParcelChange} placeholder="e.g. Rohan Gupta" required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Phone size={14} style={{ color: 'var(--text-secondary)' }} />
                    Recipient Phone
                  </label>
                  <input className="input-field" name="recipientPhone" value={parcelForm.recipientPhone} onChange={handleParcelChange} placeholder="e.g. +91 91234 56789" required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Package size={14} style={{ color: 'var(--text-secondary)' }} />
                    Package Details
                  </label>
                  <input className="input-field" name="packageDetails" value={parcelForm.packageDetails} onChange={handleParcelChange} placeholder="e.g. Electronics (Laptop)" required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <MapPin size={14} style={{ color: 'var(--text-secondary)' }} />
                    Destination
                  </label>
                  <textarea className="input-field" name="destination" value={parcelForm.destination} onChange={handleParcelChange} rows="3" placeholder="e.g. 45, 12th Main Rd, Koramangala, Bengaluru" required style={{ resize: 'vertical' }} />
                </div>

                <button type="submit" disabled={!branding.isVerified} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', fontWeight: '700' }}>
                  Create Parcel
                </button>
              </form>
            </div>

            {/* Parcels Lists Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Search and Filter */}
              <div className="card" style={{ boxShadow: 'var(--shadow-md)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Search by Tracking ID, Sender, Phone..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 2 }}
                />
                <select 
                  className="input-field" 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Delivered">Delivered</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Pending Pickup">Pending Pickup</option>
                </select>
              </div>

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
        )}

        {/* Tab: New Requests */}
        {activeTab === 'requests' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Pending Organization Approvals
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {newRequests.map(p => (
                <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{p.trackingNumber}</h3>
                    <p style={{ margin: '0.2rem 0', color: 'var(--text-secondary)' }}>From: {p.senderName} | {p.recipientPhone}</p>
                    <p style={{ margin: '0.2rem 0', color: 'var(--text-secondary)' }}>Destination: {p.destination}</p>
                    <p style={{ margin: '0.2rem 0', color: 'var(--text-secondary)' }}>Details: {p.packageDetails}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => deleteParcel(p.id)} className="btn btn-secondary" style={{ color: 'var(--error)' }}>Reject</button>
                    <button onClick={() => approveParcel(p.id)} className="btn btn-primary">Approve Request</button>
                  </div>
                </div>
              ))}
              {newRequests.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No pending requests at this time.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Manage Drivers */}
        {activeTab === 'drivers' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Add Driver Form */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="var(--primary-color)" /> Add New Driver
              </h2>
              <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <User size={14} style={{ color: 'var(--text-secondary)' }} />
                    Full Name
                  </label>
                  <input className="input-field" name="name" value={driverForm.name} onChange={handleDriverChange} placeholder="e.g. Ramesh Kumar" required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Phone size={14} style={{ color: 'var(--text-secondary)' }} />
                    Phone Number
                  </label>
                  <input className="input-field" name="phone" value={driverForm.phone} onChange={handleDriverChange} placeholder="e.g. +91 99999 88888" required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Package size={14} style={{ color: 'var(--text-secondary)' }} />
                    Vehicle Number
                  </label>
                  <input className="input-field" name="vehicleNumber" value={driverForm.vehicleNumber} onChange={handleDriverChange} placeholder="e.g. KA-03-HA-1234" required />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', fontWeight: '700' }}>
                  Register Driver
                </button>
              </form>
            </div>

            {/* Drivers List */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Registered Drivers
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {drivers.map(driver => (
                  <div key={driver.id} style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--border-radius-md)', 
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--surface-color)'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>{driver.name}</h4>
                      <p style={{ margin: '0.2rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone: {driver.phone}</p>
                      <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>
                        Vehicle: {driver.vehicleNumber}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to remove ${driver.name}?`)) {
                          removeDriver(driver.id);
                        }
                      }}
                      className="btn"
                      style={{ padding: '0.5rem', minHeight: 'auto', color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      title="Remove Driver"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {drivers.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                    No registered drivers. Add one on the left.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Milestone Settings */}
        {activeTab === 'milestones' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Add Custom Milestone */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="var(--primary-color)" /> Add Milestone Step
              </h2>
              
              {milestoneError && (
                <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', backgroundColor: '#fee2e2', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                  {milestoneError}
                </div>
              )}

              <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label">Step Name</label>
                  <input 
                    className="input-field" 
                    value={newMilestoneName} 
                    onChange={(e) => setNewMilestoneName(e.target.value)} 
                    placeholder="e.g. Out for Sorting" 
                    required 
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Note: New steps are inserted automatically before the final "Delivered" step.
                  </p>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', fontWeight: '700' }}>
                  Add Step
                </button>
              </form>
            </div>

            {/* Milestones Sequence List */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={20} color="var(--primary-color)" /> Milestone Pipeline
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {milestoneSequence.map((step, index) => {
                  const isDelivered = step === 'Delivered';
                  const isFirst = index === 0;
                  
                  return (
                    <div key={step} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem 1rem', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--border-radius-sm)', 
                      backgroundColor: 'var(--surface-color)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--primary-color)' }}>{index + 1}.</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{step}</span>
                        {isDelivered && (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            backgroundColor: '#e0f2fe', 
                            color: '#0369a1', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '999px', 
                            fontWeight: '700' 
                          }}>
                            TERMINAL
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {/* Move Up */}
                        {!isDelivered && !isFirst && (
                          <button 
                            onClick={() => moveMilestoneStepUp(index)} 
                            className="btn btn-secondary" 
                            style={{ minHeight: '32px', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                        )}
                        {/* Move Down */}
                        {!isDelivered && index < milestoneSequence.length - 2 && (
                          <button 
                            onClick={() => moveMilestoneStepDown(index)} 
                            className="btn btn-secondary" 
                            style={{ minHeight: '32px', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        )}
                        {/* Remove */}
                        {!isDelivered ? (
                          <button 
                            onClick={() => removeMilestoneStep(step)} 
                            className="btn btn-secondary" 
                            style={{ minHeight: '32px', padding: '0.25rem 0.5rem', color: 'var(--error)' }} 
                            title="Remove Step"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <button 
                            disabled 
                            className="btn btn-secondary" 
                            style={{ minHeight: '32px', padding: '0.25rem 0.5rem', opacity: 0.3 }} 
                            title="Delivered cannot be removed"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Organization Settings */}
        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
            
            {/* Branding form */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={20} color="var(--primary-color)" /> Branding Details
              </h2>

              {saveSuccess && (
                <div style={{ color: 'var(--primary-hover)', fontSize: '0.85rem', marginBottom: '1rem', backgroundColor: 'var(--primary-light)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontWeight: '600' }}>
                  ✓ Settings saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label">Company Name</label>
                  <input 
                    className="input-field" 
                    name="companyName" 
                    value={settingsForm.companyName} 
                    onChange={handleSettingsChange} 
                    placeholder="e.g. ClearDrop Logistics" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label">Support Phone Number</label>
                  <input 
                    className="input-field" 
                    name="supportPhone" 
                    value={settingsForm.supportPhone} 
                    onChange={handleSettingsChange} 
                    placeholder="e.g. +91 1800 123 4567" 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label">Brand Logo (Direct Image URL)</label>
                  <input 
                    className="input-field" 
                    name="logoUrl" 
                    value={settingsForm.logoUrl} 
                    onChange={handleSettingsChange} 
                    placeholder="e.g. https://domain.com/logo.png" 
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '0.5rem 0' }}>— OR —</span>
                  
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px dashed var(--border-color)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                    <Upload size={16} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Upload Logo Image File</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', fontWeight: '700', marginTop: '0.5rem' }}>
                  Save Branding Settings
                </button>
              </form>
            </div>

            {/* Live Branding Preview */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Branding Preview
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                This is a live preview of how your brand details will render across all user dashboards.
              </p>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
                {/* Header Preview */}
                <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {settingsForm.logoUrl ? (
                      <img src={settingsForm.logoUrl} style={{ height: '20px', width: 'auto', maxHeight: '20px', objectFit: 'contain', borderRadius: '2px' }} alt="Brand Logo" />
                    ) : (
                      <Package size={20} color="var(--primary-color)" />
                    )}
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '-0.02em' }}>
                    {settingsForm.companyName || 'ClearDrop'}
                  </span>
                </div>

                {/* Info Preview */}
                <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Support Contact Number: <strong>{settingsForm.supportPhone || '+91 1800 123 4567'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Marketplace form */}
            <div className="card" style={{ boxShadow: 'var(--shadow-md)', gridColumn: '1 / -1' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Marketplace Configuration
              </h2>
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="label">Serviceable Cities (Comma separated)</label>
                  <input className="input-field" name="serviceableCities" value={settingsForm.serviceableCities} onChange={handleSettingsChange} placeholder="e.g. Mumbai, Delhi, Bengaluru" />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <label className="label">Price per KM (₹)</label>
                    <input className="input-field" type="number" name="pricePerKm" value={settingsForm.pricePerKm} onChange={handleSettingsChange} min="0" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <label className="label">Advance Required (%)</label>
                    <input className="input-field" type="number" name="advancePercent" value={settingsForm.advancePercent} onChange={handleSettingsChange} min="0" max="100" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', fontWeight: '700' }}>
                  Save Marketplace Settings
                </button>
              </form>
            </div>



          </div>
        )}

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
