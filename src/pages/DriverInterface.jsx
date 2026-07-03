import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Camera, MapPin, Package as PackageIcon, CheckCircle2 } from 'lucide-react';

const DriverInterface = () => {
  const { parcelId } = useParams();
  const { 
    getParcelById, 
    getDriverById, 
    getMilestonesForParcel, 
    addMilestone, 
    logDelay, 
    transferParcel, 
    milestoneSequence, 
    drivers, 
    branding 
  } = useDatabase();

  const fileInputRef = useRef(null);

  const [showDelaySelect, setShowDelaySelect] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [showScanModal, setShowScanModal] = useState(false);

  const parcel = getParcelById(parcelId);

  // Track selected driver session simulation
  const [selectedDriverId, setSelectedDriverId] = useState('');

  // Sync selected driver state when parcel loads
  useEffect(() => {
    if (parcel) {
      setSelectedDriverId(parcel.currentDriverId || '');
    }
  }, [parcelId, parcel]);

  if (!parcel) {
    return (
      <div className="mobile-frame" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <h2>Parcel Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The tracking link might be invalid.</p>
      </div>
    );
  }

  const activeDriver = getDriverById(parcel.currentDriverId);
  const simulatedDriver = getDriverById(selectedDriverId);
  const milestones = getMilestonesForParcel(parcelId);

  const isAssignedViewing = selectedDriverId === parcel.currentDriverId;

  // Use dynamic sequence from database context
  const MILESTONES_SEQUENCE = milestoneSequence;
  
  // Filter out delays and transfers to evaluate progress index cleanly
  const standardMilestones = milestones.filter(m => MILESTONES_SEQUENCE.includes(m.statusName));
  
  let currentMilestoneIndex = -1;
  if (standardMilestones.length > 0) {
    const lastStandardMilestone = standardMilestones[standardMilestones.length - 1];
    currentMilestoneIndex = MILESTONES_SEQUENCE.indexOf(lastStandardMilestone.statusName);
  }
  const nextMilestone = MILESTONES_SEQUENCE[currentMilestoneIndex + 1];
  const isDelivered = currentMilestoneIndex === MILESTONES_SEQUENCE.length - 1;

  // Handoff QR visibility conditions
  const lastMilestone = milestones[milestones.length - 1];
  const isTransferred = lastMilestone?.statusName.startsWith('Package successfully transferred');
  const showQrCode = parcel.status === 'Arrived at Transfer Hub' && !isTransferred;

  const handleMilestoneClick = (statusName) => {
    if (!activeDriver) {
      alert("No driver assigned to this parcel!");
      return;
    }
    addMilestone(parcelId, statusName, activeDriver.id);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Simulated photo upload: ${file.name}`);
    }
  };

  return (
    <div className="mobile-frame">
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
        
        {/* Header Branding */}
        <header style={{ 
          textAlign: 'center', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} style={{ height: '20px', width: 'auto', maxHeight: '20px', objectFit: 'contain', borderRadius: '2px' }} alt="Brand Logo" />
            ) : (
              <PackageIcon size={20} color="var(--primary-color)" />
            )}
            <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '-0.01em' }}>
              {branding.companyName}
            </span>
          </div>

          {/* Active Assigned Driver Label */}
          {activeDriver ? (
            <span style={{ 
              display: 'inline-block',
              fontSize: '0.75rem', 
              color: 'var(--primary-hover)', 
              fontWeight: '700',
              backgroundColor: 'var(--primary-light)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px'
            }}>
              Assigned: {activeDriver.name}
            </span>
          ) : (
            <span style={{ 
              display: 'inline-block',
              fontSize: '0.75rem', 
              color: 'var(--error)', 
              fontWeight: '700',
              backgroundColor: '#fee2e2',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px'
            }}>
              No Driver Assigned
            </span>
          )}
        </header>

        {/* Simulation Driver Session Selector */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '0.75rem', 
          borderRadius: 'var(--border-radius-md)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Simulate Session As:
          </label>
          <select 
            className="input-field"
            style={{ minHeight: '36px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
          >
            <option value="" disabled>-- Select Driver --</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.vehicleNumber})</option>
            ))}
          </select>
        </div>

        {/* Handoff State Alert */}
        {isTransferred && isAssignedViewing && (
          <div style={{ 
            backgroundColor: 'var(--primary-light)', 
            border: '1px solid var(--success)', 
            borderRadius: 'var(--border-radius-md)', 
            padding: '0.75rem 1rem', 
            color: 'var(--primary-hover)',
            fontSize: '0.85rem',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ✓ Handoff verification successful! You have accepted this package.
          </div>
        )}

        {/* Exception Delay Alert */}
        {parcel.delayReason && (
          <div style={{ 
            backgroundColor: '#fffbeb', 
            border: '1px solid #fcd34d', 
            borderRadius: 'var(--border-radius-md)', 
            padding: '0.75rem 1rem', 
            color: '#b45309',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            ⚠️ Active Delay: {parcel.delayReason}
          </div>
        )}

        {/* Parcel Info Card */}
        <div className="card" style={{ boxShadow: 'var(--shadow-sm)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: 'var(--border-radius-sm)' }}>
              <PackageIcon size={20} color="var(--primary-color)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>{parcel.trackingNumber}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{parcel.packageDetails}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <MapPin size={20} color="var(--error)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '0.875rem', margin: '0 0 0.25rem 0', color: 'var(--text-secondary)', fontWeight: '600' }}>Destination</h3>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.4' }}>
                {parcel.destination}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Phone: {parcel.recipientPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Handoff QR Code Generator view for active driver */}
        {showQrCode && isAssignedViewing && (
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '0.75rem', 
            border: '2px dashed var(--primary-color)', 
            padding: '1.25rem', 
            backgroundColor: '#f0fdf4',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--primary-hover)', fontWeight: '700' }}>Handoff QR Code</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.3' }}>
              Show this QR code to the incoming driver to complete the transfer.
            </p>
            <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${parcel.id}`} 
                style={{ width: '150px', height: '150px' }} 
                alt="Handoff QR" 
              />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)' }}>ID: {parcel.id}</span>
          </div>
        )}

        {/* Handoff QR Code Scanner view for incoming driver */}
        {showQrCode && !isAssignedViewing && (
          <div className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem', 
            border: '1px solid var(--border-color)', 
            padding: '1.25rem',
            textAlign: 'center',
            backgroundColor: '#f8fafc'
          }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              This parcel is at the transfer hub. Switch driver or scan QR code to accept the handoff.
            </p>
            <button 
              className="btn btn-primary"
              style={{ width: '100%', minHeight: '48px', fontWeight: '700', marginTop: '0.25rem' }}
              onClick={() => {
                if (!selectedDriverId) {
                  alert("Please select a simulated driver first!");
                  return;
                }
                setShowScanModal(true);
              }}
            >
              📷 Scan QR to Accept Handoff
            </button>
          </div>
        )}

        {/* Standard Action panel */}
        {isAssignedViewing && (
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ 
              textTransform: 'uppercase', 
              fontSize: '0.75rem', 
              fontWeight: '700', 
              color: 'var(--text-secondary)', 
              letterSpacing: '0.05em',
              marginBottom: '0.25rem'
            }}>
              Actions
            </h3>

            {isDelivered ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '1.5rem', 
                backgroundColor: 'var(--primary-light)', 
                borderRadius: 'var(--border-radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle2 size={36} color="var(--success)" />
                <h4 style={{ color: 'var(--primary-hover)', margin: 0, fontWeight: '700' }}>Delivery Completed</h4>
              </div>
            ) : (
              <>
                {MILESTONES_SEQUENCE.map((milestone, index) => {
                  const isNext = milestone === nextMilestone;
                  if (!isNext) return null; 

                  return (
                    <button 
                      key={milestone}
                      className="btn btn-primary"
                      style={{ width: '100%', minHeight: '52px', fontSize: '1.1rem', fontWeight: '700' }} 
                      onClick={() => handleMilestoneClick(milestone)}
                      disabled={!simulatedDriver}
                    >
                      {milestone}
                    </button>
                  );
                })}

                {/* Delay Button */}
                <button 
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#fffbeb', 
                    color: '#d97706', 
                    border: '1px solid #fcd34d', 
                    fontWeight: '700',
                    minHeight: '48px'
                  }}
                  onClick={() => setShowDelaySelect(!showDelaySelect)}
                  disabled={!simulatedDriver}
                >
                  ⚠️ Report Issue / Delay
                </button>

                {/* Delay Selector */}
                {showDelaySelect && (
                  <div className="card" style={{ border: '1px solid #fcd34d', backgroundColor: '#fffbeb', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
                    <label className="label" style={{ color: '#b45309', margin: 0, fontWeight: '700', fontSize: '0.85rem' }}>Select Delay Reason:</label>
                    <select 
                      className="input-field" 
                      style={{ minHeight: '36px', padding: '0.25rem 0.5rem', fontSize: '0.9rem', borderColor: '#fcd34d' }}
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                    >
                      <option value="" disabled>-- Choose Reason --</option>
                      <option value="Traffic Delay">Traffic Delay</option>
                      <option value="Weather Exception">Weather Exception</option>
                      <option value="Vehicle Breakdown">Vehicle Breakdown</option>
                      <option value="Customer Unavailable">Customer Unavailable</option>
                    </select>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, minHeight: '36px', fontSize: '0.85rem', backgroundColor: '#d97706', color: 'white' }}
                        onClick={() => {
                          if (!selectedReason) return;
                          logDelay(parcelId, selectedReason, simulatedDriver.id);
                          setShowDelaySelect(false);
                          setSelectedReason('');
                        }}
                        disabled={!selectedReason}
                      >
                        Submit
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ flex: 1, minHeight: '36px', fontSize: '0.85rem', borderColor: '#cbd5e1' }}
                        onClick={() => {
                          setShowDelaySelect(false);
                          setSelectedReason('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Proof of Delivery Photo */}
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
            <button 
              className="btn btn-secondary" 
              style={{ width: '100%', minHeight: '48px', fontWeight: '600', marginTop: '0.25rem' }}
              onClick={() => fileInputRef.current.click()}
            >
              <Camera size={18} /> Take Proof of Delivery Photo
            </button>
          </div>
        )}

      </div>

      {/* Simulated Scanner Viewport Modal */}
      {showScanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', textAlign: 'center' }}>📷 QR Scanner Viewport</h3>
            
            {/* Camera Frame Simulation */}
            <div style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#000000',
              borderRadius: 'var(--border-radius-md)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--primary-color)'
            }}>
              {/* Pulsing red scan line */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '2px',
                backgroundColor: 'var(--success)',
                top: '50%',
                transform: 'translateY(-50%)',
                boxShadow: '0 0 8px var(--success)',
                animation: 'scan 1.5s infinite linear'
              }} />
              
              <div style={{ color: 'white', fontSize: '0.8rem', opacity: 0.6 }}>
                Position QR Code inside viewfinder...
              </div>
            </div>

            {/* Scan details */}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
              Simulating scan of parcel <strong>{parcel.trackingNumber}</strong> by incoming driver <strong>{simulatedDriver?.name}</strong>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, minHeight: '40px', fontSize: '0.9rem', color: 'white' }}
                onClick={() => {
                  if (!simulatedDriver) return;
                  transferParcel(parcel.id, simulatedDriver.id, simulatedDriver.name);
                  setShowScanModal(false);
                }}
              >
                Simulate Scan Success
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, minHeight: '40px', fontSize: '0.9rem' }}
                onClick={() => setShowScanModal(false)}
              >
                Close
              </button>
            </div>
          </div>
          
          <style>{`
            @keyframes scan {
              0% { top: 10%; }
              50% { top: 90%; }
              100% { top: 10%; }
            }
          `}</style>
        </div>
      )}

    </div>
  );
};

export default DriverInterface;
