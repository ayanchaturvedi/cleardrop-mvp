import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { Camera, MapPin, Package as PackageIcon, CheckCircle2 } from 'lucide-react';

const DriverInterface = () => {
  const { parcelId } = useParams();
  const { getParcelById, getDriverById, getMilestonesForParcel, addMilestone, logDelay, milestoneSequence } = useDatabase();
  const fileInputRef = useRef(null);

  const [showDelaySelect, setShowDelaySelect] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  const parcel = getParcelById(parcelId);
  
  if (!parcel) {
    return (
      <div className="mobile-frame" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
        <h2>Parcel Not Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>The tracking link might be invalid.</p>
      </div>
    );
  }

  const driver = getDriverById(parcel.currentDriverId);
  const milestones = getMilestonesForParcel(parcelId);
  
  // Use dynamic sequence from database context
  const MILESTONES_SEQUENCE = milestoneSequence;
  
  // Filter out delays to evaluate progress index cleanly
  const standardMilestones = milestones.filter(m => MILESTONES_SEQUENCE.includes(m.statusName));
  
  let currentMilestoneIndex = -1;
  if (standardMilestones.length > 0) {
    const lastStandardMilestone = standardMilestones[standardMilestones.length - 1];
    currentMilestoneIndex = MILESTONES_SEQUENCE.indexOf(lastStandardMilestone.statusName);
  }
  const nextMilestone = MILESTONES_SEQUENCE[currentMilestoneIndex + 1];
  const isDelivered = currentMilestoneIndex === MILESTONES_SEQUENCE.length - 1;

  const handleMilestoneClick = (statusName) => {
    if (!driver) {
      alert("No driver assigned to this parcel!");
      return;
    }
    addMilestone(parcelId, statusName, driver.id);
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
        
        {/* Header */}
        <header style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.25rem', fontWeight: '800' }}>
            Driver Console
          </h1>
          {driver ? (
            <span style={{ 
              display: 'inline-block',
              fontSize: '0.75rem', 
              color: 'var(--primary-hover)', 
              fontWeight: '700',
              backgroundColor: 'var(--primary-light)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px'
            }}>
              Active: {driver.name}
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

        {/* Exception Delay Alert in Driver console if active */}
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

        {/* Status Actions */}
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
                    disabled={!driver}
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
                disabled={!driver}
              >
                ⚠️ Report Issue / Delay
              </button>

              {/* Delay Selector dropdown card */}
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
                        logDelay(parcelId, selectedReason, driver.id);
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

      </div>
    </div>
  );
};

export default DriverInterface;
